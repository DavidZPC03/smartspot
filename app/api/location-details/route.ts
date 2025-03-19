import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get location ID from URL params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    console.log("Fetching location details for ID:", id)

    if (!id) {
      return NextResponse.json({ error: "ID de ubicación no proporcionado" }, { status: 400 })
    }

    // Get location details
    const location = await prisma.location.findUnique({
      where: {
        id,
      },
    })

    console.log("Location found:", location)

    if (!location) {
      return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      location,
    })
  } catch (error) {
    console.error("Error fetching location details:", error)
    return NextResponse.json({ error: "Error al cargar detalles de la ubicación" }, { status: 500 })
  }
}

