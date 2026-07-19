'use client'

import { useEffect, useState } from 'react'
import ColorThief from 'color-thief-ts'

export function useAvatarGradient(imageUrl?: string) {
  const [gradient, setGradient] = useState(
    'linear-gradient(180deg, #050505, #0a0a0a)'
  )

  useEffect(() => {
    if (!imageUrl) return

    let cancelled = false

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    img.onload = () => {
      if (cancelled) return

      try {
        const colorThief = new ColorThief()
        const [r, g, b] = colorThief.getColor(img)

        const c1 = `rgba(${r}, ${g}, ${b}, 0.35)`
        const c2 = `rgba(${Math.max(r - 40, 0)}, ${Math.max(
          g - 40,
          0
        )}, ${Math.max(b - 40, 0)}, 0.15)`

        setGradient(
          `
          radial-gradient(1000px at top left, ${c1}, transparent),
          radial-gradient(800px at bottom right, ${c2}, transparent),
          linear-gradient(180deg, #050505, #0a0a0a)
          `
        )
      } catch {
        // silently fallback
      }
    }

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return gradient
}
