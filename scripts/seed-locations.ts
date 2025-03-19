import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Limpiar las ubicaciones existentes
  await prisma.location.deleteMany({})

  // Crear ubicaciones de ejemplo
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: "Estacionamiento Centro",
        address: "Av. Juárez 123, Centro, Monterrey",
        latitude: 25.6714,
        longitude: -100.3092,
        parkingSpots: {
          create: [
            { spotNumber: 1, price: 25.0 },
            { spotNumber: 2, price: 25.0 },
            { spotNumber: 3, price: 25.0 },
            { spotNumber: 4, price: 25.0 },
            { spotNumber: 5, price: 25.0 },
          ],
        },
      },
    }),
    prisma.location.create({
      data: {
        name: "Estacionamiento San Pedro",
        address: "Calzada del Valle 456, San Pedro Garza García",
        latitude: 25.6573,
        longitude: -100.3702,
        parkingSpots: {
          create: [
            { spotNumber: 1, price: 30.0 },
            { spotNumber: 2, price: 30.0 },
            { spotNumber: 3, price: 30.0 },
            { spotNumber: 4, price: 30.0 },
            { spotNumber: 5, price: 30.0 },
          ],
        },
      },
    }),
    prisma.location.create({
      data: {
        name: "Estacionamiento Fundidora",
        address: "Av. Fundidora 501, Obrera, Monterrey",
        latitude: 25.6785,
        longitude: -100.2842,
        parkingSpots: {
          create: [
            { spotNumber: 1, price: 20.0 },
            { spotNumber: 2, price: 20.0 },
            { spotNumber: 3, price: 20.0 },
            { spotNumber: 4, price: 20.0 },
            { spotNumber: 5, price: 20.0 },
          ],
        },
      },
    }),
  ])

  console.log(`Creadas ${locations.length} ubicaciones con lugares de estacionamiento`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

