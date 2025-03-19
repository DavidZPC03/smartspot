import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      // Verificar el token
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener el ID del lugar de estacionamiento
    const spotId = params.id

    // Verificar si el lugar existe
    const spot = await prisma.parkingSpot.findUnique({
      where: { id: spotId },
    })

    if (!spot) {
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Obtener todas las reservaciones para este lugar
    // Incluir solo las reservaciones confirmadas o pendientes
    const reservations = await prisma.reservation.findMany({
      where: {
        parkingSpotId: spotId,
        status: {
          in: ["CONFIRMED", "PENDING", "confirmed", "pending"],
        },
      },
      orderBy: {
        startTime: "asc",
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

