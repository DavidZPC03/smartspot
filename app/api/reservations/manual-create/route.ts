import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import crypto from "crypto"
import { sendReceiptEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { paymentIntentId, parkingSpotId, startTime, endTime, price } = body

    console.log("Creando reservación manualmente con datos:", {
      paymentIntentId,
      parkingSpotId,
      startTime,
      endTime,
      price,
      userId: user.id,
    })

    if (!paymentIntentId || !parkingSpotId || !startTime || !endTime || !price) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una reservación para este PaymentIntent
    const existingReservation = await prisma.reservation.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    if (existingReservation) {
      console.log(`Ya existe una reservación para el PaymentIntent ${paymentIntentId}:`, existingReservation)
      return NextResponse.json({
        success: true,
        reservation: existingReservation,
        message: "La reservación ya existe",
      })
    }

    // Verificar que el lugar de estacionamiento existe
    const parkingSpot = await prisma.parkingSpot.findUnique({
      where: { id: parkingSpotId },
      include: { location: true },
    })

    if (!parkingSpot) {
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Generar un código QR único
    const qrCode = crypto.randomBytes(6).toString("hex").toUpperCase()

    // Crear la reservación en la base de datos
    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        parkingSpotId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price,
        paymentMethod: "stripe",
        paymentId: paymentIntentId,
        stripePaymentIntentId: paymentIntentId,
        stripePaymentStatus: "succeeded", // Asumimos que el pago fue exitoso
        qrCode,
        status: "confirmed",
      },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    console.log(`Reservación creada manualmente: ${reservation.id}`)

    // Marcar el lugar como no disponible
    await prisma.parkingSpot.update({
      where: { id: parkingSpotId },
      data: { isAvailable: false },
    })

    console.log(`Lugar de estacionamiento ${parkingSpotId} marcado como no disponible`)

    // Enviar correo de confirmación si hay un correo disponible
    if (user.email) {
      try {
        await sendReceiptEmail(user.email, reservation.id, {
          spotNumber: reservation.parkingSpot.spotNumber,
          locationName: reservation.parkingSpot.location.name,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          price: reservation.price,
          qrCode: reservation.qrCode,
        })
        console.log(`Correo de confirmación enviado a ${user.email}`)
      } catch (emailError) {
        console.error("Error al enviar correo de confirmación:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: "Reservación creada exitosamente",
    })
  } catch (error) {
    console.error("Error creating manual reservation:", error)
    return NextResponse.json(
      { error: "Error al crear la reservación", details: (error as Error).message },
      { status: 500 },
    )
  }
}

