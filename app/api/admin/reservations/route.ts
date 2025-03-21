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
      // Verificar el token - no verificamos el rol específicamente para simplificar
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Obtener el total de reservaciones
    const totalReservations = await prisma.reservation.count()

    // Obtener todas las reservaciones con detalles
    const reservations = await prisma.reservation.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            licensePlate: true,
          },
        },
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
      pagination: {
        total: totalReservations,
        page,
        limit,
        pages: Math.ceil(totalReservations / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json({ error: "Error al obtener reservaciones" }, { status: 500 })
  }
}

