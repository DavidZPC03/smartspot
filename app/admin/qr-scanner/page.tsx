"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Upload, Camera, Check, X } from "lucide-react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ReservationDetails {
  id: string
  userId: string
  nombre?: string
  fechaReservacion: string
  horaInicio: string
  horaFin: string
  lugarEstacionamiento: string
  ubicacion: string
  estado: string
  precio: number
  signature: string
}

export default function QRScannerPage() {
  const [activeTab, setActiveTab] = useState("camera")
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [reservation, setReservation] = useState<any | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup scanner when component unmounts
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch (error) {
          console.error("Error clearing scanner:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (activeTab === "camera" && !scannerInitialized) {
      initializeScanner()
    }
  }, [activeTab, scannerInitialized])

  const initializeScanner = () => {
    try {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch (error) {
          console.error("Error clearing existing scanner:", error)
        }
      }

      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false)

      scanner.render(onScanSuccess, onScanError)
      scannerRef.current = scanner
      setScannerInitialized(true)
    } catch (error) {
      console.error("Error initializing scanner:", error)
      setError("Error al inicializar el escáner de QR")
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    try {
      // Pause the scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.pause(true)
        } catch (error) {
          console.error("Error pausing scanner:", error)
        }
      }

      await processQRCode(decodedText)
    } catch (error) {
      console.error("Error in scan success handler:", error)
      setError((error as Error).message || "Error al procesar el código QR")

      // Resume the scanner after error
      if (scannerRef.current) {
        try {
          await scannerRef.current.resume()
        } catch (resumeError) {
          console.error("Error resuming scanner:", resumeError)
        }
      }
    }
  }

  const onScanError = (error: any) => {
    // Only log the error, don't show to user as this happens frequently
    console.error("QR scan error:", error)
  }

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      setError("Por favor ingresa un código QR")
      return
    }

    try {
      await processQRCode(manualCode.trim())
    } catch (error) {
      console.error("Error in manual verify:", error)
      setError((error as Error).message || "Error al verificar el código QR")
    }
  }

  const processQRCode = async (qrCode: string) => {
    setLoading(true)
    setError(null)

    try {
      // Verificar el QR usando la API
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch("/api/admin/verify-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qrCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al verificar el código QR")
      }

      const result = await response.json()

      if (!result.valid) {
        throw new Error(result.message || "Código QR inválido")
      }

      // Si es válido, mostrar los detalles de la reservación
      setReservation(result.reservation)
      setShowConfirmation(true)
    } catch (error) {
      console.error("Error processing QR code:", error)
      throw new Error((error as Error).message || "Error al procesar el código QR")
    } finally {
      setLoading(false)
    }
  }

  const confirmReservation = async () => {
    if (!reservation) return

    setConfirmLoading(true)
    setConfirmError(null)
    setConfirmSuccess(false)

    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      // Actualizar el estado de la reservación en la base de datos
      const response = await fetch(`/api/admin/reservations/${reservation.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al confirmar la reservación")
      }

      setConfirmSuccess(true)

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false)
        setReservation(null)
        setConfirmSuccess(false)

        // Reset manual code if in manual tab
        if (activeTab === "manual") {
          setManualCode("")
        }

        // Resume scanner if in camera tab
        if (activeTab === "camera" && scannerRef.current) {
          try {
            scannerRef.current.resume()
          } catch (error) {
            console.error("Error resuming scanner:", error)
            // If resume fails, reinitialize
            initializeScanner()
          }
        }
      }, 2000)
    } catch (error) {
      console.error("Error confirming reservation:", error)
      setConfirmError((error as Error).message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const cancelConfirmation = () => {
    setShowConfirmation(false)
    setReservation(null)

    // Resume scanner if in camera tab
    if (activeTab === "camera" && scannerRef.current) {
      try {
        scannerRef.current.resume()
      } catch (error) {
        console.error("Error resuming scanner:", error)
        // If resume fails, reinitialize
        initializeScanner()
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreviewUrl(dataUrl)

      // For now, we'll just show the image and ask the user to enter the code manually
      setActiveTab("manual")
      setError("Por favor, ingresa manualmente el código QR que aparece en la imagen")
    }
    reader.readAsDataURL(file)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)

    // Clear file selection when changing tabs
    if (value !== "upload") {
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Escáner de Códigos QR</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Verificar Reservación</CardTitle>
          <CardDescription>Escanea el código QR de la reservación para verificar su validez</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="camera">
                <Camera className="mr-2 h-4 w-4" />
                Cámara
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              <div className="flex flex-col items-center">
                <div id="qr-reader" className="w-full max-w-sm"></div>
                {loading && (
                  <div className="flex items-center justify-center mt-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Verificando código QR...</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full max-w-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="QR Code Preview"
                      className="max-h-48 object-contain mb-4"
                    />
                  ) : (
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : "Haz clic para subir una imagen de código QR"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Procesando imagen...</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleManualVerify} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="qr-code" className="text-sm font-medium">
                    Código QR
                  </label>
                  <Input
                    id="qr-code"
                    placeholder="Ingresa el código QR manualmente"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading || !manualCode.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reservación</DialogTitle>
            <DialogDescription>Verifica los detalles de la reservación antes de confirmar</DialogDescription>
          </DialogHeader>

          {reservation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Cliente:</div>
                <div className="text-sm">{reservation.user?.name || "Usuario"}</div>

                <div className="text-sm font-medium">Ubicación:</div>
                <div className="text-sm">{reservation.parkingSpot?.location?.name || "N/A"}</div>

                <div className="text-sm font-medium">Lugar:</div>
                <div className="text-sm">{reservation.parkingSpot?.spotNumber || "N/A"}</div>

                <div className="text-sm font-medium">Inicio:</div>
                <div className="text-sm">{format(new Date(reservation.startTime), "PPP HH:mm", { locale: es })}</div>

                <div className="text-sm font-medium">Fin:</div>
                <div className="text-sm">{format(new Date(reservation.endTime), "PPP HH:mm", { locale: es })}</div>

                <div className="text-sm font-medium">Estado:</div>
                <div className="text-sm">{reservation.status}</div>

                <div className="text-sm font-medium">Precio:</div>
                <div className="text-sm">${reservation.price?.toFixed(2) || "N/A"}</div>
              </div>

              {confirmError && (
                <Alert variant="destructive">
                  <AlertDescription>{confirmError}</AlertDescription>
                </Alert>
              )}

              {confirmSuccess && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <Check className="h-4 w-4 mr-2" />
                  <AlertDescription>Reservación confirmada exitosamente</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelConfirmation} disabled={confirmLoading || confirmSuccess}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={confirmReservation} disabled={confirmLoading || confirmSuccess}>
              {confirmLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

