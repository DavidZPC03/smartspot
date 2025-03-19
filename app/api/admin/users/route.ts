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
      // Verificar el token
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obtener parámetros de paginación y búsqueda
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    // Calcular el offset para la paginación
    const skip = (page - 1) * limit

    // Construir la consulta de búsqueda
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { licensePlate: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}

    // Obtener el total de usuarios que coinciden con la búsqueda
    const totalUsers = await prisma.user.count({
      where: whereClause,
    })

    // Obtener los usuarios con paginación
    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Añadir un contador de reservaciones ficticio para mantener la compatibilidad con el frontend
    const usersWithMockCounts = users.map((user) => ({
      ...user,
      _count: {
        reservations: 0, // Valor ficticio ya que no existe la relación
      },
    }))

    // Calcular el número total de páginas
    const totalPages = Math.ceil(totalUsers / limit)

    return NextResponse.json({
      success: true,
      users: usersWithMockCounts,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

