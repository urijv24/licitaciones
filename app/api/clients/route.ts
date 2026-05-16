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
    prisma.client.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.client.count(),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });

  const { name, email, phone } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "name y email son requeridos" }, { status: 422 });
  }

  const exists = await prisma.client.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email ya registrado" }, { status: 422 });

  const client = await prisma.client.create({
    data: { name, email, phone, createdById: user.id },
  });
  return NextResponse.json(client, { status: 201 });
}