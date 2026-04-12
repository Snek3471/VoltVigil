"use client"

import { useEffect, useRef } from "react"

interface ThermodynamicGridProps {
  resolution?: number
  coolingFactor?: number
  className?: string
  style?: React.CSSProperties
}

export default function ThermodynamicGrid({
  resolution = 24,
  coolingFactor = 0.97,
  className = "",
  style,
}: ThermodynamicGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let cols = 0
    let rows = 0
    let cellW = 0
    let cellH = 0
    let grid: Float32Array
    let animId: number

    const mouse = { x: -1, y: -1, active: false }

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      cols  = Math.ceil(canvas.width  / resolution) + 1
      rows  = Math.ceil(canvas.height / resolution) + 1
      cellW = canvas.width  / (cols - 1)
      cellH = canvas.height / (rows - 1)
      grid  = new Float32Array(cols * rows)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
    }

    // Attach to window so events fire even when container has pointer-events:none
    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    window.addEventListener("resize", resize)
    resize()

    // Heat colour — bright electric blue → cyan → white
    const heatColor = (t: number): [number, number, number] => {
      t = Math.max(0, Math.min(1, t))
      const r = Math.min(255, Math.max(0, Math.round((t * 3 - 1.5) * 255)))
      const g = Math.min(255, Math.max(0, Math.round((t * 2.5 - 0.5) * 255)))
      const b = Math.min(255, Math.max(0, Math.round(t * 1.8 * 255)))
      return [r, g, b]
    }

    const draw = () => {
      // Add heat at mouse position
      if (mouse.active) {
        const gc = mouse.x / cellW
        const gr = mouse.y / cellH
        const radius = 1.5
        const r0 = Math.max(0, Math.floor(gr - radius))
        const r1 = Math.min(rows - 1, Math.ceil(gr + radius))
        const c0 = Math.max(0, Math.floor(gc - radius))
        const c1 = Math.min(cols - 1, Math.ceil(gc + radius))
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const dr = r - gr
            const dc = c - gc
            const dist = Math.sqrt(dr * dr + dc * dc)
            if (dist < radius) {
              const heat = 0.5 * (1 - dist / radius)
              grid[r * cols + c] = Math.min(1, grid[r * cols + c] + heat)
            }
          }
        }
      }

      // Diffuse + cool
      const next = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const top    = r > 0        ? grid[(r - 1) * cols + c] : 0
          const bottom = r < rows - 1 ? grid[(r + 1) * cols + c] : 0
          const left   = c > 0        ? grid[r * cols + c - 1]   : 0
          const right  = c < cols - 1 ? grid[r * cols + c + 1]   : 0
          const self   = grid[r * cols + c]
          next[r * cols + c] = coolingFactor * (self * 0.5 + (top + bottom + left + right) * 0.125)
        }
      }
      grid = next

      // Render cells
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v = grid[r * cols + c]
          if (v < 0.01) continue
          const [red, green, blue] = heatColor(v)
          ctx.fillStyle = `rgba(${red},${green},${blue},${Math.min(v * 1.2, 0.85)})`
          ctx.fillRect(
            Math.round(c * cellW),
            Math.round(r * cellH),
            Math.ceil(cellW) + 1,
            Math.ceil(cellH) + 1,
          )
        }
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("resize", resize)
    }
  }, [resolution, coolingFactor])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  )
}
