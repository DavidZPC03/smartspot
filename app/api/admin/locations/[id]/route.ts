import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const locationId = params.id

    // Get location details
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        parkingSpots: {
          orderBy: {
            spotNumber: "asc",
          },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error("Error fetching location details:", error)
    return NextResponse.json({ error: "Error al obtener detalles de la ubicación" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const locationId = params.id
    const body = await request.json()
    const { name, address, city, state, country, totalSpots } = body

    // Get current location
    const currentLocation = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        parkingSpots: {
          orderBy: {
            spotNumber: "asc",
          },
        },
      },
    })

    if (!currentLocation) {
      return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 })
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        name,
        address,
        city,
        state,
        country,
        totalSpots,
      },
    })

    // If total spots changed, update parking spots
    if (totalSpots !== currentLocation.totalSpots) {
      const currentSpotCount = currentLocation.parkingSpots.length

      if (totalSpots > currentSpotCount) {
        // Add new spots
        const newSpots = []
        for (let i = currentSpotCount + 1; i <= totalSpots; i++) {
          newSpots.push({
            spotNumber: i,
            locationId,
          })
        }

        await prisma.parkingSpot.createMany({
          data: newSpots,
        })
      } else if (totalSpots < currentSpotCount) {
        // Remove excess spots
        // First, check if any of the spots to be removed have reservations
        const spotsToRemove = currentLocation.parkingSpots.slice(totalSpots)

        for (const spot of spotsToRemove) {
          // Check for active reservations
          const hasReservations = await prisma.reservation.findFirst({
            where: {
              parkingSpotId: spot.id,
              status: {
                in: ["PENDING", "CONFIRMED"],
              },
            },
          })

          if (hasReservations) {
            // If spot has reservations, just mark it as inactive
            await prisma.parkingSpot.update({
              where: { id: spot.id },
              data: { isAvailable: false },
            })
          } else {
            // If no reservations, delete the spot
            await prisma.parkingSpot.delete({
              where: { id: spot.id },
            })
          }
        }
      }
    }

    return NextResponse.json({
      location: updatedLocation,
      message: "Ubicación actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Error al actualizar ubicación" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const locationId = params.id

    // Check if location has active reservations
    const hasReservations = await prisma.reservation.findFirst({
      where: {
        parkingSpot: {
          locationId,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    })

    if (hasReservations) {
      return NextResponse.json(
        { error: "No se puede eliminar una ubicación con reservaciones activas" },
        { status: 400 },
      )
    }

    // Delete all parking spots for this location
    await prisma.parkingSpot.deleteMany({
      where: { locationId },
    })

    // Delete location
    await prisma.location.delete({
      where: { id: locationId },
    })

    return NextResponse.json({
      message: "Ubicación eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ error: "Error al eliminar ubicación" }, { status: 500 })
  }
}

