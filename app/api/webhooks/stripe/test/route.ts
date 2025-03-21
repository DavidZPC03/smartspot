import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    // Verificar que tenemos la clave secreta de Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "STRIPE_SECRET_KEY no está configurada",
          status: "error",
        },
        { status: 500 },
      )
    }

    // Verificar que tenemos el secreto del webhook
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        {
          error: "STRIPE_WEBHOOK_SECRET no está configurado",
          status: "error",
        },
        { status: 500 },
      )
    }

    // Obtener los webhooks configurados
    const webhooks = await stripe.webhookEndpoints.list({
      limit: 10,
    })

    // Verificar si hay webhooks configurados para nuestra URL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const webhookUrl = `${baseUrl}/api/webhooks/stripe`

    const matchingWebhooks = webhooks.data.filter(
      (webhook) => webhook.url === webhookUrl || webhook.url.includes(baseUrl),
    )

    return NextResponse.json({
      status: "success",
      webhooks: matchingWebhooks.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
        status: webhook.status,
        enabled_events: webhook.enabled_events,
        created: new Date(webhook.created * 1000).toISOString(),
      })),
      webhookUrl,
      baseUrl,
      message:
        matchingWebhooks.length > 0
          ? "Webhooks configurados correctamente"
          : "No se encontraron webhooks configurados para esta URL",
    })
  } catch (error) {
    console.error("Error testing Stripe webhooks:", error)
    return NextResponse.json(
      {
        error: "Error al verificar webhooks de Stripe",
        details: (error as Error).message,
        status: "error",
      },
      { status: 500 },
    )
  }
}

