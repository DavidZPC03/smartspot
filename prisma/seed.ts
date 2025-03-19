import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

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
    const location = await prisma.location.create({
      data: locationData,
    })

    console.log(`Created location: ${location.name}`)

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

    console.log(`Created ${parkingSpots.length} parking spots for ${location.name}`)
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
    const user = await prisma.user.create({
      data: userData,
    })

    console.log(`Created user: ${user.name}`)
  }

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

