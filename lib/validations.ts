// Validación de correo electrónico
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar formato de teléfono
export function isValidPhone(phone: string): boolean {
  // Acepta formatos como +521234567890, +52 123 456 7890, etc.
  const phoneRegex = /^\+\d{1,4}\s?\d{6,14}$/
  return phoneRegex.test(phone)
}

// Validar formato de placa
export function isValidLicensePlate(plate: string): boolean {
  // Acepta placas de 2 a 10 caracteres, con letras, números y guiones
  const plateRegex = /^[a-zA-Z0-9-]{2,10}$/
  return plateRegex.test(plate)
}

// Validar tiempo de reservación
export function isValidReservationTime(startTime: Date, endTime: Date): boolean {
  const now = new Date()
  const maxFutureDate = new Date()
  maxFutureDate.setDate(now.getDate() + 30) // No más de 30 días en el futuro

  const durationMs = endTime.getTime() - startTime.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  return (
    startTime < endTime && // La fecha de inicio debe ser anterior a la fecha de fin
    durationHours <= 24 && // La duración máxima es de 24 horas
    startTime >= now && // No se puede reservar en el pasado
    startTime <= maxFutureDate // No se puede reservar más de 30 días en el futuro
  )
}

// Validar nombre de ubicación
export function isValidLocationName(name: string): boolean {
  return name.trim().length >= 3 && name.trim().length <= 100
}

// Validar dirección
export function isValidAddress(address: string): boolean {
  return address.trim().length >= 5 && address.trim().length <= 200
}

// Validar número de lugares
export function isValidTotalSpots(totalSpots: number): boolean {
  return totalSpots > 0 && totalSpots < 1000
}

// Validar nombre
export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100
}

// Validar precio
export function isValidPrice(price: number): boolean {
  return price >= 0 && price < 10000
}

// Validar contraseña