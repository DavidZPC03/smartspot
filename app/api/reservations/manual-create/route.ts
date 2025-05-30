import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentIntentId, parkingSpotId, startTime, endTime, price } = body

    console.log("Creando reservación manual con datos:", {
      paymentIntentId,
      parkingSpotId,
      startTime,
      endTime,
      price,
    })

    // Obtener el usuario de la solicitud
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si ya existe una reservación con este paymentIntentId
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        OR: [{ paymentId: paymentIntentId }, { stripePaymentIntentId: paymentIntentId }],
      },
    })

    if (existingReservation) {
      console.log("Reservación ya existe:", existingReservation)
      return NextResponse.json({
        success: true,
        message: "La reservación ya existe",
        reservation: existingReservation,
      })
    }

    // Verificar que el lugar de estacionamiento existe
    const parkingSpot = await prisma.parkingSpot.findUnique({
      where: { id: parkingSpotId },
      include: {
        location: true,
      },
    })

    if (!parkingSpot) {
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Generar un código QR único (texto simple)
    const qrCode = crypto.randomBytes(6).toString("hex").toUpperCase()

    // Asegurarse de que el precio sea un número
    const finalPrice = typeof price === "number" ? price : Number.parseFloat(price)

    // Calcular la duración en horas para verificar el precio
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const hours = Math.max(diffHours, 1) // Mínimo 1 hora

    // Calcular el precio esperado
    const basePrice = 100
    const hourlyRate = 20
    let expectedPrice = basePrice

    if (hours > 1) {
      const additionalHours = Math.ceil(hours - 1)
      expectedPrice = basePrice + additionalHours * hourlyRate
    }

    console.log(`Duración: ${hours} horas, Precio esperado: ${expectedPrice}, Precio recibido: ${finalPrice}`)

    // Crear la reservación con estado PENDING
    const reservation = await prisma.reservation.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "PENDING", // Cambiado de CONFIRMED a PENDING
        paymentMethod: "stripe",
        price: isNaN(finalPrice) ? expectedPrice : finalPrice, // Usar precio esperado si finalPrice es NaN
        paymentId: paymentIntentId,
        stripePaymentIntentId: paymentIntentId,
        stripePaymentStatus: "succeeded",
        qrCode: qrCode,
        user: {
          connect: { id: user.id },
        },
        parkingSpot: {
          connect: { id: parkingSpotId },
        },
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

    console.log("Reservación creada exitosamente:", reservation.id)

    // Marcar el lugar de estacionamiento como no disponible
    await prisma.parkingSpot.update({
      where: { id: parkingSpotId },
      data: { isAvailable: false },
    })

    // Generar un QR simple usando la API pública
    const qrData = {
      id: reservation.id,
      userId: user.id,
      nombre: user.name || "Usuario",
      fechaReservacion: new Date().toISOString(),
      horaInicio: reservation.startTime.toISOString(),
      horaFin: reservation.endTime.toISOString(),
      lugarEstacionamiento: `Lugar ${reservation.parkingSpot.spotNumber}`,
      ubicacion: reservation.parkingSpot.location.name,
      estado: "PENDIENTE", // Cambiado de CONFIRMADO a PENDIENTE
      precio: reservation.price,
    }

    // Generar el QR como una cadena de texto JSON
    const qrCodeContent = JSON.stringify(qrData)

    // Usar la API pública para generar el QR
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeContent)}&size=300x300&ecc=H`

    return NextResponse.json({
      success: true,
      reservation: {
        ...reservation,
        qrCode: qrCodeUrl,
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
