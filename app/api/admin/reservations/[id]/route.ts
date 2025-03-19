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

    const reservationId = params.id

    // Get reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error("Error fetching reservation details:", error)
    return NextResponse.json({ error: "Error al obtener detalles de la reservación" }, { status: 500 })
  }
}

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
    const { status } = body

    // Validar status
    if (!status || !["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Estado de reservación inválido" }, { status: 400 })
    }

    // Update reservation status
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    return NextResponse.json({
      reservation: updatedReservation,
      message: "Estado de reservación actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating reservation:", error)
    return NextResponse.json({ error: "Error al actualizar reservación" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Delete reservation
    await prisma.reservation.delete({
      where: { id: reservationId },
    })

    return NextResponse.json({
      message: "Reservación eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error deleting reservation:", error)
    return NextResponse.json({ error: "Error al eliminar reservación" }, { status: 500 })
  }
}

