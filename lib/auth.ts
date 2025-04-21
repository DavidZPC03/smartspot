import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { prisma } from "./prisma"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function getUserFromRequest(request: NextRequest) {
  try {
    // Intentar obtener el token de diferentes fuentes
    let token: string | undefined

    // 1. Primero intentar desde el encabezado de autorización
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    // 2. Si no hay token en el encabezado, intentar desde las cookies
    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      console.log("No se encontró token de autorización")
      return null
    }

    // Verificar el token
    try {
      const decoded = verify(token, AUTH_SECRET) as { id: string }
      if (!decoded || !decoded.id) {
        console.log("Token inválido o sin ID de usuario")
        return null
      }

      // Buscar el usuario en la base de datos
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      })

      if (!user) {
        console.log(`Usuario con ID ${decoded.id} no encontrado en la base de datos`)
      }

      return user
    } catch (jwtError) {
      console.error("Error al verificar el token JWT:", jwtError)
      return null
    }
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

// Función para verificar token de administrador
export async function verifyAdminToken(token: string) {
  try {
    const decoded = verify(token, AUTH_SECRET) as { id: string; role: string }
    return decoded && decoded.role === "admin"
  } catch (error) {
    console.error("Error verifying admin token:", error)
    return false
  }
}
