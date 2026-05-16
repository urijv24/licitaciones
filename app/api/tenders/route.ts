import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const status = searchParams.get("status") ?? undefined;

  const where = status ? { status: status as any } : {};

  const [data, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.tender.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { title, description, maxBudget, deadline, clientId } = await req.json();

  if (!title || !maxBudget || !clientId) {
    return NextResponse.json({ error: "title, maxBudget y clientId son requeridos" }, { status: 422 });
  }
  if (maxBudget <= 0) {
    return NextResponse.json({ error: "maxBudget debe ser mayor a 0" }, { status: 422 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 422 });

  
    const tender = await prisma.tender.create({
    data: {
      title,
      description,
      maxBudget,
      deadline: deadline ? new Date(deadline) : null,
      clientId,
      createdById: user.id,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json(tender, { status: 201 });
}