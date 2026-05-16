import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const tenderId = parseInt(id);
  const { productId, quantity } = await req.json();

  if (!productId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "productId y quantity son requeridos" }, { status: 422 });
  }

  const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
  if (!tender) return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });

  // RN03 - solo licitaciones activas
  if (tender.status !== "activa") {
    return NextResponse.json(
      { error: "No se pueden agregar productos a una licitación no activa" },
      { status: 422 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 422 });

  // RN09 - duplicado
  const duplicate = await prisma.tenderProduct.findUnique({
    where: { tenderId_productId: { tenderId, productId } },
  });
  if (duplicate) {
    return NextResponse.json({ error: "El producto ya existe en esta licitación" }, { status: 422 });
  }

  // RN04 - presupuesto
  const subtotal = Number(product.unitPrice) * quantity;
  const newTotal = Number(tender.totalAmount) + subtotal;

  if (newTotal > Number(tender.maxBudget)) {
    const disponible = Number(tender.maxBudget) - Number(tender.totalAmount);
    return NextResponse.json(
      { error: `El total excede el presupuesto máximo de $${tender.maxBudget}. Disponible: $${disponible.toFixed(2)}` },
      { status: 422 }
    );
  }

  // Crear producto y actualizar total en una transacción
  const [tenderProduct] = await prisma.$transaction([
    prisma.tenderProduct.create({
      data: { tenderId, productId, quantity, unitPrice: product.unitPrice },
      include: { product: true },
    }),
    prisma.tender.update({
      where: { id: tenderId },
      data: { totalAmount: newTotal, updatedById: user.id },
    }),
  ]);

  return NextResponse.json(tenderProduct, { status: 201 });
}