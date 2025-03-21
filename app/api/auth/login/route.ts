import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sign } from "jsonwebtoken"
import { isValidPhone, isValidLicensePlate } from "@/lib/validations"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Login attempt with:", body)

    // Validar los datos de entrada
    if (!body.phone || !body.licensePlate) {
      console.error("Missing required fields:", { body })
      return NextResponse.json({ error: "Teléfono y placa son requeridos" }, { status: 400 })
    }

    // Validar formato de teléfono
    if (!isValidPhone(body.phone)) {
      return NextResponse.json({ error: "Formato de teléfono inválido" }, { status: 400 })
    }

    // Validar formato de placa
    if (!isValidLicensePlate(body.licensePlate)) {
      return NextResponse.json({ error: "Formato de placa inválido" }, { status: 400 })
    }

    // Buscar al usuario por teléfono y placa
    const user = await prisma.user.findFirst({
      where: {
        phone: body.phone,
        licensePlate: body.licensePlate,
      },
    })

    console.log("User found:", user)

    // Si no se encuentra el usuario, devolver error
    if (!user) {
      console.log("User not found, returning error")
      return NextResponse.json(
        {
          error: "Usuario no encontrado. Por favor, regístrese primero.",
        },
        { status: 404 },
      )
    }

    // Si el usuario existe, verificar la contraseña (en este caso, la placa)
    const isPasswordValid = user.password === body.licensePlate || user.password === "default_password"

    if (!isPasswordValid) {
      console.error("Invalid password for user:", user.id)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Generar token JWT
    const token = sign(
      {
        id: user.id,
        phone: user.phone,
        licensePlate: user.licensePlate,
      },
      AUTH_SECRET,
      { expiresIn: "7d" },
    )

    // Devolver el token y los datos del usuario
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        licensePlate: user.licensePlate,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}

