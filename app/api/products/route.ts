import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const [data, total] = await Promise.all([
    prisma.product.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count(),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { name, sku, unitPrice, description } = await req.json();
  if (!name || !sku || unitPrice === undefined) {
    return NextResponse.json({ error: "name, sku y unitPrice son requeridos" }, { status: 422 });
  }
  if (unitPrice <= 0) {
    return NextResponse.json({ error: "unitPrice debe ser mayor a 0" }, { status: 422 });
  }

  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return NextResponse.json({ error: "SKU ya registrado" }, { status: 422 });

  const product = await prisma.product.create({
    data: { name, sku, unitPrice, description, createdById: user.id },
  });
  return NextResponse.json(product, { status: 201 });
}