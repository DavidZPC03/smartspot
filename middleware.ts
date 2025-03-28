import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación de usuario
const userProtectedRoutes = ["/locations", "/parking-spots", "/payment", "/confirmation", "/reservations", "/profile"]

// Rutas que requieren autenticación de administrador
const adminProtectedRoutes = [
  "/admin/dashboard",
  "/admin/reservations",
  "/admin/users",
  "/admin/locations",
  "/admin/parking-spots",
  "/admin/payments",
  "/admin/settings",
  "/admin/verify-qr",
  "/admin/qr-scanner",
  "/admin/prices",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si es una ruta protegida de usuario
  const isUserProtectedRoute = userProtectedRoutes.some((route) => pathname.startsWith(route))

  // Verificar si es una ruta protegida de administrador
  const isAdminProtectedRoute = adminProtectedRoutes.some((route) => pathname.startsWith(route))

  // Obtener tokens de las cookies
  const userToken = request.cookies.get("token")?.value
  const adminToken = request.cookies.get("adminToken")?.value

  console.log(`Middleware checking path: ${pathname}`)
  console.log(`User token exists: ${!!userToken}`)
  console.log(`Admin token exists: ${!!adminToken}`)

  // Redirigir si intenta acceder a una ruta protegida de usuario sin token
  if (isUserProtectedRoute && !userToken) {
    console.log(`Redirecting to user login from ${pathname}`)
    const url = new URL("/user-login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirigir si intenta acceder a una ruta protegida de administrador sin token
  if (isAdminProtectedRoute && !adminToken) {
    console.log(`Redirecting to admin login from ${pathname}`)
    const url = new URL("/admin/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-\\d+x\\d+\\.png).*)",
  ],
}

