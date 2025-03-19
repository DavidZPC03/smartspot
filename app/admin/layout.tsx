import type { ReactNode } from "react"
import Link from "next/link"
import { LayoutDashboard, Calendar, Users, MapPin, Settings, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold text-xl">SMARTSPOT Admin</span>
        </div>
        <Button variant="ghost" className="text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
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

