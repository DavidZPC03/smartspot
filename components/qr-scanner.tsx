"use client"

import { useState, useRef, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QrCode, Camera, StopCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  width?: number
  height?: number
}

export default function QRScanner({ onScan, onError, width = 300, height = 300 }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader-container"

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        try {
          scannerRef.current.stop().catch((error) => {
            console.error("Error stopping scanner:", error)
          })
        } catch (error) {
          console.error("Error in cleanup:", error)
        }
      }
    }
  }, [scanning])

  const startScanner = async () => {
    try {
      // Create scanner instance if it doesn't exist
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId)
      }

      setScanning(true)
      setPermissionDenied(false)

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Stop scanning after successful scan
        if (scannerRef.current) {
          try {
            scannerRef.current.stop().catch((error) => {
              console.error("Error stopping scanner after successful scan:", error)
            })
          } catch (error) {
            console.error("Error stopping scanner:", error)
          }
        }

        setScanning(false)
        onScan(decodedText)
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }

      // Start scanning
      await scannerRef.current.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {
        // This is just for QR code scanning errors, not for device setup errors
        console.log(errorMessage)
      })
    } catch (err) {
      console.error("Error starting scanner:", err)

      // Check if error is permission related
      const error = err as Error
      if (error.message && error.message.includes("Permission")) {
        setPermissionDenied(true)
        if (onError) onError("Permiso de cámara denegado. Por favor, permita el acceso a la cámara.")
      } else {
        if (onError) onError(`Error al iniciar el escáner: ${error.message}`)
      }

      setScanning(false)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => {
            setScanning(false)
          })
          .catch((error) => {
            console.error("Error stopping scanner:", error)
            if (onError) onError(`Error al detener el escáner: ${error.message}`)
          })
      } catch (error) {
        console.error("Error stopping scanner:", error)
        setScanning(false)
      }
    } else {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        id={scannerContainerId}
        style={{ width, height }}
        className={`overflow-hidden rounded-lg border-2 ${scanning ? "border-green-500" : "border-gray-300"} bg-black mb-4`}
      >
        {!scanning && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <QrCode className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {permissionDenied ? (
        <Card className="p-4 bg-red-50 border-red-200 text-red-700 mb-4">
          <p>
            Permiso de cámara denegado. Por favor, permita el acceso a la cámara en la configuración de su navegador.
          </p>
        </Card>
      ) : (
        <div className="flex gap-2">
          {!scanning ? (
            <Button onClick={startScanner} className="bg-blue-600 hover:bg-blue-700">
              <Camera className="mr-2 h-4 w-4" />
              Iniciar Escaneo
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              Detener Escaneo
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

