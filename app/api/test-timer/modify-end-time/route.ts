import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { reservationId, minutesToSubtract } = await request.json()

    if (!reservationId) {
      return NextResponse.json({ error: "ID de reservación requerido" }, { status: 400 })
    }

    if (!minutesToSubtract || minutesToSubtract <= 0) {
      return NextResponse.json({ error: "Minutos a restar debe ser un número positivo" }, { status: 400 })
    }

    // Buscar la reservación
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Calcular la nueva hora de finalización
    const currentEndTime = new Date(reservation.endTime)
    const newEndTime = new Date(currentEndTime)
    newEndTime.setMinutes(newEndTime.getMinutes() - minutesToSubtract)

    // Actualizar la reservación
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        endTime: newEndTime,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Tiempo de finalización modificado. Se restaron ${minutesToSubtract} minutos.`,
      reservation: updatedReservation,
    })
  } catch (error) {
    console.error("Error modifying end time:", error)
    return NextResponse.json(
      {
        error: "Error al modificar el tiempo de finalización",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
