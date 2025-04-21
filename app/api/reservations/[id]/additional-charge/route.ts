import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Asegurarse de que params.id esté disponible
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "ID de reservación requerido" }, { status: 400 })
    }

    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json()
    const { amount, exceededMinutes } = body

    console.log("Processing additional charge:", {
      reservationId: id,
      amount,
      exceededMinutes,
    })

    // Validar los datos
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    // Buscar la reservación
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Verificar si ya existe un cargo adicional para esta reservación
    const existingCharge = await prisma.additionalCharge.findFirst({
      where: {
        reservationId: id,
        status: "PAID",
      },
    })

    if (existingCharge) {
      return NextResponse.json({
        success: true,
        message: "Ya existe un cargo adicional pagado para esta reservación",
        charge: existingCharge,
      })
    }

    // Para pruebas, simulamos un PaymentIntent exitoso
    let paymentIntentId = `pi_test_${Date.now()}`
    let paymentStatus = "succeeded"

    // En producción, usaríamos Stripe para crear el PaymentIntent
    if (process.env.NODE_ENV === "production" && reservation.stripePaymentIntentId) {
      try {
        // Crear un nuevo PaymentIntent usando el mismo método de pago
        const originalPaymentIntent = await stripe.paymentIntents.retrieve(reservation.stripePaymentIntentId)

        if (originalPaymentIntent.payment_method) {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convertir a centavos
            currency: "mxn",
            payment_method: originalPaymentIntent.payment_method as string,
            confirm: true,
            off_session: true,
            description: `Cargo adicional por tiempo excedido - Reservación ${id}`,
            metadata: {
              reservationId: id,
              exceededMinutes: exceededMinutes.toString(),
              type: "additional_charge",
            },
          })

          paymentIntentId = paymentIntent.id
          paymentStatus = paymentIntent.status
        }
      } catch (stripeError) {
        console.error("Error creating Stripe payment:", stripeError)
      }
    }

    // Crear el cargo adicional en la base de datos
    const additionalCharge = await prisma.additionalCharge.create({
      data: {
        reservationId: id,
        amount: amount,
        reason: `Tiempo excedido (${exceededMinutes} minutos)`,
        stripePaymentIntentId: paymentIntentId,
        stripePaymentStatus: paymentStatus,
        status: "PAID", // Para pruebas, marcamos como pagado directamente
      },
    })

    return NextResponse.json({
      success: true,
      message: "Cargo adicional procesado correctamente",
      charge: additionalCharge,
    })
  } catch (error) {
    console.error("Error processing additional charge:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el cargo adicional",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
