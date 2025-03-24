import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import stripe from "@/lib/stripe"

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

    console.log(`Verificando estado de pago para PaymentIntent: ${paymentIntentId}`)

    // Buscar la reservación asociada al PaymentIntent (verificar ambos campos)
    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [{ stripePaymentIntentId: paymentIntentId }, { paymentId: paymentIntentId }],
      },
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

    // Si se encuentra la reservación, devolverla
    if (reservation) {
      console.log(`Reservación encontrada para PaymentIntent: ${paymentIntentId}`)
      return NextResponse.json({ reservation })
    }

    // Si no se encuentra la reservación, verificar el estado del pago en Stripe
    console.log(`No se encontró reservación para PaymentIntent: ${paymentIntentId}, verificando en Stripe`)

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      console.log(`Estado del PaymentIntent en Stripe: ${paymentIntent.status}`)

      // Si el pago fue exitoso pero no hay reservación, devolver información para crear una
      if (paymentIntent.status === "succeeded") {
        return NextResponse.json({
          paymentStatus: paymentIntent.status,
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata,
          },
          message: "Pago exitoso pero reservación no encontrada",
        })
      }

      return NextResponse.json({
        reservation: null,
        paymentStatus: paymentIntent.status,
        message: "Reservación no encontrada, pago en proceso",
      })
    } catch (stripeError) {
      console.error("Error al verificar PaymentIntent en Stripe:", stripeError)
      return NextResponse.json({ error: "Error al verificar el pago en Stripe" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json(
      { error: "Error al verificar el estado del pago", details: (error as Error).message },
      { status: 500 },
    )
  }
}

