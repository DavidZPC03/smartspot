import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating reservation with data:", body)

    // Validar los datos de entrada
    if (!body.parkingSpotId) {
      console.error("Missing parkingSpotId in request")
      return NextResponse.json({ error: "ID del lugar de estacionamiento es requerido" }, { status: 400 })
    }

    // Verificar que el lugar de estacionamiento existe
    const parkingSpot = await prisma.parkingSpot.findUnique({
      where: {
        id: body.parkingSpotId,
      },
      include: {
        location: true,
      },
    })

    if (!parkingSpot) {
      console.error("Parking spot not found:", body.parkingSpotId)
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Generar un código QR único (usando crypto en lugar de uuid)
    const qrCode = crypto.randomBytes(16).toString("hex")

    // Crear la reservación en la base de datos
    const reservation = await prisma.reservation.create({
      data: {
        parkingSpotId: body.parkingSpotId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        price: body.price || 0,
        paymentMethod: body.paymentMethod || "card",
        paymentId: body.paymentId || null,
        qrCode: qrCode,
        status: "confirmed",
      },
    })

    console.log("Reservation created successfully:", reservation)

    // Devolver la reservación creada
    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        qrCode: reservation.qrCode,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        price: reservation.price,
        paymentId: reservation.paymentId,
        status: reservation.status,
      },
    })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: "Error al crear la reservación", details: (error as Error).message },
      { status: 500 },
    )
  }
}

