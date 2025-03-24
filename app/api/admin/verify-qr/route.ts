import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      // Verificar el token
      jwt.verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener el código QR del cuerpo de la solicitud
    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json({ error: "Código QR requerido" }, { status: 400 })
    }

    // Verificar el código QR
    try {
      // Intentar parsear el QR como JSON si es una cadena
      let qrData
      if (typeof qrCode === "string") {
        try {
          qrData = JSON.parse(qrCode)
        } catch (e) {
          // Si no es JSON, usar el formato antiguo
          qrData = { id: qrCode }
        }
      } else {
        qrData = qrCode
      }

      // Verificar que tenemos un ID de reservación
      const reservationId = qrData.id || qrData.reservationId

      if (!reservationId) {
        return NextResponse.json({ error: "QR inválido: no contiene ID de reservación" }, { status: 400 })
      }

      // Buscar la reservación asociada al código QR
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

      if (!reservation) {
        return NextResponse.json(
          {
            valid: false,
            message: "Reservación no encontrada",
          },
          { status: 404 },
        )
      }

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

