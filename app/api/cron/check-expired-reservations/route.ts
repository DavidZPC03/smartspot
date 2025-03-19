import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Verify cron job secret (in a real app)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Find pending reservations that have expired (start time has passed)
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        startTime: {
          lt: now,
        },
      },
    })

    // Cancel expired reservations
    for (const reservation of expiredReservations) {
      await prisma.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: "CANCELLED",
        },
      })
    }

    // Find completed reservations (end time has passed)
    const completedReservations = await prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        endTime: {
          lt: now,
        },
      },
    })

    // Mark reservations as completed
    for (const reservation of completedReservations) {
      await prisma.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: "COMPLETED",
        },
      })
    }

    return NextResponse.json({
      expired: expiredReservations.length,
      completed: completedReservations.length,
    })
  } catch (error) {
    console.error("Error checking expired reservations:", error)
    return NextResponse.json({ error: "Error checking expired reservations" }, { status: 500 })
  }
}

