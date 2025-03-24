import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id

    // Buscar la reservación
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
        user: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Generar QR con la información de la reservación
    const qrData = {
      id: reservation.id,
      userId: reservation.userId,
      nombre: reservation.user?.name || "Usuario",
      fechaReservacion: new Date().toISOString(),
      horaInicio: reservation.startTime.toISOString(),
      horaFin: reservation.endTime.toISOString(),
      lugarEstacionamiento: `Lugar ${reservation.parkingSpot.spotNumber}`,
      ubicacion: reservation.parkingSpot.location.name,
      estado: "PAGADO",
      precio: reservation.price,
    }

    // Generar el QR como una cadena de texto JSON
    const qrCodeContent = JSON.stringify(qrData)

    // Generar el QR como una imagen
    const qrCodeDataUrl = await generateQRCode(qrCodeContent)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      reservation: {
        id: reservation.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        parkingSpotNumber: reservation.parkingSpot.spotNumber,
        locationName: reservation.parkingSpot.location.name,
        status: "PENDING",
      },
    })
  } catch (error) {
    console.error("Error generating QR:", error)
    return NextResponse.json({ error: "Error al generar el QR", details: (error as Error).message }, { status: 500 })
  }
}

