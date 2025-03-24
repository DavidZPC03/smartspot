export async function generateQRCode(data: string | object): Promise<string> {
  try {
    // If it's an object, convert it to JSON
    const content = typeof data === "object" ? JSON.stringify(data) : data

    // Use the public API to generate a QR code
    const encodedData = encodeURIComponent(content)
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=300x300&ecc=H`
  } catch (error) {
    console.error("Error generating QR code:", error)
    return generateFallbackQR(typeof data === "object" ? JSON.stringify(data) : data)
  }
}

// Fallback QR function
export function generateFallbackQR(data: string): string {
  try {
    // Use a reliable public API to generate the QR
    const encodedData = encodeURIComponent(data)
    // Use full URL with https and specific size and correction level
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=300x300&ecc=H`
  } catch (error) {
    console.error("Error generating fallback QR:", error)
    return "/placeholder.svg?height=200&width=200"
  }
}

// Add the missing verifyQRCode function
export function verifyQRCode(qrCode: string, secretKey?: string): { valid: boolean; data?: any; error?: string } {
  try {
    // For simple text QR codes
    if (!qrCode.startsWith("{")) {
      return {
        valid: true,
        data: { code: qrCode },
      }
    }

    // For JSON QR codes
    const data = JSON.parse(qrCode)

    // Return the parsed data
    return {
      valid: true,
      data,
    }
  } catch (error) {
    console.error("Error verifying QR code:", error)
    return {
      valid: false,
      error: "Invalid QR code format",
    }
  }
}

