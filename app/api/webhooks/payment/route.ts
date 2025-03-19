import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (in a real app)
    // const signature = request.headers.get('x-payment-signature')
    // if (!verifySignature(signature, await request.text(), process.env.PAYMENT_WEBHOOK_SECRET)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const body = await request.json()
    const {
      event,
      data: { id: transactionId, status, metadata },
    } = body

    // Only process successful payments
    if (event !== "payment.successful" || status !== "completed") {
      return NextResponse.json({ received: true })
    }

    // Get reservation ID from metadata
    const { reservationId } = metadata

    if (!reservationId) {
      console.error("No reservation ID in payment metadata")
      return NextResponse.json({ error: "Missing reservation ID" }, { status: 400 })
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: {
        reservationId,
      },
      data: {
        status: "COMPLETED",
        transactionId,
      },
    })

    // Generate QR code and update reservation
    const qrCode = await generateQRCode(reservationId)

    await prisma.reservation.update({
      where: {
        id: reservationId,
      },
      data: {
        status: "CONFIRMED",
        qrCode,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing payment webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}

