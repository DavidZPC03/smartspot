export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+\d{1,4}\s?\d{6,14}$/
  return phoneRegex.test(phone)
}

export function isValidLicensePlate(plate: string): boolean {
  const plateRegex = /^[a-zA-Z0-9-]{2,10}$/
  return plateRegex.test(plate)
}

export function isValidReservationTime(startTime: Date, endTime: Date): boolean {
  const now = new Date()
  const maxFutureDate = new Date()
  maxFutureDate.setDate(now.getDate() + 30) // No más de 30 días en el futuro

  if (startTime >= endTime) {
    return false
  }

  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  if (durationHours > 24) {
    return false
  }

  if (startTime < now || endTime < now) {
    return false
  }

  if (startTime > maxFutureDate || endTime > maxFutureDate) {
    return false
  }

  return true
}

export function isValidLocationName(name: string): boolean {
  return name.length >= 3 && name.length <= 100
}

export function isValidAddress(address: string): boolean {
  return address.length >= 5 && address.length <= 200
}

export function isValidTotalSpots(totalSpots: number | string): boolean {
  const num = typeof totalSpots === "string" ? Number(totalSpots) : totalSpots
  return !isNaN(num) && num > 0 && num < 1000
}

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 100
}

export function isValidPrice(price: number | string): boolean {
  const num = typeof price === "string" ? Number(price) : price
  return !isNaN(num) && num >= 0 && num < 10000
}
