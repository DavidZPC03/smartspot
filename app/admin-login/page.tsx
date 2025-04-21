"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, MapPin, DollarSign, QrCode, Settings, LogOut, Map } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión")
      }

      // Store token in localStorage for client-side access
      if (data.token) {
        localStorage.setItem("adminToken", data.token)

        // Also store admin info
        localStorage.setItem(
          "admin",
          JSON.stringify({
            email: email,
            role: "admin",
          }),
        )
      }

      console.log("Login successful, redirecting to dashboard")

      // Add a small delay to ensure the localStorage is set before redirecting
      setTimeout(() => {
        // Use window.location for a full page refresh to ensure everything is loaded fresh
        window.location.href = "/admin/dashboard"
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0f1729]">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-[#0f1729] border-r border-gray-800">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-white">SMARTSPOT</h1>
            <p className="text-sm text-gray-400">Panel de Administración</p>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1">
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <Users className="w-5 h-5 mr-3" />
              Usuarios
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <MapPin className="w-5 h-5 mr-3" />
              Ubicaciones
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <DollarSign className="w-5 h-5 mr-3" />
              Precios
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <QrCode className="w-5 h-5 mr-3" />
              Escanear QR
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <Settings className="w-5 h-5 mr-3" />
              Configuración
            </Link>
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <Map className="w-5 h-5 mr-3" />
              Lugares
            </Link>
          </nav>
          <div className="px-2 pb-6">
            <Link href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-md">
              <LogOut className="w-5 h-5 mr-3" />
              Salir
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-8 space-y-8 bg-[#131b2e] rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">SMARTSPOT ADMIN</h2>
            <p className="mt-2 text-sm text-gray-400">Inicia sesión como administrador</p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-800 rounded-md text-red-200 text-sm">{error}</div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@smartspot.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link href="/user-login" className="text-sm text-blue-400 hover:text-blue-300">
              Iniciar sesión como usuario
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
