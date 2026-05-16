import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const tender = await prisma.tender.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: true,
      tenderProducts: { include: { product: true } },
    },
  });

  if (!tender) return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });
  return NextResponse.json(tender);
}