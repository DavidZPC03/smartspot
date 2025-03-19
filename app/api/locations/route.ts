import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Corregido: importación correcta

export async function GET(request: NextRequest) {
  try {
    // Get search query from URL params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    console.log("Fetching locations with query:", query)

    // Get all locations, with optional search
    const locations = await prisma.location.findMany({
      where: {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { address: { contains: query, mode: "insensitive" } }],
      },
      orderBy: {
        name: "asc",
      },
    })

    console.log(`Found ${locations.length} locations`)

    return NextResponse.json({
      success: true,
      locations,
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Error al cargar ubicaciones" }, { status: 500 })
  }
}

