"use client"

import React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutDashboard, Users, MapPin, DollarSign, Settings, QrCode, LogOut, Calendar, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Si es móvil, cerrar el sidebar por defecto
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Verificar al cargar
    checkMobile()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkMobile)

    // Limpiar listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")
    document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = "/admin-login"
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { path: "/admin/reservations", label: "Reservaciones", icon: <Calendar className="w-5 h-5 mr-3" /> },
    { path: "/admin/users", label: "Usuarios", icon: <Users className="w-5 h-5 mr-3" /> },
    { path: "/admin/locations", label: "Ubicaciones", icon: <MapPin className="w-5 h-5 mr-3" /> },
    { path: "/admin/parking-spots", label: "Lugares", icon: <MapPin className="w-5 h-5 mr-3" /> },
    { path: "/admin/prices", label: "Precios", icon: <DollarSign className="w-5 h-5 mr-3" /> },
    { path: "/admin/qr-scanner", label: "Escanear QR", icon: <QrCode className="w-5 h-5 mr-3" /> },
    { path: "/admin/settings", label: "Configuración", icon: <Settings className="w-5 h-5 mr-3" /> },
  ]

  // Format the date correctly for Spanish locale
  const date = new Date()
  const day = date.getDate()
  const weekday = date.toLocaleDateString("es-ES", { weekday: "long" })
  const month = date.toLocaleDateString("es-ES", { month: "long" })
  const year = date.getFullYear()
  const currentDate = `${weekday}, ${day} de ${month} de ${year}`

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="flex h-screen bg-white text-gray-800">
        {/* Sidebar - con transición suave */}
        <div
          className={`
            fixed md:relative z-40 h-full bg-white border-r border-gray-200 
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "w-64" : "w-0 md:w-16 overflow-hidden"}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Header del sidebar */}
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
              <h1
                className={`text-xl font-bold text-blue-600 transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 md:hidden"}`}
              >
                SMARTSPOT
              </h1>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <ul className="space-y-1 px-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                        isActive(item.path) ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      title={!isSidebarOpen ? item.label : undefined}
                    >
                      <div className="flex-shrink-0">
                        {React.cloneElement(item.icon as React.ReactElement, {
                          className: `w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`,
                        })}
                      </div>
                      <span
                        className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden md:block"}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer del sidebar */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors`}
                title={!isSidebarOpen ? "Cerrar sesión" : undefined}
              >
                <LogOut className={`w-5 h-5 ${isSidebarOpen ? "mr-3" : ""}`} />
                <span
                  className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden md:block"}`}
                >
                  Cerrar sesión
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header fijo en la parte superior */}
          <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-gray-500 text-sm">{currentDate}</div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
