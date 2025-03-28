import { type NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"

// Asegúrate de que AUTH_SECRET esté definido
const AUTH_SECRET = process.env.AUTH_SECRET || "your-fallback-secret-key-for-development"

// Credenciales de administrador predefinidas (en un entorno real, esto estaría en la base de datos)
const ADMIN_EMAIL = "admin@smartspot.com"
const ADMIN_PASSWORD = "admin123" // En un entorno real, esto sería un hash

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Admin login attempt with:", body)

    // Validar los datos de entrada
    if (!body.email || !body.password) {
      console.error("Missing required fields:", { body })
      return NextResponse.json({ error: "Correo y contraseña son requeridos" }, { status: 400 })
    }

    // Verificar si las credenciales coinciden con las predefinidas
    // En un entorno real, buscaríamos en la base de datos
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      console.error("Invalid admin credentials")
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Generar token JWT
    const token = sign(
      {
        id: "admin-id",
        email: body.email,
        role: "admin",
      },
      AUTH_SECRET,
      { expiresIn: "1d" },
    )

    // Crear la respuesta
    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: "admin-id",
        email: body.email,
        role: "admin",
      },
    })

    // Establecer la cookie directamente en la respuesta
    response.cookies.set({
      name: "adminToken",
      value: token,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día en segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    console.log("Admin login successful, token generated and cookie set")
    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}

