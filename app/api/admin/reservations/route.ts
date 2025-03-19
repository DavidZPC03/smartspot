import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      const decoded = verify(token, AUTH_SECRET) as { role: string }
      if (decoded.role !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener todas las reservaciones con detalles
    const reservations = await prisma.reservation.findMany({
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      reservations,
    })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json({ error: "Error al obtener reservaciones" }, { status: 500 })
  }
}

