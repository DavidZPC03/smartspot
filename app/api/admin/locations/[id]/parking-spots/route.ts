import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

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
      jwt.verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { id } = params

    // Obtener todos los lugares de estacionamiento para la ubicación
    const parkingSpots = await prisma.parkingSpot.findMany({
      where: {
        locationId: id,
      },
      orderBy: {
        spotNumber: "asc",
      },
    })

    return NextResponse.json(parkingSpots)
  } catch (error) {
    console.error("Error fetching parking spots:", error)
    return NextResponse.json({ error: "Error al obtener los lugares de estacionamiento" }, { status: 500 })
  }
}

