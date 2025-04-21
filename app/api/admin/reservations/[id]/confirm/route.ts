import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("API endpoint /api/admin/reservations/[id]/confirm called")

  try {
    const { id } = params
    console.log("Reservation ID:", id)

    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header or invalid format")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    console.log("Token received:", token.substring(0, 10) + "...")

    try {
      // Verificar el token
      jwt.verify(token, AUTH_SECRET)
      console.log("Token verified successfully")
    } catch (err) {
      console.log("Token verification failed:", err)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar que la reservación existe
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      console.log("Reservation not found")
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    console.log("Updating reservation status to CONFIRMED")

    // Actualizar el estado de la reservación a confirmada y marcar que el cronómetro ha iniciado
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        timerStarted: true,
        timerStartedAt: new Date(),
      },
    })

    console.log("Reservation updated successfully")
    return NextResponse.json({
      message: "Reservación confirmada exitosamente",
      reservation: updatedReservation,
    })
  } catch (error) {
    console.error("Error confirming reservation:", error)
    return NextResponse.json({ error: "Error al confirmar la reservación" }, { status: 500 })
  }
}
