"use client"

import type { ReactNode } from "react"
import { useState } from "react" // Añadir useState
import Link from "next/link"
import { LayoutDashboard, Calendar, Users, MapPin, Settings, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Estado para controlar la visibilidad del menú en móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Función para alternar el menú móvil
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Función para cerrar el menú al hacer clic en un enlace (en móvil)
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold text-xl">SMARTSPOT Admin</span>
        </div>
        <Button variant="ghost" className="text-white" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Sidebar - visible solo cuando mobileMenuOpen es true */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-600 text-white w-full">
          <nav className="p-4">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/reservations"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  Reservaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Users className="mr-3 h-5 w-5" />
                  Usuarios
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/locations"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <MapPin className="mr-3 h-5 w-5" />
                  Ubicaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/settings"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Configuración
                </Link>
              </li>
              <li className="border-t border-blue-700 pt-4">
                <Link
                  href="/"
                  className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Salir
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-blue-600 text-white flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold">SMARTSPOT</h1>
          <p className="text-sm opacity-75">Panel de Administración</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/dashboard"
                className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/reservations"
                className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="mr-3 h-5 w-5" />
                Reservaciones
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="mr-3 h-5 w-5" />
                Usuarios
              </Link>
            </li>
            <li>
              <Link
                href="/admin/locations"
                className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="mr-3 h-5 w-5" />
                Ubicaciones
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="mr-3 h-5 w-5" />
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-blue-700">
          <Link href="/" className="flex items-center p-2 rounded-lg hover:bg-blue-700 transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Salir
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}

