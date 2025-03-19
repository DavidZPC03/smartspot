import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Corregido: importación correcta

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // En Next.js 15, necesitamos usar await con params
    const unwrappedParams = await params
    const locationId = unwrappedParams.id
    console.log("Fetching spots for location:", locationId)

    // Get date parameters from query
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0]
    console.log("Date parameter:", dateParam)

    // Validate location exists
    const location = await prisma.location.findUnique({
      where: {
        id: locationId,
      },
    })

    if (!location) {
      console.error("Location not found:", locationId)
      return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 })
    }

    // Get all parking spots for this location
    const parkingSpots = await prisma.parkingSpot.findMany({
      where: {
        locationId,
      },
      orderBy: {
        spotNumber: "asc",
      },
    })

    console.log(`Found ${parkingSpots.length} parking spots`)

    // Check which spots are reserved for the given date
    const startOfDay = new Date(dateParam)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(dateParam)
    endOfDay.setHours(23, 59, 59, 999)

    const reservations = await prisma.reservation.findMany({
      where: {
        parkingSpotId: {
          in: parkingSpots.map((spot) => spot.id),
        },
        startTime: {
          lte: endOfDay,
        },
        endTime: {
          gte: startOfDay,
        },
        status: "confirmed",
      },
      select: {
        parkingSpotId: true,
      },
    })

    console.log(`Found ${reservations.length} reservations for the date`)

    // Create a set of reserved spot IDs for quick lookup
    const reservedSpotIds = new Set(reservations.map((r) => r.parkingSpotId))

    // Mark spots as available or not
    const spotsWithAvailability = parkingSpots.map((spot) => ({
      id: spot.id,
      spotNumber: spot.spotNumber,
      price: spot.price,
      isAvailable: !reservedSpotIds.has(spot.id),
    }))

    return NextResponse.json({
      success: true,
      parkingSpots: spotsWithAvailability,
    })
  } catch (error) {
    console.error("Error fetching parking spots:", error)
    return NextResponse.json({ error: "Error al cargar lugares de estacionamiento" }, { status: 500 })
  }
}

