import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, productId } = await params;
  const tenderId = parseInt(id);
  const prodId = parseInt(productId);

  const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!tender) return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });

  if (tender.status !== "activa") {
    return NextResponse.json({ error: "Solo se pueden eliminar productos de licitaciones activas" }, { status: 422 });
  }

  const tenderProduct = await prisma.tenderProduct.findUnique({
    where: { tenderId_productId: { tenderId, productId: prodId } },
  });
  if (!tenderProduct) return NextResponse.json({ error: "Producto no encontrado en la licitación" }, { status: 404 });

  const subtotal = Number(tenderProduct.unitPrice) * tenderProduct.quantity;

  await prisma.$transaction([
    prisma.tenderProduct.delete({
      where: { tenderId_productId: { tenderId, productId: prodId } },
    }),
    prisma.tender.update({
      where: { id: tenderId },
      data: { totalAmount: Number(tender.totalAmount) - subtotal, updatedById: user.id },
    }),
  ]);

  return NextResponse.json({ message: "Producto eliminado" });
}