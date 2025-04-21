"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import { Loader2, Upload, Camera, Check, X, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import WebcamQRScanner from "@/components/webcam-qr-scanner"

export default function QRScannerPage() {
  const [activeTab, setActiveTab] = useState("camera")
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reservation, setReservation] = useState<any | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const [confirmationComplete, setConfirmationComplete] = useState(false)

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
    setDebugInfo(`Processing QR code: ${qrCode}`)

    try {
      console.log("Processing QR code:", qrCode)

      // Verificar el QR usando la API
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        console.error("No admin token found")
        setDebugInfo("No admin token found")
        throw new Error("No estás autenticado como administrador")
      }

      setDebugInfo(`Admin token found: ${adminToken.substring(0, 10)}...`)
      console.log("Sending request to verify QR code")

      // Use the App Router API route
      const response = await fetch("/api/admin/verify-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qrCode }),
      })

      console.log("Response status:", response.status)
      setDebugInfo(`API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        setDebugInfo(`Error response: ${errorText.substring(0, 100)}...`)

        let errorMessage = "Error al verificar el código QR"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // If we can't parse the error as JSON, just use the text
          if (errorText && !errorText.includes("<!DOCTYPE html>")) {
            errorMessage = errorText
          }
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Response data:", result)
      setDebugInfo(`API response data: ${JSON.stringify(result).substring(0, 100)}...`)

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

      console.log("Confirming reservation:", reservation.id)

      // Actualizar el estado de la reservación en la base de datos
      const response = await fetch(`/api/admin/reservations/${reservation.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })

      console.log("Confirmation response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)

        let errorMessage = "Error al confirmar la reservación"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // If we can't parse the error as JSON, just use the text
          if (errorText && !errorText.includes("<!DOCTYPE html>")) {
            errorMessage = errorText
          }
        }

        throw new Error(errorMessage)
      }

      console.log("Reservation confirmed successfully")
      setConfirmSuccess(true)
      setConfirmationComplete(true)

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false)
        setReservation(null)
        setConfirmSuccess(false)

        // Reset manual code if in manual tab
        if (activeTab === "manual") {
          setManualCode("")
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
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError(null)
    setProcessingImage(true)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreviewUrl(dataUrl)
      setProcessingImage(false)

      // Extraer el nombre del archivo para buscar patrones de ID de pago
      const fileName = file.name || ""

      // Buscar patrones de ID de pago en el nombre del archivo
      const paymentIdMatch = fileName.match(/pi_[a-zA-Z0-9]{24,}/)
      if (paymentIdMatch) {
        const paymentId = paymentIdMatch[0]
        setDebugInfo(`Detected payment ID in filename: ${paymentId}`)
        setManualCode(paymentId)

        try {
          await processQRCode(paymentId)
        } catch (error) {
          console.error("Error processing payment ID from filename:", error)
          setError(
            "No se pudo procesar el ID de pago del nombre del archivo. Por favor, ingresa manualmente el código QR.",
          )
        }
      } else {
        setError(
          "No se pudo detectar un código QR en la imagen. Por favor, ingresa manualmente el código QR que aparece en la imagen.",
        )
      }
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

  const handleScan = async (data: string) => {
    if (data) {
      try {
        console.log("QR code scanned:", data)
        setDebugInfo(`QR code scanned: ${data}`)
        await processQRCode(data)
      } catch (error) {
        setError((error as Error).message)
      }
    }
  }

  const handleScanError = (error: string) => {
    console.error("QR scan error:", error)
    setError("Error al escanear: " + error)
    setDebugInfo(`Scan error: ${error}`)
  }

  return (
    <div className="container mx-auto py-4 md:py-6">
      <h1 className="text-2xl font-bold mb-4 md:mb-6">Escáner de Códigos QR</h1>

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
                <span className="hidden sm:inline">Cámara</span>
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Subir Imagen</span>
              </TabsTrigger>
              <TabsTrigger value="manual">
                <span className="hidden sm:inline">Manual</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              <div className="flex flex-col items-center">
                <WebcamQRScanner onScan={handleScan} onError={handleScanError} />
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 w-full max-w-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary"
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
                  <p className="text-sm text-gray-500 text-center">
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

                {processingImage && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Procesando imagen...</span>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Verificando código QR...</span>
                  </div>
                )}

                {error && previewUrl && (
                  <div className="w-full">
                    <p className="text-sm text-gray-700 mb-2">
                      Si no se pudo detectar automáticamente, ingresa el código manualmente:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Ingresa el código QR manualmente"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleManualVerify({ preventDefault: () => {} } as React.FormEvent)}
                        disabled={loading || !manualCode.trim()}
                      >
                        Verificar
                      </Button>
                    </div>
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

          {/* Debug information */}
          {debugInfo && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
              <p className="text-gray-500">Debug info:</p>
              <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="w-[95%] max-w-md mx-auto">
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

              {confirmationComplete && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => window.open(`/reservation-status/${reservation.id}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver estado de la reservación
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={cancelConfirmation}
              disabled={confirmLoading || confirmSuccess}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={confirmReservation}
              disabled={confirmLoading || confirmSuccess}
              className="w-full sm:w-auto"
            >
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
