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

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Verificar si la tabla EmailLog existe
    let tableExists = false
    try {
      // Intentar contar registros para ver si la tabla existe
      await prisma.$queryRaw`SELECT 1 FROM "EmailLog" LIMIT 1`
      tableExists = true
    } catch (e) {
      console.log("EmailLog table does not exist yet")
      tableExists = false
    }

    // Si la tabla no existe, devolver una lista vacía
    if (!tableExists) {
      return NextResponse.json({
        logs: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      })
    }

    // Si la tabla existe, obtener los registros
    const skip = (page - 1) * limit
    const totalLogs = await prisma.emailLog.count()
    const totalPages = Math.ceil(totalLogs / limit)

    const logs = await prisma.emailLog.findMany({
      skip,
      take: limit,
      orderBy: {
        sentAt: "desc",
      },
      include: {
        reservation: {
          select: {
            id: true,
          },
        },
      },
    })

    // Formatear los registros para la respuesta
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      to: log.to,
      subject: log.subject,
      sentAt: log.sentAt,
      status: log.status,
      reservationId: log.reservationId,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching email logs:", error)

    // Devolver una respuesta vacía en caso de error
    return NextResponse.json({
      logs: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      },
    })
  }
}

