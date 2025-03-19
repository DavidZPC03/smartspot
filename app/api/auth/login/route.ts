import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sign } from "jsonwebtoken"

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

    // Buscar al usuario por teléfono y placa
    const user = await prisma.user.findFirst({
      where: {
        phone: body.phone,
        licensePlate: body.licensePlate,
      },
    })

    console.log("User found:", user)

    // Si no se encuentra el usuario, crear uno nuevo
    if (!user) {
      console.log("User not found, creating new user")

      // Crear un nuevo usuario
      const newUser = await prisma.user.create({
        data: {
          phone: body.phone,
          licensePlate: body.licensePlate,
          password: body.licensePlate, // Usar la placa como contraseña por defecto
        },
      })

      console.log("New user created:", newUser)

      // Generar token JWT
      const token = sign(
        {
          id: newUser.id,
          phone: newUser.phone,
          licensePlate: newUser.licensePlate,
        },
        AUTH_SECRET,
        { expiresIn: "7d" },
      )

      // Devolver el token y los datos del usuario
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          licensePlate: newUser.licensePlate,
        },
      })
    }

    // Si el usuario existe, verificar la contraseña (en este caso, la placa)
    const isPasswordValid = user.password === body.licensePlate

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
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}

