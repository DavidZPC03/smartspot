import QRCode from "qrcode"
import { createHash } from "crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function generateQRCode(reservationId: string): Promise<string> {
  // Create a unique code for the reservation
  const uniqueCode = createHash("sha256")
    .update(`${reservationId}-${Date.now()}-${process.env.QR_SECRET}`)
    .digest("hex")
    .substring(0, 12)
    .toUpperCase()

  // Create QR code data
  const qrData = JSON.stringify({
    code: uniqueCode,
    reservationId,
    timestamp: Date.now(),
  })

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(qrData)

  // In a real app, you might want to store this in a database or file storage
  // For this example, we'll just return the unique code
  return uniqueCode
}

export async function verifyQRCode(code: string, reservationId: string): Promise<boolean> {
  // In a real app, you would verify this against stored data
  // For this example, we'll just check if the code is associated with the reservation

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    })

    if (!reservation) {
      return false
    }

    return reservation.qrCode === code
  } catch (error) {
    console.error("Error verifying QR code:", error)
    return false
  }
}

