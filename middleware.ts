import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Este middleware es más simple y solo redirige a login si no hay token
export function middleware(request: NextRequest) {
  // Solo aplicar a rutas específicas de administrador que requieren autenticación
  // Excluimos la ruta de login para evitar un bucle de redirección
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // En el middleware no podemos acceder a localStorage, así que usaremos cookies
    const token = request.cookies.get("adminToken")?.value

    // Si no hay token, redirigir al login
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

