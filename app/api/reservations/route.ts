import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendReceiptEmail } from "@/lib/email-service"

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

    // Verificar que el lugar esté disponible
    if (!parkingSpot.isAvailable) {
      console.error("Parking spot is not available:", body.parkingSpotId)
      return NextResponse.json({ error: "El lugar de estacionamiento no está disponible" }, { status: 400 })
    }

    // Generar un código QR único (usando crypto en lugar de uuid)
    const qrCode = crypto.randomBytes(6).toString("hex").toUpperCase()

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

    // Marcar inmediatamente el lugar como no disponible
    await prisma.parkingSpot.update({
      where: {
        id: body.parkingSpotId,
      },
      data: {
        isAvailable: false,
      },
    })

    console.log("Parking spot marked as unavailable:", body.parkingSpotId)

    // Obtener información del usuario para enviar el correo
    const token = request.headers.get("authorization")?.split(" ")[1]
    let userEmail = null

    if (token) {
      try {
        // Decodificar el token para obtener el ID del usuario
        const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())

        if (decoded.id) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { email: true },
          })

          userEmail = user?.email
        }
      } catch (e) {
        console.error("Error decoding token:", e)
      }
    }

    // Enviar correo de confirmación si hay un correo disponible
    if (userEmail) {
      await sendReceiptEmail(userEmail, reservation.id, {
        spotNumber: parkingSpot.spotNumber,
        locationName: parkingSpot.location.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        price: reservation.price,
        qrCode: reservation.qrCode,
      })
    }

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

