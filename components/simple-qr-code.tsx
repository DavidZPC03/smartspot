interface SimpleQRCodeProps {
    size?: number
    value?: string
    className?: string
  }
  
  export default function SimpleQRCode({ size = 200, value = "smartspot-parking", className = "" }: SimpleQRCodeProps) {
    // Generate a deterministic pattern based on the value string
    const generatePattern = (value: string) => {
      // Create a simple hash of the string
      const hash = Array.from(value).reduce((acc, char) => {
        return acc + char.charCodeAt(0)
      }, 0)
  
      // Use the hash to determine which cells are filled
      const pattern = []
      for (let i = 0; i < 25; i++) {
        pattern[i] = []
        for (let j = 0; j < 25; j++) {
          // Create a deterministic pattern based on position and hash
          // Fixed pattern for position detection (corners)
          if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) {
            if (
              (i > 1 && i < 5 && j > 1 && j < 5) ||
              (i > 1 && i < 5 && j > 19 && j < 23) ||
              (i > 19 && i < 23 && j > 1 && j < 5)
            ) {
              pattern[i][j] = 1 // Inner square
            } else if (i === 0 || i === 6 || i === 18 || i === 24 || j === 0 || j === 6 || j === 18 || j === 24) {
              pattern[i][j] = 1 // Outer border
            } else {
              pattern[i][j] = 0 // White space
            }
          } else {
            // Data area - create a pattern based on the hash
            pattern[i][j] = (i * j + hash) % 5 === 0 ? 1 : 0
          }
        }
      }
      return pattern
    }
  
    const pattern = generatePattern(value)
    const cellSize = size / 25
  
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ width: size, height: size, backgroundColor: "white" }}
      >
        {pattern.map((row, i) =>
          row.map((cell, j) =>
            cell ? (
              <div
                key={`${i}-${j}`}
                style={{
                  position: "absolute",
                  top: i * cellSize,
                  left: j * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: "black",
                }}
              />
            ) : null,
          ),
        )}
      </div>
    )
  }
  
  