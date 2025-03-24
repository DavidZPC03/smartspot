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

    const reservationId = params.id

    // Verificar que la reservación existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        parkingSpot: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Verificar que la reservación está en estado PENDING
    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "La reservación no está en estado pendiente",
          currentStatus: reservation.status,
        },
        { status: 400 },
      )
    }

    // Actualizar el estado de la reservación a CONFIRMED
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CONFIRMED",
        // También podríamos registrar quién confirmó la reservación y cuándo
        updatedAt: new Date(),
      },
    })

    // Actualizar el estado del lugar de estacionamiento a no disponible
    await prisma.parkingSpot.update({
      where: { id: reservation.parkingSpotId },
      data: {
        isAvailable: false,
      },
    })

    // Aquí podríamos enviar una notificación al usuario si fuera necesario

    return NextResponse.json({
      success: true,
      message: "Reservación confirmada exitosamente",
      reservation: updatedReservation,
    })
  } catch (error) {
    console.error("Error confirming reservation:", error)
    return NextResponse.json({ error: "Error al confirmar la reservación" }, { status: 500 })
  }
}

