"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, ChevronLeft, ChevronRight, Phone, Mail, Car, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string | null
  email: string | null
  phone: string
  licensePlate: string | null
  createdAt: string
  _count?: {
    reservations: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Estado para el diálogo de edición
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    licensePlate: "",
  })
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Obtener el token de autenticación
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchQuery) {
        queryParams.append("search", searchQuery)
      }

      // Incluir el token en el encabezado de autorización
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.")
        }
        throw new Error("Error al cargar usuarios")
      }

      const data = await response.json()

      // Si no hay datos de paginación, usar valores predeterminados
      if (!data.pagination) {
        data.pagination = {
          total: data.users?.length || 0,
          page: 1,
          limit: 10,
          pages: 1,
        }
      }

      setUsers(data.users || [])
      setPagination(data.pagination)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchUsers()
  }, [pagination.page, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchUsers()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone,
      licensePlate: user.licensePlate || "",
    })
    setUpdateSuccess(null)
    setUpdateError(null)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      setUpdateLoading(true)
      setUpdateError(null)
      setUpdateSuccess(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(editForm),
      })

      // Verificar si la respuesta es un error HTML (404, 500, etc.)
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar el usuario")
      }

      const data = await response.json()

      // Actualizar el estado local
      setUsers(users.map((user) => (user.id === editingUser.id ? { ...user, ...editForm } : user)))

      setUpdateSuccess("Usuario actualizado correctamente")

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setEditingUser(null)
      }, 2000)
    } catch (err) {
      console.error("Error updating user:", err)
      setUpdateError((err as Error).message)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setLoading(true)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      // Verificar si la respuesta es un error HTML (404, 500, etc.)
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar el usuario")
      }

      // Actualizar el estado local
      setUsers(users.filter((user) => user.id !== userId))

      // Mostrar mensaje de éxito
      alert("Usuario eliminado correctamente")
    } catch (err) {
      console.error("Error deleting user:", err)
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
          </div>
          <p className="text-center py-8">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
          </div>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/admin/dashboard")}>Volver al Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono o placa..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Buscar</Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-40">Cargando...</div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Reservaciones</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || "Sin nombre"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                <span className="text-sm">{user.phone}</span>
                              </div>
                              {user.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="text-sm">{user.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-1" />
                              <span>{user.licensePlate || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user._count?.reservations || 0}</TableCell>
                          <TableCell>
                            {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: es }) : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {users.length} de {pagination.total} usuarios
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Diálogo para editar usuario */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modifica los datos del usuario</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+52 (81) 1234-5678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa</Label>
                <Input
                  id="licensePlate"
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })}
                  placeholder="ABC-123"
                />
              </div>

              {updateSuccess && (
                <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                  <AlertTitle>Éxito</AlertTitle>
                  <AlertDescription>{updateSuccess}</AlertDescription>
                </Alert>
              )}

              {updateError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={updateLoading}>
                {updateLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

