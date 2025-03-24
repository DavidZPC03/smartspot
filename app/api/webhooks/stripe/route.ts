import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import stripe from "@/lib/stripe"
import crypto from "crypto"
import { sendReceiptEmail } from "@/lib/email-service"
import { generateQRCode } from "@/lib/qrcode"

// Desactivar el body parser para webhooks de Stripe
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: ReadableStream) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export async function POST(request: NextRequest) {
  try {
    console.log("Webhook de Stripe recibido")

    // Obtener el cuerpo de la solicitud como buffer
    const buf = await buffer(request.body as ReadableStream)
    const rawBody = buf.toString("utf8")

    // Guardar el cuerpo del webhook para depuración
    console.log("Cuerpo del webhook:", rawBody.substring(0, 500) + "...")

    const signature = request.headers.get("stripe-signature") || ""
    console.log("Firma del webhook:", signature)

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET no está configurado")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Verificar la firma del webhook
    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
      console.log(`Evento de Stripe recibido: ${event.type}`)
    } catch (err) {
      console.error(`Error de verificación de firma: ${err.message}`)
      return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Procesando payment_intent.succeeded")
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case "payment_intent.payment_failed":
        console.log("Procesando payment_intent.payment_failed")
        await handlePaymentIntentFailed(event.data.object)
        break
      default:
        console.log(`Tipo de evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json({ error: "Error handling webhook" }, { status: 500 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`Procesando pago exitoso para PaymentIntent: ${paymentIntent.id}`)
  console.log("Datos del PaymentIntent:", JSON.stringify(paymentIntent, null, 2))

  const { metadata } = paymentIntent
  const { parkingSpotId, startTime, endTime, userId } = metadata || {}

  if (!parkingSpotId || !startTime || !endTime || !userId) {
    console.error("Falta metadata en el PaymentIntent:", paymentIntent.id)
    return
  }

  // Verificar si ya existe una reservación para este PaymentIntent
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      OR: [{ stripePaymentIntentId: paymentIntent.id }, { paymentId: paymentIntent.id }],
    },
  })

  if (existingReservation) {
    console.log(`Ya existe una reservación para el PaymentIntent ${paymentIntent.id}`)

    // Actualizar el estado si es necesario
    if (existingReservation.status !== "confirmed" && existingReservation.status !== "CONFIRMED") {
      await prisma.reservation.update({
        where: { id: existingReservation.id },
        data: {
          status: "CONFIRMED",
          stripePaymentStatus: paymentIntent.status,
        },
      })
      console.log(`Reservación ${existingReservation.id} actualizada a CONFIRMED`)
    }

    return
  }

  try {
    // Generar un código QR único
    const qrCode = crypto.randomBytes(6).toString("hex").toUpperCase()

    // Crear la reservación en la base de datos
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        parkingSpotId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price: paymentIntent.amount / 100, // Convertir de centavos a la moneda base
        paymentMethod: "stripe",
        paymentId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: paymentIntent.status,
        qrCode,
        status: "CONFIRMED",
      },
      include: {
        parkingSpot: true,
        user: true,
      },
    })

    console.log(`Reservación creada: ${reservation.id}`)

    // Marcar el lugar como no disponible
    await prisma.parkingSpot.update({
      where: { id: parkingSpotId },
      data: { isAvailable: false },
    })

    console.log(`Lugar de estacionamiento ${parkingSpotId} marcado como no disponible`)

    // Generar QR con la información de la reservación
    const qrData = {
      id: reservation.id,
      userId: reservation.userId,
      nombre: reservation.user?.name || "Usuario",
      fechaReservacion: new Date().toISOString(),
      horaInicio: reservation.startTime.toISOString(),
      horaFin: reservation.endTime.toISOString(),
      lugarEstacionamiento: `Lugar ${reservation.parkingSpot.spotNumber}`,
      ubicacion: "Estacionamiento", // Fallback si no hay location
      estado: "PAGADO",
      precio: reservation.price,
    }

    // Generar el QR como una cadena de texto JSON
    const qrCodeContent = JSON.stringify(qrData)

    // Generar el QR como una imagen
    const qrCodeDataUrl = await generateQRCode(qrCodeContent)

    // Actualizar la reservación con el QR generado
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        qrCode: qrCodeDataUrl,
      },
    })

    // Enviar correo de confirmación si hay un correo disponible
    if (reservation.user.email) {
      try {
        await sendReceiptEmail(reservation.user.email, reservation.id, {
          spotNumber: reservation.parkingSpot.spotNumber,
          locationName: "Estacionamiento", // Fallback si no hay location
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          price: reservation.price,
          qrCode: qrCodeDataUrl,
        })
        console.log(`Correo de confirmación enviado a ${reservation.user.email}`)
      } catch (emailError) {
        console.error("Error al enviar correo de confirmación:", emailError)
      }
    }
  } catch (error) {
    console.error("Error al crear reservación desde webhook:", error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  // Registrar el fallo del pago
  console.log(`Pago fallido para PaymentIntent: ${paymentIntent.id}`)

  // Si ya existe una reservación asociada a este PaymentIntent, marcarla como cancelada
  const existingReservation = await prisma.reservation.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (existingReservation) {
    await prisma.reservation.update({
      where: { id: existingReservation.id },
      data: {
        status: "cancelled",
        stripePaymentStatus: paymentIntent.status,
      },
    })
    console.log(`Reservación ${existingReservation.id} marcada como cancelada`)
  }
}

