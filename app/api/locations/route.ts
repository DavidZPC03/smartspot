import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get search query from URL params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    console.log("Fetching locations with query:", query)

    // Get all locations with availableSpots and pricePerHour
    const locations = await prisma.location.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: {
        name: "asc",
      },
      include: {
        parkingSpots: {
          where: {
            isAvailable: true, // Solo contar espacios disponibles
          },
          select: {
            id: true, // Solo necesitamos contar, no los datos completos
            price: true, // Incluir el precio para calcular pricePerHour
          },
        },
      },
    })

    console.log(`Found ${locations.length} locations`)

    // Mapear los resultados para incluir availableSpots y pricePerHour
    const locationsWithData = locations.map((location) => {
      const availableSpots = location.parkingSpots.length
      const pricePerHour =
        availableSpots > 0
          ? location.parkingSpots[0].price // Usar el precio del primer espacio disponible
          : 0 // Si no hay espacios disponibles, el precio es 0

      return {
        id: location.id,
        name: location.name,
        address: location.address,
        totalSpots: location.totalSpots,
        availableSpots,
        pricePerHour,
      }
    })

    return NextResponse.json({
      success: true,
      locations: locationsWithData,
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Error al cargar ubicaciones" }, { status: 500 })
  }
}