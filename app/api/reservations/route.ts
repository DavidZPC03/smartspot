import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendReceiptEmail } from "@/lib/email-service"
import { getUserFromRequest } from "@/lib/auth"
// Importar las funciones de validación
import { isValidReservationTime } from "@/lib/validations"

// En la función POST, añadir validaciones
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Creating reservation with data:", body)

    // Validar los datos de entrada
    if (!body.parkingSpotId) {
      console.error("Missing parkingSpotId in request")
      return NextResponse.json({ error: "ID del lugar de estacionamiento es requerido" }, { status: 400 })
    }

    // Validar fechas de reserva
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (!isValidReservationTime(startTime, endTime)) {
      return NextResponse.json(
        {
          error:
            "Fechas de reserva inválidas. La fecha de inicio debe ser anterior a la fecha de fin, la duración máxima es de 24 horas, y no se puede reservar más de 30 días en el futuro.",
        },
        { status: 400 },
      )
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

    // Verificar si ya hay una reservación para este lugar en el mismo horario
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        parkingSpotId: body.parkingSpotId,
        status: {
          in: ["confirmed", "CONFIRMED", "pending", "PENDING"],
        },
        OR: [
          {
            // Caso 1: La reservación existente comienza durante nuestra reservación
            startTime: {
              gte: startTime,
              lte: endTime,
            },
          },
          {
            // Caso 2: La reservación existente termina durante nuestra reservación
            endTime: {
              gte: startTime,
              lte: endTime,
            },
          },
          {
            // Caso 3: La reservación existente abarca completamente nuestra reservación
            startTime: {
              lte: startTime,
            },
            endTime: {
              gte: endTime,
            },
          },
        ],
      },
    })

    if (existingReservation) {
      console.error("Conflicting reservation found:", existingReservation.id)
      return NextResponse.json(
        {
          error: "Ya existe una reservación para este lugar en el horario seleccionado",
        },
        { status: 409 },
      )
    }

    // Generar un código QR único (usando crypto en lugar de uuid)
    const qrCode = crypto.randomBytes(6).toString("hex").toUpperCase()

    // Crear la reservación en la base de datos
    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
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

    // Enviar correo de confirmación si hay un correo disponible
    if (user.email) {
      try {
        await sendReceiptEmail(user.email, reservation.id, {
          spotNumber: parkingSpot.spotNumber,
          locationName: parkingSpot.location.name,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          price: reservation.price,
          qrCode: reservation.qrCode,
        })
        console.log("Email confirmation sent to:", user.email)
      } catch (e) {
        console.error("Error sending email:", e)
      }
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

