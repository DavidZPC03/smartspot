import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest) {
  try {
    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      // Verificar el token - simplificado para evitar errores
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener todas las ubicaciones con lugares de estacionamiento
    const locations = await prisma.location.findMany({
      include: {
        parkingSpots: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      locations,
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Error al obtener ubicaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, address, totalSpots } = body

    // Validar datos
    if (!name || !address) {
      return NextResponse.json({ error: "Nombre y dirección son obligatorios" }, { status: 400 })
    }

    if (!totalSpots || totalSpots < 1) {
      return NextResponse.json({ error: "El número de lugares debe ser un número positivo" }, { status: 400 })
    }

    // Crear la ubicación - solo con los campos que existen en el modelo
    const location = await prisma.location.create({
      data: {
        name,
        address,
        totalSpots,
      },
    })

    // Crear los lugares de estacionamiento para esta ubicación
    const parkingSpots = []
    for (let i = 1; i <= totalSpots; i++) {
      parkingSpots.push({
        spotNumber: i,
        locationId: location.id,
        price: 20.0, // Precio predeterminado
      })
    }

    await prisma.parkingSpot.createMany({
      data: parkingSpots,
    })

    return NextResponse.json({
      success: true,
      location,
      message: "Ubicación creada exitosamente",
    })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Error al crear ubicación" }, { status: 500 })
  }
}

