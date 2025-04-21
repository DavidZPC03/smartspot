"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Mail, Settings, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmailLog {
  id: string
  to: string
  subject: string
  sentAt: Date
  status: string
  reservationId?: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("emails")
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchEmailLogs()
  }, [page, router])

  const fetchEmailLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/email-logs?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.")
        }
        throw new Error("Error al cargar registros de correos")
      }

      const data = await response.json()

      setEmailLogs(data.logs || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (err) {
      console.error("Error fetching email logs:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Configuración del Sistema</CardTitle>
          <CardDescription>Administra la configuración del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="emails">
                <Mail className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Correos Enviados</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Configuración General</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Correos Enviados</CardTitle>
                  <CardDescription>Registro de todos los correos enviados a los usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando...</span>
                    </div>
                  ) : emailLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No hay registros de correos enviados</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Destinatario</TableHead>
                              <TableHead className="whitespace-nowrap">Asunto</TableHead>
                              <TableHead className="whitespace-nowrap">Fecha de Envío</TableHead>
                              <TableHead className="whitespace-nowrap">Estado</TableHead>
                              <TableHead className="whitespace-nowrap">Reservación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emailLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="max-w-[150px] truncate">{log.to}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {format(new Date(log.sentAt), "PPP HH:mm", { locale: es })}
                                </TableCell>
                                <TableCell>
                                  {log.status === "SENT" ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      Enviado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-100 text-red-800">
                                      Fallido
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {log.reservationId ? (
                                    <Button
                                      variant="link"
                                      onClick={() => router.push(`/admin/reservations/${log.reservationId}`)}
                                      className="p-0 h-auto"
                                    >
                                      Ver
                                    </Button>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                          Página {page} de {totalPages}
                        </div>
                        <div className="flex items-center justify-center sm:justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración General</CardTitle>
                  <CardDescription>Configura los parámetros generales del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Configuración de Correo</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Estos ajustes se configuran a través de variables de entorno en el servidor.
                      </p>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm">
                          <strong>Servidor SMTP:</strong> {process.env.EMAIL_HOST || "smtp.gmail.com"}
                        </p>
                        <p className="text-sm">
                          <strong>Puerto:</strong> {process.env.EMAIL_PORT || "587"}
                        </p>
                        <p className="text-sm">
                          <strong>Correo remitente:</strong> {process.env.EMAIL_USER || "configurar en .env"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
