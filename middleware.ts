import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obtener la ruta actual
  const path = request.nextUrl.pathname

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    "/",
    "/user-login",
    "/register",
    "/admin/login",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/admin-login",
  ]

  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith("/api/"))

  // Si es una ruta pública, permitir el acceso sin verificar token
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Rutas de administrador
  const isAdminPath = path.startsWith("/admin")

  // Verificar acceso a rutas de administrador
  if (isAdminPath) {
    // Obtener el token de administrador de las cookies
    const adminToken = request.cookies.get("adminToken")?.value

    // Si no hay token de administrador y no estamos en la página de login, redirigir al login
    if (!adminToken && path !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    return NextResponse.next()
  }

  // Para otras rutas que requieren autenticación de usuario
  const token = request.cookies.get("token")?.value

  // Si no hay token de usuario, redirigir al login de usuario
  if (!token) {
    return NextResponse.redirect(new URL("/user-login", request.url))
  }

  return NextResponse.next()
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: [
    // Excluir archivos estáticos y API routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}

