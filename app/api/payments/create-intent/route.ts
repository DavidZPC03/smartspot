import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import stripe from "@/lib/stripe"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { parkingSpotId, startTime, endTime, price } = body

    console.log("Datos recibidos para crear intención de pago:", {
      parkingSpotId,
      startTime,
      endTime,
      price,
      userId: user.id,
    })

    if (!parkingSpotId || !startTime || !endTime || !price) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Verificar que el lugar de estacionamiento existe
    const parkingSpot = await prisma.parkingSpot.findUnique({
      where: { id: parkingSpotId },
      include: { location: true },
    })

    if (!parkingSpot) {
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Crear o recuperar el cliente de Stripe
    let stripeCustomerId = user.stripeCustomerId

    try {
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          phone: user.phone || undefined,
          metadata: {
            userId: user.id,
          },
        })

        stripeCustomerId = customer.id

        // Guardar el ID del cliente de Stripe en la base de datos
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        })
      }

      // Crear un PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Stripe trabaja con centavos
        currency: "mxn",
        customer: stripeCustomerId,
        metadata: {
          parkingSpotId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          userId: user.id,
        },
      })

      console.log("PaymentIntent creado exitosamente:", paymentIntent.id)

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (stripeError) {
      console.error("Error de Stripe:", stripeError)
      return NextResponse.json(
        {
          error: "Error al procesar con Stripe",
          details: stripeError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Error al crear intención de pago", details: (error as Error).message },
      { status: 500 },
    )
  }
}

