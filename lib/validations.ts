// Validación de correo electrónico
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 100
  }
  
  // Validación de número de teléfono
  export function isValidPhone(phone: string): boolean {
    // Permite formatos internacionales, con o sin espacios/guiones
    const phoneRegex = /^\+?[0-9]{8,15}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ""))
  }
  
  // Validación de placa de vehículo
  export function isValidLicensePlate(plate: string): boolean {
    // Permite letras, números, guiones y espacios, longitud entre 2 y 10 caracteres
    const plateRegex = /^[A-Za-z0-9\s-]{2,10}$/
    return plateRegex.test(plate)
  }
  
  // Validación de nombre
  export function isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 100
  }
  
  // Validación de precio
  export function isValidPrice(price: number | string): boolean {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 10000
  }
  
  // Validación de fechas de reserva
  export function isValidReservationTime(startTime: Date, endTime: Date): boolean {
    // La fecha de inicio debe ser anterior a la fecha de fin
    if (startTime >= endTime) return false
  
    // La duración máxima de una reserva es de 24 horas
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    if (durationHours > 24) return false
  
    // La fecha de inicio no puede ser más de 30 días en el futuro
    const now = new Date()
    const thirtyDaysFromNow = new Date(now)
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    if (startTime > thirtyDaysFromNow) return false
  
    return true
  }
  
  // Validación de dirección
  export function isValidAddress(address: string): boolean {
    return address.trim().length >= 5 && address.trim().length <= 200
  }
  
  // Validación de nombre de ubicación
  export function isValidLocationName(name: string): boolean {
    return name.trim().length >= 3 && name.trim().length <= 100
  }
  
  // Validación de número de lugares de estacionamiento
  export function isValidTotalSpots(spots: number | string): boolean {
    const numSpots = typeof spots === "string" ? Number.parseInt(spots) : spots
    return !isNaN(numSpots) && numSpots > 0 && numSpots <= 1000
  }
  
  