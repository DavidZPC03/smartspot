import { PrismaClient } from "@prisma/client"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function main() {
  console.log("Aplicando migraciones de Prisma...")

  try {
    // Ejecutar la migración de Prisma
    const { stdout, stderr } = await execAsync("npx prisma migrate dev --name fix_schema")

    if (stderr) {
      console.error("Error al ejecutar la migración:", stderr)
    } else {
      console.log("Migración completada con éxito:", stdout)
    }

    // Verificar si la tabla EmailLog existe
    try {
      await prisma.$queryRaw`SELECT 1 FROM "EmailLog" LIMIT 1`
      console.log("La tabla EmailLog existe")
    } catch (e) {
      console.log("La tabla EmailLog no existe, creándola...")

      // Crear la tabla EmailLog manualmente si no existe
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "EmailLog" (
          "id" TEXT NOT NULL,
          "to" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "status" TEXT NOT NULL,
          "reservationId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
        )
      `

      // Crear la relación con la tabla Reservation si existe
      try {
        await prisma.$executeRaw`
          ALTER TABLE "EmailLog" 
          ADD CONSTRAINT "EmailLog_reservationId_fkey" 
          FOREIGN KEY ("reservationId") 
          REFERENCES "Reservation"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE
        `
        console.log("Relación creada entre EmailLog y Reservation")
      } catch (e) {
        console.log("No se pudo crear la relación con Reservation:", e)
      }

      console.log("Tabla EmailLog creada manualmente")
    }

    console.log("Proceso completado")
  } catch (error) {
    console.error("Error durante el proceso:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

