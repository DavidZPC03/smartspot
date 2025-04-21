"use client"

import type React from "react"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SMARTSPOT ADMIN</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/reservations"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reservaciones
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Usuarios
              </Link>
              <Link
                href="/admin/locations"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Ubicaciones
              </Link>
              <Link
                href="/admin/prices"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Precios
              </Link>
              <Link
                href="/admin/settings"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Configuración
              </Link>
              <button
                onClick={() => {
                  document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                  window.location.href = "/admin-login"
                }}
                className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </ThemeProvider>
  )
}
