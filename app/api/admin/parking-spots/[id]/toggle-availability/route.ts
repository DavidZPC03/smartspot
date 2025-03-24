import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      // Verificar el token
      jwt.verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { isAvailable } = body

    if (isAvailable === undefined) {
      return NextResponse.json({ error: "El estado de disponibilidad es requerido" }, { status: 400 })
    }

    // Verificar si hay reservaciones activas para este lugar
    if (isAvailable) {
      const activeReservations = await prisma.reservation.findMany({
        where: {
          parkingSpotId: id,
          endTime: {
            gt: new Date(),
          },
          startTime: {
            lt: new Date(),
          },
          status: "CONFIRMED",
        },
      })

      if (activeReservations.length > 0) {
        return NextResponse.json(
          { error: "No se puede marcar como disponible porque hay reservaciones activas" },
          { status: 400 },
        )
      }
    }

    // Actualizar el estado del lugar de estacionamiento
    const updatedSpot = await prisma.parkingSpot.update({
      where: {
        id,
      },
      data: {
        isAvailable,
      },
    })

    return NextResponse.json(updatedSpot)
  } catch (error) {
    console.error("Error toggling parking spot availability:", error)
    return NextResponse.json({ error: "Error al actualizar el estado del lugar de estacionamiento" }, { status: 500 })
  }
}

