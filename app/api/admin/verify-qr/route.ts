import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // In a real app, check if user is admin or staff
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json({ error: "Código QR requerido" }, { status: 400 })
    }

    // Find reservation by QR code
    const reservation = await prisma.reservation.findFirst({
      where: {
        qrCode,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            licensePlate: true,
          },
        },
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        {
          valid: false,
          message: "Código QR inválido o reservación no encontrada",
        },
        { status: 404 },
      )
    }

    // Check if reservation is for current time
    const now = new Date()
    if (now < reservation.startTime || now > reservation.endTime) {
      return NextResponse.json({
        valid: false,
        reservation: {
          id: reservation.id,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          user: reservation.user,
          parkingSpot: reservation.parkingSpot,
        },
        message: "La reservación no es válida para el horario actual",
      })
    }

    return NextResponse.json({
      valid: true,
      reservation: {
        id: reservation.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        user: reservation.user,
        parkingSpot: reservation.parkingSpot,
      },
      message: "Código QR válido",
    })
  } catch (error) {
    console.error("Error verifying QR code:", error)
    return NextResponse.json({ error: "Error al verificar código QR" }, { status: 500 })
  }
}

