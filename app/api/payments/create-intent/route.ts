import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import stripe from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { amount, reservationId, locationId, spotId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    // Make sure we're sending at least 1000 cents (10 MXN) to Stripe
    const amountInCents = Math.max(Math.round(amount * 100), 1000)

    console.log("Creando intención de pago por:", amountInCents, "centavos")

    // Create a payment intent in Stripe with the corrected amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, // Ensure amount is at least 1000 cents (10 MXN)
      currency: "mxn",
      metadata: {
        userId: user.id,
        reservationId: reservationId || "",
        locationId: locationId || "",
        spotId: spotId || "",
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Error al crear la intención de pago", details: (error as Error).message },
      { status: 500 },
    )
  }
}
