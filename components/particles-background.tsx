"use client"

import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Particles from "react-particles"
import { loadSlim } from "tsparticles-slim"
import type { Container, Engine } from "tsparticles-engine"

interface ParticlesBackgroundProps {
  id?: string
  className?: string
  color?: string
}

export default function ParticlesBackground({ id = "tsparticles", className = "", color }: ParticlesBackgroundProps) {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // Optional: do something when particles are loaded
  }, [])

  if (!mounted) return null

  // Default colors based on theme
  const defaultColor = theme === "dark" ? "#3b82f6" : "#3b82f6"
  const particleColor = color || defaultColor

  return (
    <Particles
      id={id}
      className={`fixed inset-0 -z-10 ${className}`}
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        particles: {
          color: {
            value: particleColor,
          },
          links: {
            color: particleColor,
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: 0.3,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}

