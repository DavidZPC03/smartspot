import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@smartspot.com"
const ADMIN_PASSWORD = "admin123"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the login attempt
    console.log("Admin login attempt with:", body)

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json({ message: "Correo electrónico y contraseña son requeridos" }, { status: 400 })
    }

    // Check if credentials match the hardcoded admin credentials
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 })
    }

    // Create JWT token
    const token = sign(
      {
        id: "admin-1",
        email: ADMIN_EMAIL,
        role: "admin",
      },
      process.env.AUTH_SECRET || "fallback-secret",
      { expiresIn: "8h" },
    )

    // Set cookie with the correct name that matches middleware
    const cookieStore = cookies()
    cookieStore.set("adminToken", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 hours
    })

    // Return the token in the response so it can be stored in localStorage
    return NextResponse.json({
      success: true,
      token: token,
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ message: "Error del servidor" }, { status: 500 })
  }
}
