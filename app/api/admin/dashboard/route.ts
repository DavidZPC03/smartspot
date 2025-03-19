import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // In a real app, check if user is admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    // Default to last 30 days if not provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    const startDate = startDateStr ? new Date(startDateStr) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total locations
    const totalLocations = await prisma.location.count()

    // Get total reservations in date range
    const totalReservations = await prisma.reservation.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Get total revenue in date range
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    })

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

    // Get reservations by status
    const reservationsByStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM "Reservation"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY status
    `

    // Get top locations by reservations
    const topLocations = await prisma.$queryRaw`
      SELECT l.name, COUNT(r.id) as reservations
      FROM "Location" l
      JOIN "ParkingSpot" ps ON l.id = ps."locationId"
      JOIN "Reservation" r ON ps.id = r."parkingSpotId"
      WHERE r."createdAt" >= ${startDate} AND r."createdAt" <= ${endDate}
      GROUP BY l.name
      ORDER BY reservations DESC
      LIMIT 5
    `

    return NextResponse.json({
      totalUsers,
      totalLocations,
      totalReservations,
      totalRevenue,
      reservationsByStatus,
      topLocations,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Error al obtener datos del dashboard" }, { status: 500 })
  }
}

