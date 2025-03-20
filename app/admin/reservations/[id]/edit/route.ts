import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reservationId = params.id
    const body = await request.json()
    const { startTime, endTime, price, status } = body

    // Validar datos
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Fechas de inicio y fin son requeridas" }, { status: 400 })
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }, { status: 400 })
    }

    if (price < 0) {
      return NextResponse.json({ error: "El precio no puede ser negativo" }, { status: 400 })
    }

    // Actualizar la reservación
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price,
        status,
      },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
        user: true,
      },
    })

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      message: "Reservación actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error updating reservation:", error)
    return NextResponse.json({ error: "Error al actualizar la reservación" }, { status: 500 })
  }
}

