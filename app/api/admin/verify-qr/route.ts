import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest) {
  console.log("API endpoint /api/admin/verify-qr called")

  try {
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

    // Obtener el código QR del cuerpo de la solicitud
    const body = await request.json()
    const { qrCode } = body
    console.log("QR Code received:", qrCode)

    if (!qrCode) {
      console.log("No QR code provided")
      return NextResponse.json({ error: "Código QR requerido" }, { status: 400 })
    }

    // Verificar el código QR
    try {
      // Intentar diferentes estrategias para extraer el ID de reservación o información relacionada
      let reservationId = null
      let paymentIntentId = null
      let spotId = null
      let parsedData = null

      // Estrategia 1: El QR es un objeto JSON
      if (typeof qrCode === "string" && (qrCode.startsWith("{") || qrCode.includes("{"))) {
        try {
          parsedData = JSON.parse(qrCode)
          console.log("QR code parsed as JSON:", parsedData)

          // Extraer información relevante del JSON
          if (parsedData.id && parsedData.id.startsWith("pi_")) {
            paymentIntentId = parsedData.id
            console.log("Found payment intent ID in JSON:", paymentIntentId)
          }

          spotId = parsedData.spotId
          console.log("Extracted spotId from JSON:", spotId)
        } catch (e) {
          console.log("Failed to parse QR code as JSON:", e)
        }
      }

      // Estrategia 2: El QR es directamente el código QR almacenado en la base de datos
      if (!paymentIntentId && typeof qrCode === "string" && /^[A-Z0-9]+$/.test(qrCode)) {
        console.log("QR code appears to be a stored QR code:", qrCode)
        // Buscar la reservación por el código QR en la base de datos
        const reservationWithQR = await prisma.reservation.findFirst({
          where: {
            qrCode: qrCode,
          },
        })

        if (reservationWithQR) {
          reservationId = reservationWithQR.id
          console.log("Found reservation with matching QR code:", reservationId)
        }
      }

      // Estrategia 3: El QR contiene un ID de pago de Stripe (pi_...)
      if (!reservationId && typeof qrCode === "string" && qrCode.includes("pi_")) {
        const match = qrCode.match(/pi_[a-zA-Z0-9]+/)
        if (match) {
          paymentIntentId = match[0]
          console.log("Extracted payment intent ID from string:", paymentIntentId)
        }
      }

      // Si tenemos un ID de pago, buscar la reservación por ese ID
      if (!reservationId && paymentIntentId) {
        console.log("Looking up reservation by payment intent ID:", paymentIntentId)
        const reservationByPayment = await prisma.reservation.findFirst({
          where: {
            stripePaymentIntentId: paymentIntentId,
          },
        })

        if (reservationByPayment) {
          reservationId = reservationByPayment.id
          console.log("Found reservation with matching payment ID:", reservationId)
        }
      }

      // Si aún no tenemos un ID de reservación pero tenemos spotId y fechas, buscar por esos criterios
      if (!reservationId && parsedData && spotId && parsedData.startTime && parsedData.endTime) {
        console.log("Looking up reservation by spot ID and time range")
        const startTime = new Date(parsedData.startTime)
        const endTime = new Date(parsedData.endTime)

        const reservationBySpotAndTime = await prisma.reservation.findFirst({
          where: {
            parkingSpotId: spotId,
            startTime: {
              gte: new Date(startTime.getTime() - 3600000), // 1 hour buffer before
              lte: new Date(startTime.getTime() + 3600000), // 1 hour buffer after
            },
            endTime: {
              gte: new Date(endTime.getTime() - 3600000), // 1 hour buffer before
              lte: new Date(endTime.getTime() + 3600000), // 1 hour buffer after
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        if (reservationBySpotAndTime) {
          reservationId = reservationBySpotAndTime.id
          console.log("Found reservation with matching spot and time range:", reservationId)
        }
      }

      // Si no encontramos una reservación, intentar buscar por el ID de reservación directamente
      if (!reservationId && typeof qrCode === "string" && qrCode.startsWith("cm")) {
        console.log("QR code appears to be a reservation ID directly:", qrCode)
        // Verificar si existe una reservación con este ID
        const reservationExists = await prisma.reservation.findUnique({
          where: {
            id: qrCode,
          },
        })

        if (reservationExists) {
          reservationId = qrCode
          console.log("Found reservation with matching ID:", reservationId)
        }
      }

      console.log("Final reservation ID determined:", reservationId)

      if (!reservationId) {
        console.log("No reservation ID found in QR code")
        return NextResponse.json(
          {
            valid: false,
            message: "QR inválido: no se pudo encontrar una reservación asociada",
            debug: {
              qrCode,
              parsedData,
              paymentIntentId,
            },
          },
          { status: 400 },
        )
      }

      // Buscar la reservación asociada al código QR
      console.log("Looking up reservation with ID:", reservationId)
      const reservation = await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              licensePlate: true,
            },
          },
          parkingSpot: {
            select: {
              id: true,
              spotNumber: true,
              location: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      })

      console.log("Reservation lookup result:", reservation ? "Found" : "Not found")

      if (!reservation) {
        return NextResponse.json(
          {
            valid: false,
            message: "Reservación no encontrada",
            debug: { reservationId, paymentIntentId },
          },
          { status: 404 },
        )
      }

      console.log("Returning successful response with reservation details")
      return NextResponse.json({
        valid: true,
        message: "Reservación verificada correctamente",
        reservation,
      })
    } catch (error) {
      console.error("Error verifying QR code:", error)
      return NextResponse.json(
        {
          valid: false,
          message: "Error al verificar el código QR",
          error: (error as Error).message,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in verify-qr API:", error)
    return NextResponse.json({ error: "Error al verificar el código QR" }, { status: 500 })
  }
}
