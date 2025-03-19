import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

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

    // Obtener el ID del lugar de estacionamiento
    const spotId = params.id

    // Obtener el nuevo precio del cuerpo de la solicitud
    const body = await request.json()
    const { price } = body

    // Validar el precio
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }

    // Verificar si el lugar existe
    const spot = await prisma.parkingSpot.findUnique({
      where: { id: spotId },
    })

    if (!spot) {
      return NextResponse.json({ error: "Lugar de estacionamiento no encontrado" }, { status: 404 })
    }

    // Actualizar el precio en la base de datos
    const updatedSpot = await prisma.parkingSpot.update({
      where: {
        id: spotId,
      },
      data: {
        price,
      },
    })

    return NextResponse.json({
      success: true,
      parkingSpot: updatedSpot,
    })
  } catch (error) {
    console.error("Error updating parking spot price:", error)
    return NextResponse.json({ error: "Error al actualizar el precio" }, { status: 500 })
  }
}

