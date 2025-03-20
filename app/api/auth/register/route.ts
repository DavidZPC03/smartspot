import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sign } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, licensePlate } = body

    // Validate required fields
    if (!name || !phone || !licensePlate) {
      return NextResponse.json({ error: "Nombre, teléfono y placa son requeridos" }, { status: 400 })
    }

    // Validate email format if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Formato de correo electrónico inválido" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { licensePlate }],
      },
    })

    if (existingUser) {
      if (existingUser.phone === phone) {
        return NextResponse.json({ error: "Ya existe un usuario con este número de teléfono" }, { status: 400 })
      }
      if (existingUser.licensePlate === licensePlate) {
        return NextResponse.json({ error: "Ya existe un usuario con esta placa" }, { status: 400 })
      }
      return NextResponse.json({ error: "Usuario ya registrado" }, { status: 400 })
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        licensePlate,
        password: licensePlate, // Usar la placa como contraseña por defecto
      },
    })

    // Create auth token
    const token = sign(
      {
        id: user.id,
        phone: user.phone,
        licensePlate: user.licensePlate,
      },
      AUTH_SECRET,
      { expiresIn: "7d" },
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        licensePlate: user.licensePlate,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}

