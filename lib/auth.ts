import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { prisma } from "./prisma"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function getUserFromRequest(request: NextRequest) {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      return null
    }

    // Verificar el token
    const decoded = verify(token, AUTH_SECRET) as { id: string }
    if (!decoded || !decoded.id) {
      return null
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    })

    return user
  } catch (error) {
    console.error("Error getting user from request:", error)
    return null
  }
}

// Función para obtener el usuario actual (para compatibilidad con código existente)
export async function getCurrentUser(request?: NextRequest) {
  if (!request) {
    console.error("No request provided to getCurrentUser")
    return null
  }

  return getUserFromRequest(request)
}

