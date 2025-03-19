import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Esta ruta solo está disponible en entorno de desarrollo" }, { status: 403 })
    }

    // Create locations
    const locations = [
      {
        name: "S-Mart Campeche",
        address: "Calle Quetzalcóatl 3246",
        city: "Nuevo Laredo",
        state: "Tamaulipas",
        country: "México",
        totalSpots: 20,
      },
      {
        name: "H-E-B Nuevo Laredo",
        address: "Av. Reforma 4400",
        city: "Nuevo Laredo",
        state: "Tamaulipas",
        country: "México",
        totalSpots: 15,
      },
      {
        name: "Walmart Paseo Reforma",
        address: "C. Lago de Chapala 5601",
        city: "Nuevo Laredo",
        state: "Tamaulipas",
        country: "México",
        totalSpots: 25,
      },
    ]

    for (const locationData of locations) {
      // Check if location already exists
      const existingLocation = await prisma.location.findFirst({
        where: {
          name: locationData.name,
          address: locationData.address,
        },
      })

      if (!existingLocation) {
        const location = await prisma.location.create({
          data: locationData,
        })

        // Create parking spots for this location
        const parkingSpots = []
        for (let i = 1; i <= locationData.totalSpots; i++) {
          parkingSpots.push({
            spotNumber: i,
            locationId: location.id,
          })
        }

        await prisma.parkingSpot.createMany({
          data: parkingSpots,
        })
      }
    }

    // Create sample users
    const users = [
      {
        name: "Juan Pérez",
        email: "juan@example.com",
        phone: "+5218111234567",
        licensePlate: "ABC123",
      },
      {
        name: "María García",
        email: "maria@example.com",
        phone: "+5218129876543",
        licensePlate: "XYZ789",
      },
    ]

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          phone: userData.phone,
        },
      })

      if (!existingUser) {
        await prisma.user.create({
          data: userData,
        })
      }
    }

    return NextResponse.json({
      message: "Base de datos sembrada exitosamente",
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Error al sembrar la base de datos" }, { status: 500 })
  }
}

