import { useEffect, useRef } from 'react'

export default function GlobalThermalCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false })
  const gridRef = useRef<Float32Array | null>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const RESOLUTION = 14
    const COOLING = 0.984
    let cols = 0
    let rows = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.ceil(window.innerWidth / RESOLUTION)
      rows = Math.ceil(window.innerHeight / RESOLUTION)
      gridRef.current = new Float32Array(cols * rows).fill(0)
    }

    const getColor = (t: number) => {
      // Bright electric: dark blue → cyan → white
      const r = Math.min(255, Math.max(0, (t * 3 - 1.8) * 255))
      const g = Math.min(255, Math.max(0, (t * 2.8 - 0.6) * 255))
      const b = Math.min(255, Math.max(0, t * 255))
      return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }

    const onMouseLeave = () => {
      mouseRef.current.active = false
    }

    const loop = () => {
      const grid = gridRef.current
      if (!grid || !ctx) { animRef.current = requestAnimationFrame(loop); return }

      const mouse = mouseRef.current

      // Inject heat along mouse path
      if (mouse.active) {
        const dx = mouse.x - mouse.prevX
        const dy = mouse.y - mouse.prevY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const steps = Math.max(1, Math.ceil(dist / (RESOLUTION / 2)))

        for (let s = 0; s <= steps; s++) {
          const t = steps > 0 ? s / steps : 0
          const mx = mouse.prevX + dx * t
          const my = mouse.prevY + dy * t
          const col = Math.floor(mx / RESOLUTION)
          const row = Math.floor(my / RESOLUTION)
          const RADIUS = 1

          for (let i = -RADIUS; i <= RADIUS; i++) {
            for (let j = -RADIUS; j <= RADIUS; j++) {
              const c = col + i
              const r = row + j
              if (c >= 0 && c < cols && r >= 0 && r < rows) {
                const d = Math.sqrt(i * i + j * j)
                if (d <= RADIUS) {
                  const idx = c + r * cols
                  grid[idx] = Math.min(1.0, grid[idx] + 0.6 * (1 - d / RADIUS))
                }
              }
            }
          }
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and cool
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = c + r * cols
          const temp = grid[idx]
          grid[idx] *= COOLING

          if (temp > 0.04) {
            const x = c * RESOLUTION
            const y = r * RESOLUTION
            const size = RESOLUTION * (0.35 + temp * 0.35)
            const offset = (RESOLUTION - size) / 2

            ctx.globalAlpha = Math.min(1, temp * 1.5)
            ctx.fillStyle = getColor(temp)
            ctx.fillRect(x + offset, y + offset, size, size)
          }
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    animRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
      }}
    />
  )
}
