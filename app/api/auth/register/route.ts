import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Cambiado de import prisma from "@/lib/prisma"
import { sign } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, licensePlate } = body

    // Validate required fields
    if (!phone || !licensePlate) {
      return NextResponse.json({ error: "Teléfono y placa son requeridos" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Usuario ya registrado con este número de teléfono" }, { status: 400 })
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
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}

