import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Verify cron job secret (in a real app)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()

    // Find upcoming reservations in the next hour
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: now,
          lte: oneHourFromNow,
        },
      },
      include: {
        user: true,
        parkingSpot: {
          include: {
            location: true,
          },
        },
      },
    })

    // In a real app, you would send SMS or email reminders here
    // For this example, we'll just log the reminders

    const remindersSent = []

    for (const reservation of upcomingReservations) {
      // Check if we've already sent a reminder for this reservation
      const alreadySent = await prisma.reminderLog.findFirst({
        where: {
          reservationId: reservation.id,
          type: "UPCOMING",
        },
      })

      if (!alreadySent) {
        // In a real app, send SMS or email here
        console.log(`Sending reminder to ${reservation.user.phone} for reservation at ${reservation.startTime}`)

        // Log that we sent a reminder
        await prisma.reminderLog.create({
          data: {
            reservationId: reservation.id,
            type: "UPCOMING",
            sentAt: now,
          },
        })

        remindersSent.push(reservation.id)
      }
    }

    return NextResponse.json({
      remindersSent: remindersSent.length,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Error sending reminders" }, { status: 500 })
  }
}

