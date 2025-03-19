"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"

interface QRCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  logoUrl?: string
  logoSize?: number
}

export default function QRCode({
  value,
  size = 200,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  logoUrl,
  logoSize = 50,
}: QRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: value,
        dotsOptions: {
          color: fgColor,
          type: "rounded",
        },
        backgroundOptions: {
          color: bgColor,
        },
        cornersSquareOptions: {
          type: "extra-rounded",
        },
        cornersDotOptions: {
          type: "dot",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 5,
        },
      })
    }

    if (qrRef.current && qrCode.current) {
      qrRef.current.innerHTML = ""
      qrCode.current.append(qrRef.current)
    }
  }, [value, size, bgColor, fgColor, logoUrl, logoSize])

  return <div ref={qrRef} />
}

