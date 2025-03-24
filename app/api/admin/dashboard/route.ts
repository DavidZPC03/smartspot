import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido en tu archivo .env
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando GET /api/admin/dashboard")

    // Verificar el token de administrador
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No authorization header or invalid format:", authHeader)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    console.log("Token received:", token.substring(0, 10) + "...")

    try {
      // Verificar el token
      verify(token, AUTH_SECRET)
      console.log("Token verified successfully")
    } catch (err) {
      console.error("Token verification failed:", err)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    console.log("Token verified successfully, fetching dashboard data")

    // Obtener estadísticas básicas de manera simple
    // Contar usuarios
    const totalUsers = await prisma.user.count()
    console.log("Total users:", totalUsers)

    // Contar ubicaciones
    const totalLocations = await prisma.location.count()
    console.log("Total locations:", totalLocations)

    // Contar reservaciones
    const totalReservations = await prisma.reservation.count()
    console.log("Total reservations:", totalReservations)

    // Contar reservaciones activas - Corregido para usar comparación de fechas correctamente
    const now = new Date()
    console.log("Current date for active reservations check:", now.toISOString())

    try {
      const activeReservations = await prisma.reservation.count({
        where: {
          status: {
            in: ["CONFIRMED", "confirmed"],
          },
          startTime: {
            lte: now,
          },
          endTime: {
            gte: now,
          },
        },
      })
      console.log("Active reservations:", activeReservations)

      // Calcular ingresos totales - Corregido para evitar el error de Prisma
      // En lugar de filtrar por price not null, obtenemos todas las reservaciones
      // y filtramos en JavaScript
      const allReservations = await prisma.reservation.findMany({
        select: {
          price: true,
        },
      })
      console.log("All reservations for revenue calculation:", allReservations.length)

      // Filtrar las reservaciones con precio y calcular el total
      const validPayments = allReservations.filter((res) => res.price !== null && res.price !== undefined)
      console.log("Valid payments found:", validPayments.length)

      const totalRevenue = validPayments.reduce((sum, payment) => sum + (payment.price || 0), 0)
      console.log("Total revenue:", totalRevenue)

      // Obtener reservaciones recientes (últimos 7 días)
      const recentReservations = await prisma.reservation.count({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
      })
      console.log("Recent reservations (last 7 days):", recentReservations)

      console.log("Stats calculated:", {
        totalUsers,
        totalLocations,
        totalReservations,
        activeReservations,
        recentReservations,
        totalRevenue,
      })

      // Devolver los datos en formato JSON
      return NextResponse.json({
        totalUsers,
        totalLocations,
        totalReservations,
        totalRevenue,
        activeReservations,
        recentReservations,
      })
    } catch (prismaError) {
      console.error("Error in Prisma query:", prismaError)

      // Fallback: devolver estadísticas básicas sin las que fallaron
      return NextResponse.json({
        totalUsers,
        totalLocations,
        totalReservations,
        totalRevenue: 0,
        activeReservations: 0,
        recentReservations: 0,
      })
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        error: "Error al obtener datos del dashboard",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

