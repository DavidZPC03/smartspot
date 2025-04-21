import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id

    // Log para depuración
    console.log("Test API - Reservation ID:", reservationId)

    // Verificar si la reservación existe
    const reservationExists = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true },
    })

    // Devolver información básica
    return NextResponse.json({
      success: true,
      exists: !!reservationExists,
      id: reservationId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
