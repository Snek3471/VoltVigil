"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"

interface SensorMarker {
  id: string
  location: [number, number]
  peakFrequency: number
  severity: string
  nodeId: string
}

interface TeleGridGlobeProps {
  sensors?: SensorMarker[]
  className?: string
  speed?: number
}

export const defaultSensors: SensorMarker[] = [
  { id: "sensor-01", location: [38.90, -77.03],  peakFrequency: 847,  severity: "high",     nodeId: "sensor-01" },
  { id: "sensor-02", location: [40.71, -74.00],  peakFrequency: 312,  severity: "low",      nodeId: "sensor-02" },
  { id: "sensor-03", location: [34.05, -118.24], peakFrequency: 1850, severity: "critical",  nodeId: "sensor-03" },
  { id: "sensor-04", location: [41.87, -87.62],  peakFrequency: 640,  severity: "medium",   nodeId: "sensor-04" },
  { id: "sensor-05", location: [29.76, -95.36],  peakFrequency: 278,  severity: "low",      nodeId: "sensor-05" },
  { id: "sensor-06", location: [33.44, -112.07], peakFrequency: 920,  severity: "high",     nodeId: "sensor-06" },
  { id: "sensor-07", location: [47.60, -122.33], peakFrequency: 510,  severity: "medium",   nodeId: "sensor-07" },
  { id: "sensor-08", location: [25.76, -80.19],  peakFrequency: 1760, severity: "critical",  nodeId: "sensor-08" },
  { id: "sensor-09", location: [39.95, -75.16],  peakFrequency: 190,  severity: "low",      nodeId: "sensor-09" },
  { id: "sensor-10", location: [32.77, -96.79],  peakFrequency: 1100, severity: "high",     nodeId: "sensor-10" },
  { id: "sensor-11", location: [37.77, -122.41], peakFrequency: 430,  severity: "medium",   nodeId: "sensor-11" },
  { id: "sensor-12", location: [42.36, -71.05],  peakFrequency: 220,  severity: "low",      nodeId: "sensor-12" },
]

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border border-red-500/30",
  high:     "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  medium:   "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  low:      "bg-green-500/20 text-green-300 border border-green-500/30",
}

const MARKER_SIZE: Record<string, number> = {
  critical: 0.09,
  high:     0.07,
  medium:   0.055,
  low:      0.04,
}

export function TeleGridGlobe({
  sensors = defaultSensors,
  className = "",
  speed = 0.003,
}: TeleGridGlobeProps) {
  const canvasRef             = useRef<HTMLCanvasElement>(null)
  const pointerInteracting    = useRef<{ x: number; y: number } | null>(null)
  const dragOffset            = useRef({ phi: 0, theta: 0 })
  const phiAccumRef           = useRef(0)
  const thetaAccumRef         = useRef(0)
  const isPausedRef           = useRef(false)
  const globeRef              = useRef<ReturnType<typeof createGlobe> | null>(null)
  const phiLiveRef            = useRef(0.5)
  const [activeSensor, setActiveSensor] = useState<SensorMarker | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current) {
      phiAccumRef.current   += dragOffset.current.phi
      thetaAccumRef.current += dragOffset.current.theta
      dragOffset.current     = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointerInteracting.current) return
      dragOffset.current = {
        phi:   (e.clientX - pointerInteracting.current.x) / 250,
        theta: (e.clientY - pointerInteracting.current.y) / 800,
      }
    }
    window.addEventListener("pointermove", onMove,    { passive: true })
    window.addEventListener("pointerup",   handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup",   handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animId = 0
    let resizeObserver: ResizeObserver | null = null

    function init() {
      const w = canvas.offsetWidth
      if (w === 0 || globeRef.current) return

      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width:            w,
        height:           w,
        phi:              0.5,
        theta:            0.25,
        dark:             1,
        diffuse:          1.4,
        mapSamples:       24000,
        mapBrightness:    5.5,
        baseColor:        [0.08, 0.15, 0.35],
        markerColor:      [0.25, 0.55, 1.0],
        glowColor:        [0.15, 0.3, 0.7],
        markers: sensors.map((s) => ({
          location: s.location,
          size:     MARKER_SIZE[s.severity] ?? MARKER_SIZE.low,
        })),
        onRender: () => {},
      })

      function tick() {
        if (!isPausedRef.current) phiLiveRef.current += speed
        globeRef.current?.update({
          phi:   phiLiveRef.current + phiAccumRef.current   + dragOffset.current.phi,
          theta: 0.25               + thetaAccumRef.current + dragOffset.current.theta,
        })
        animId = requestAnimationFrame(tick)
      }
      tick()
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1"
      })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver?.disconnect()
          resizeObserver = null
          init()
        }
      })
      resizeObserver.observe(canvas)
    }

    return () => {
      resizeObserver?.disconnect()
      cancelAnimationFrame(animId)
      globeRef.current?.destroy()
      globeRef.current = null
    }
  }, [sensors, speed])

  return (
    <div className={`relative select-none ${className}`}>

      {/* Globe canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width:       "100%",
          height:      "100%",
          cursor:      "grab",
          opacity:     0,
          transition:  "opacity 1.4s ease",
          touchAction: "none",
          display:     "block",
        }}
      />

      {/* Hover tooltip */}
      {activeSensor && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                     bg-[#0f172a]/95 border border-[#334155] rounded-xl
                     px-4 py-3 pointer-events-none backdrop-blur-sm
                     min-w-[160px] text-center z-50"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
          <p className="text-[#f8fafc] font-mono font-bold text-sm mb-1">
            {activeSensor.nodeId}
          </p>
          <p
            className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2 ${
              SEVERITY_BADGE[activeSensor.severity] ?? SEVERITY_BADGE.low
            }`}
          >
            {activeSensor.severity}
          </p>
          <p className="text-[#94a3b8] font-mono text-xs">
            {activeSensor.peakFrequency} Hz
          </p>
          <p className="text-[#475569] font-mono text-xs mt-1">
            {activeSensor.location[0].toFixed(2)}°N,{" "}
            {Math.abs(activeSensor.location[1]).toFixed(2)}°W
          </p>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#0f172a]/95 border-r border-b border-[#334155] rotate-45" />
        </div>
      )}

    </div>
  )
}
