"use client"

import type React from "react"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  QrCode,
  Car,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Store the current theme before setting admin theme
    const currentTheme = localStorage.getItem("theme")
    if (currentTheme) {
      localStorage.setItem("userTheme", currentTheme)
    }

    // Set theme to dark by default for admin panel
    setTheme("dark")
  }, [setTheme])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const handleLogout = () => {
    // Restore user theme before logging out
    const userTheme = localStorage.getItem("userTheme")
    if (userTheme) {
      localStorage.setItem("theme", userTheme)
    }

    // Clear admin-specific data
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")

    // Remove the cookie
    document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  if (!mounted) return null

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen flex flex-col md:flex-row dark:linear-gradient-bg">
        {/* Mobile Header */}
        <div className="md:hidden bg-background/80 backdrop-blur-md border-b border-border/50 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center">
            <span className="font-bold text-xl">SMARTSPOT</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md w-full absolute z-40 top-[60px] left-0 right-0 border-b border-border/50">
            <nav className="p-4">
              <ul className="space-y-2">
                <NavItem
                  href="/admin/dashboard"
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Dashboard"
                  active={isActive("/admin/dashboard")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/reservations"
                  icon={<Calendar className="h-4 w-4" />}
                  label="Reservaciones"
                  active={isActive("/admin/reservations")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/users"
                  icon={<Users className="h-4 w-4" />}
                  label="Usuarios"
                  active={isActive("/admin/users")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/locations"
                  icon={<MapPin className="h-4 w-4" />}
                  label="Ubicaciones"
                  active={isActive("/admin/locations")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/prices"
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Precios"
                  active={isActive("/admin/prices")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/qr-scanner"
                  icon={<QrCode className="h-4 w-4" />}
                  label="Escanear QR"
                  active={isActive("/admin/qr-scanner")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/settings"
                  icon={<Settings className="h-4 w-4" />}
                  label="Configuración"
                  active={isActive("/admin/settings")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <NavItem
                  href="/admin/parking-spots"
                  icon={<Car className="h-4 w-4" />}
                  label="Lugares"
                  active={isActive("/admin/parking-spots")}
                  onClick={closeMobileMenu}
                  mobile
                />
                <li className="border-t border-border/50 pt-2 mt-2">
                  <Link
                    href="/"
                    className="flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      closeMobileMenu()
                      handleLogout()
                    }}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Salir</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 linear-sidebar flex-col h-screen sticky top-0">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">SMARTSPOT</h1>
              <p className="text-xs text-muted-foreground">Panel de Administración</p>
            </div>
            <ThemeToggle />
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem
                href="/admin/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
                active={isActive("/admin/dashboard")}
              />
              <NavItem
                href="/admin/reservations"
                icon={<Calendar className="h-4 w-4" />}
                label="Reservaciones"
                active={isActive("/admin/reservations")}
              />
              <NavItem
                href="/admin/users"
                icon={<Users className="h-4 w-4" />}
                label="Usuarios"
                active={isActive("/admin/users")}
              />
              <NavItem
                href="/admin/locations"
                icon={<MapPin className="h-4 w-4" />}
                label="Ubicaciones"
                active={isActive("/admin/locations")}
              />
              <NavItem
                href="/admin/prices"
                icon={<DollarSign className="h-4 w-4" />}
                label="Precios"
                active={isActive("/admin/prices")}
              />
              <NavItem
                href="/admin/qr-scanner"
                icon={<QrCode className="h-4 w-4" />}
                label="Escanear QR"
                active={isActive("/admin/qr-scanner")}
              />
              <NavItem
                href="/admin/settings"
                icon={<Settings className="h-4 w-4" />}
                label="Configuración"
                active={isActive("/admin/settings")}
              />
              <NavItem
                href="/admin/parking-spots"
                icon={<Car className="h-4 w-4" />}
                label="Lugares"
                active={isActive("/admin/parking-spots")}
              />
            </ul>
          </nav>
          <div className="p-4 border-t border-border/50">
            <Link
              href="/"
              className="flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Salir</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  onClick?: () => void
  mobile?: boolean
}

function NavItem({ href, icon, label, active, onClick, mobile }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center ${mobile ? "p-2" : "px-3 py-2"} rounded-md transition-colors ${
          active ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
        }`}
        onClick={onClick}
      >
        <span className={`${active ? "text-primary" : "text-muted-foreground"} mr-3`}>{icon}</span>
        <span className={active ? "font-medium" : ""}>{label}</span>
      </Link>
    </li>
  )
}

