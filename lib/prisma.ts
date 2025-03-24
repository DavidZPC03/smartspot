import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Opciones para el cliente de Prisma
const prismaOptions = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
}

// Crear o reutilizar la instancia de PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions)

// Add a default export for compatibility
export default prisma

// Guardar la instancia en el objeto global en desarrollo
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Manejar errores de conexión
prisma
  .$connect()
  .then(() => {
    console.log("Conexión a la base de datos establecida")
  })
  .catch((error) => {
    console.error("Error al conectar con la base de datos:", error)
  })

