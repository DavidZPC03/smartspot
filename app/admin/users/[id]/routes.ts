import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

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
      verify(token, AUTH_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = params.id

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json({ error: "Error al obtener detalles del usuario" }, { status: 500 })
  }
}

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

    const userId = params.id
    const body = await request.json()
    const { name, email, phone, licensePlate } = body

    // Validar datos
    if (!phone) {
      return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 })
    }

    // Verificar si el teléfono ya está en uso por otro usuario
    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          NOT: {
            id: userId,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: "El número de teléfono ya está en uso" }, { status: 400 })
      }
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: userId,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: "El correo electrónico ya está en uso" }, { status: 400 })
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        licensePlate,
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: "Usuario actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Check if user has reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        userId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    })

    if (reservations.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el usuario porque tiene reservaciones activas",
        },
        { status: 400 },
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: "Usuario eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}

