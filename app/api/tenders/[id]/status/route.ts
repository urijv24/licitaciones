import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const TRANSITIONS: Record<string, string[]> = {
  activa: ["por_cobrar", "perdida"],
  por_cobrar: ["finalizada"],
  finalizada: [],
  perdida: [],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const tender = await prisma.tender.findUnique({ where: { id: parseInt(id) } });
  if (!tender) return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });

  const allowed = TRANSITIONS[tender.status];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Transición inválida: no se puede pasar de '${tender.status}' a '${status}'` },
      { status: 422 }
    );
  }

  const updated = await prisma.tender.update({
    where: { id: parseInt(id) },
    data: { status, updatedById: user.id },
  });

  return NextResponse.json(updated);
}