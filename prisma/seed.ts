import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Usuario admin
  const hash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@empresa.com",
      passwordHash: hash,
      role: "admin",
    },
  });

  // Usuario normal
  const hash2 = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "user@empresa.com" },
    update: {},
    create: {
      name: "Usuario Demo",
      email: "user@empresa.com",
      passwordHash: hash2,
      role: "user",
    },
  });

  // Clientes
  const cliente1 = await prisma.client.upsert({
    where: { email: "licitaciones@banconacional.com" },
    update: {},
    create: { name: "Banco Nacional", email: "licitaciones@banconacional.com", phone: "+507 200-1000", createdById: admin.id },
  });

  const cliente2 = await prisma.client.upsert({
    where: { email: "compras@megacorp.com" },
    update: {},
    create: { name: "MegaCorp S.A.", email: "compras@megacorp.com", phone: "+507 314-5500", createdById: admin.id },
  });

  // Productos
  const prod1 = await prisma.product.upsert({
    where: { sku: "SRV-001" },
    update: {},
    create: { name: "Servidor Dell R740", sku: "SRV-001", unitPrice: 8500, description: "Servidor rack 2U", createdById: admin.id },
  });

  const prod2 = await prisma.product.upsert({
    where: { sku: "NET-022" },
    update: {},
    create: { name: "Switch 48 puertos", sku: "NET-022", unitPrice: 1100, description: "Switch Gigabit", createdById: admin.id },
  });

  const prod3 = await prisma.product.upsert({
    where: { sku: "LAP-001" },
    update: {},
    create: { name: "Laptop Dell Latitude", sku: "LAP-001", unitPrice: 1200, description: "Core i7 16GB", createdById: admin.id },
  });

  // Licitaciones
  await prisma.tender.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Infraestructura TI 2025",
      description: "Renovación de servidores y red",
      maxBudget: 45000,
      totalAmount: 0,
      clientId: cliente1.id,
      createdById: admin.id,
    },
  });

  await prisma.tender.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: "Equipos de cómputo",
      description: "Compra de laptops para oficinas",
      maxBudget: 20000,
      totalAmount: 0,
      status: "perdida",
      clientId: cliente2.id,
      createdById: admin.id,
    },
  });

  console.log("✅ Seed completado");
  console.log("   Admin: admin@empresa.com / admin123");
  console.log("   User:  user@empresa.com  / user123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());