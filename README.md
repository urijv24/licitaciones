# Gestión de Licitaciones

Sistema web para gestionar licitaciones comerciales. Desarrollado como prueba técnica con Next.js, Prisma y PostgreSQL.

## Tecnologías usadas

- Next.js 16 con App Router
- Prisma 7 como ORM
- PostgreSQL como base de datos
- JWT para autenticación
- Tailwind CSS para estilos

## Requisitos

- Node.js v18 o superior
- PostgreSQL instalado

## Cómo correrlo localmente

1. Clonar el repositorio

```bash
git clone https://github.com/urijv24/licitaciones.git
cd licitaciones
```

2. Instalar dependencias

```bash
npm install
```

3. Crear el archivo `.env` basado en `.env.example` y completar con tus datos

DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/licitaciones?schema=public"
JWT_SECRET="una_clave_secreta"

4. Crear la base de datos en pgAdmin con el nombre `licitaciones`

5. Aplicar el schema y generar el cliente

```bash
npx prisma db push
npx prisma generate
```

6. Cargar datos de prueba

```bash
npm run seed
```

7. Iniciar el proyecto

```bash
npm run dev
```

Abre http://localhost:3000

## Usuarios de prueba

- Admin: admin@empresa.com / admin123
- Usuario: user@empresa.com / user123

## Variables de entorno necesarias

- `DATABASE_URL` — conexión a PostgreSQL
- `JWT_SECRET` — clave para firmar los tokens

## Despliegue

https://licitaciones-tqw1.vercel.app