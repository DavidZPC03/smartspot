import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id

    if (!reservationId) {
      return NextResponse.json({ error: "ID de reservación no proporcionado" }, { status: 400 })
    }

    // Verificar si la reservación existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Actualizar el estado de la reservación a CONFIRMED e iniciar el cronómetro
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CONFIRMED",
        timerStarted: true,
        timerStartedAt: new Date(),
      },
    })

    console.log("Reservation confirmed and timer started:", updatedReservation)

    return NextResponse.json({
      success: true,
      message: "Reservación confirmada y cronómetro iniciado",
      reservation: {
        id: updatedReservation.id,
        status: updatedReservation.status,
        timerStarted: updatedReservation.timerStarted,
        timerStartedAt: updatedReservation.timerStartedAt,
      },
    })
  } catch (error) {
    console.error("Error confirming reservation:", error)
    return NextResponse.json(
      { error: "Error al confirmar la reservación", details: (error as Error).message },
      { status: 500 },
    )
  }
}
