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
    const period = searchParams.get("period") || "week"

    let startDate: Date
    const endDate = new Date()

    // Set start date based on period
    switch (period) {
      case "day":
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 1)
        break
      case "week":
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 7)
        break
      case "month":
        startDate = new Date(endDate)
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "year":
        startDate = new Date(endDate)
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 7)
    }

    // Get daily revenue for the period
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(p."createdAt") as date,
        SUM(p.amount) as revenue
      FROM "Payment" p
      WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
      GROUP BY DATE(p."createdAt")
      ORDER BY date ASC
    `

    // Get reservations by location
    const reservationsByLocation = await prisma.$queryRaw`
      SELECT 
        l.name as location,
        COUNT(r.id) as count
      FROM "Location" l
      JOIN "ParkingSpot" ps ON l.id = ps."locationId"
      JOIN "Reservation" r ON ps.id = r."parkingSpotId"
      WHERE r."createdAt" >= ${startDate}
        AND r."createdAt" <= ${endDate}
      GROUP BY l.name
      ORDER BY count DESC
    `

    // Get new users over time
    const newUsers = await prisma.$queryRaw`
      SELECT 
        DATE(u."createdAt") as date,
        COUNT(u.id) as count
      FROM "User" u
      WHERE u."createdAt" >= ${startDate}
        AND u."createdAt" <= ${endDate}
      GROUP BY DATE(u."createdAt")
      ORDER BY date ASC
    `

    // Get occupancy rate by location
    const occupancyRate = await prisma.$queryRaw`
      SELECT 
        l.name as location,
        l."totalSpots" as totalSpots,
        COUNT(DISTINCT r.id) as reservations,
        ROUND(COUNT(DISTINCT r.id)::decimal / l."totalSpots" * 100, 2) as occupancyRate
      FROM "Location" l
      LEFT JOIN "ParkingSpot" ps ON l.id = ps."locationId"
      LEFT JOIN "Reservation" r ON ps.id = r."parkingSpotId"
        AND r."createdAt" >= ${startDate}
        AND r."createdAt" <= ${endDate}
      GROUP BY l.name, l."totalSpots"
      ORDER BY occupancyRate DESC
    `

    return NextResponse.json({
      dailyRevenue,
      reservationsByLocation,
      newUsers,
      occupancyRate,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}

