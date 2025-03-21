import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"
import stripe from "@/lib/stripe"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      // Verificar el token
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Obtener el total de reservaciones con pagos de Stripe
    const totalPayments = await prisma.reservation.count({
      where: {
        stripePaymentIntentId: {
          not: null,
        },
      },
    })

    // Obtener todas las reservaciones con pagos de Stripe
    const reservationsWithPayments = await prisma.reservation.findMany({
      where: {
        stripePaymentIntentId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    // Para cada reservación, obtener información adicional de Stripe
    const paymentsWithStripeInfo = await Promise.all(
      reservationsWithPayments.map(async (reservation) => {
        if (!reservation.stripePaymentIntentId) {
          return reservation
        }

        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(reservation.stripePaymentIntentId)
          return {
            ...reservation,
            stripeInfo: {
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              paymentMethod: paymentIntent.payment_method_types[0],
              created: new Date(paymentIntent.created * 1000).toISOString(),
            },
          }
        } catch (error) {
          console.error(`Error retrieving payment intent ${reservation.stripePaymentIntentId}:`, error)
          return reservation
        }
      }),
    )

    return NextResponse.json({
      success: true,
      payments: paymentsWithStripeInfo,
      pagination: {
        total: totalPayments,
        page,
        limit,
        pages: Math.ceil(totalPayments / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

