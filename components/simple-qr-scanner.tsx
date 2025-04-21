"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Camera, StopCircle } from "lucide-react"
import jsQR from "jsqr"

interface WebcamQRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export default function WebcamQRScanner({ onScan, onError }: WebcamQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const webcamRef = useRef<Webcam>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const startScanning = useCallback(() => {
    setIsScanning(true)
    setPermissionDenied(false)
    setDebugInfo("Starting scanner...")

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Set up interval to scan for QR codes
    scanIntervalRef.current = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot()
        if (imageSrc) {
          // Convert base64 to image data for jsQR
          const image = new Image()
          image.src = imageSrc
          image.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = image.width
            canvas.height = image.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(image, 0, 0)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

              // Scan for QR code
              const code = jsQR(imageData.data, imageData.width, imageData.height)
              if (code) {
                // Found a QR code
                setDebugInfo(`QR code found: ${code.data}`)
                stopScanning()
                onScan(code.data)
              }
            }
          }
        }
      }
    }, 500) // Scan every 500ms
  }, [onScan])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setDebugInfo("Scanner stopped")
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }, [])

  // Handle permission errors
  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      console.error("Webcam error:", error)
      stopScanning()
      setPermissionDenied(true)
      setDebugInfo(`Camera error: ${error instanceof DOMException ? error.message : error}`)
      if (onError) {
        if (error instanceof DOMException) {
          onError(`Error de cámara: ${error.message}`)
        } else {
          onError(`Error de cámara: ${error}`)
        }
      }
    },
    [onError, stopScanning],
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm mb-4 overflow-hidden rounded-lg border-2 border-gray-300">
        {isScanning ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
              width: 300,
              height: 300,
            }}
            onUserMediaError={handleUserMediaError}
            className="w-full h-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-[300px] bg-gray-100">
            <Camera className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {isScanning && (
          <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none"></div>
        )}
      </div>

      {permissionDenied ? (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          Permiso de cámara denegado. Por favor, permita el acceso a la cámara en la configuración de su navegador.
        </div>
      ) : (
        <div>
          {!isScanning ? (
            <Button onClick={startScanning} className="bg-blue-600 hover:bg-blue-700">
              <Camera className="mr-2 h-4 w-4" />
              Iniciar Escaneo
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              Detener Escaneo
            </Button>
          )}
        </div>
      )}

      {/* Debug information */}
      {debugInfo && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-20 w-full">
          <pre className="text-gray-500">{debugInfo}</pre>
        </div>
      )}
    </div>
  )
}
