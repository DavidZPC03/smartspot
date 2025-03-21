import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el ID del PaymentIntent de los parámetros de consulta
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get("paymentIntentId")

    if (!paymentIntentId) {
      return NextResponse.json({ error: "ID de PaymentIntent no proporcionado" }, { status: 400 })
    }

    // Buscar la reservación asociada al PaymentIntent
    const reservation = await prisma.reservation.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Si no se encuentra la reservación, devolver un objeto vacío
    if (!reservation) {
      return NextResponse.json({ reservation: null })
    }

    // Verificar que la reservación pertenece al usuario
    if (reservation.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado para esta reservación" }, { status: 403 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json(
      { error: "Error al verificar el estado del pago", details: (error as Error).message },
      { status: 500 },
    )
  }
}

