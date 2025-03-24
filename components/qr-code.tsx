interface SimpleQRCodeProps {
  value: string
  size?: number
  className?: string
}

export default function SimpleQRCode({ value, size = 200, className = "" }: SimpleQRCodeProps) {
  // Crear un hash simple del valor para generar un patrón determinista
  const hash = value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Crear una matriz de 25x25 para el patrón del QR
  const cells = Array(25)
    .fill(0)
    .map((_, i) =>
      Array(25)
        .fill(0)
        .map((_, j) => {
          // Siempre dibujar los patrones de posición en las esquinas
          if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) {
            // Borde exterior de los patrones de posición
            if (
              i === 0 ||
              i === 6 ||
              j === 0 ||
              j === 6 ||
              (i === 0 && j < 7) ||
              (i === 6 && j < 7) ||
              (j === 0 && i < 7) ||
              (j === 6 && i < 7) ||
              (i === 0 && j > 17) ||
              (i === 6 && j > 17) ||
              (j === 18 && i < 7) ||
              (j === 24 && i < 7) ||
              (i === 18 && j < 7) ||
              (i === 24 && j < 7) ||
              (j === 0 && i > 17) ||
              (j === 6 && i > 17)
            ) {
              return 1
            }
            // Patrón interior de los patrones de posición
            if (i >= 2 && i <= 4 && j >= 2 && j <= 4) return 1
            if (i >= 2 && i <= 4 && j >= 20 && j <= 22) return 1
            if (i >= 20 && i <= 22 && j >= 2 && j <= 4) return 1
            return 0
          }

          // Generar un patrón determinista basado en el hash del valor
          return (i * j + hash) % 5 === 0 ? 1 : 0
        }),
    )

  const cellSize = size / 25

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} title={value}>
      <div className="absolute inset-0 bg-white">
        {cells.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={cell ? "bg-black" : "bg-white"}
                style={{ width: cellSize, height: cellSize }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

