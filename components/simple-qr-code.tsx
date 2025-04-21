"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface SimpleQRCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: "L" | "M" | "Q" | "H"
  includeMargin?: boolean
  className?: string
}

export function SimpleQRCode({
  value,
  size = 200,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "M",
  includeMargin = true,
  className = "",
}: SimpleQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: includeMargin ? 4 : 0,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: level,
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error)
        },
      )
    }
  }, [value, size, bgColor, fgColor, level, includeMargin])

  return <canvas ref={canvasRef} className={className} width={size} height={size} />
}
