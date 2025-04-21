import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("GET /api/reservations/[id] - Params received:", params)

    const reservationId = params.id
    console.log("Fetching reservation with ID:", reservationId)

    if (!reservationId) {
      console.error("No reservation ID provided")
      return NextResponse.json({ error: "ID de reservación no proporcionado" }, { status: 400 })
    }

    // Buscar la reservación en la base de datos
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    console.log("Reservation found:", reservation)

    if (!reservation) {
      console.error("Reservation not found for ID:", reservationId)
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Devolver los datos de la reservación con información adicional
    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        qrCode: reservation.qrCode,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        // Incluir información adicional para el QR
        spotNumber: reservation.parkingSpot?.spotNumber,
        locationName: reservation.parkingSpot?.location?.name,
        locationAddress: reservation.parkingSpot?.location?.address,
        price: reservation.price,
        paymentId: reservation.paymentId,
        createdAt: reservation.createdAt,
        timerStarted: reservation.timerStarted,
        timerStartedAt: reservation.timerStartedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching reservation:", error)
    return NextResponse.json({ error: "Error al obtener detalles de la reservación" }, { status: 500 })
  }
}
