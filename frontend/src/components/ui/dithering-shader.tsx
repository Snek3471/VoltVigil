"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface DitheringShaderProps {
  shape?:      "swirl" | "radial" | "linear"
  type?:       "2x2" | "4x4" | "8x8"
  colorBack?:  string
  colorFront?: string
  pxSize?:     number
  speed?:      number
  width?:      number
  height?:     number
  style?:      React.CSSProperties
  className?:  string
}

function hexToVec3(hex: string): [number, number, number] {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b]
}

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;
  uniform vec2  resolution;
  uniform float time;
  uniform float pxSize;
  uniform float speed;
  uniform vec3  colorFront;
  uniform vec3  colorBack;

  // 4x4 Bayer ordered dithering matrix (GLSL ES 2.0 compatible)
  float bayer4(vec2 pos) {
    float x = mod(floor(pos.x), 4.0);
    float y = mod(floor(pos.y), 4.0);
    float v = 0.0;
    if      (y < 0.5) { v = (x < 0.5) ? 0.0 : (x < 1.5) ? 8.0 : (x < 2.5) ? 2.0 : 10.0; }
    else if (y < 1.5) { v = (x < 0.5) ? 12.0: (x < 1.5) ? 4.0 : (x < 2.5) ? 14.0: 6.0;  }
    else if (y < 2.5) { v = (x < 0.5) ? 3.0 : (x < 1.5) ? 11.0: (x < 2.5) ? 1.0 : 9.0;  }
    else              { v = (x < 0.5) ? 15.0: (x < 1.5) ? 7.0 : (x < 2.5) ? 13.0: 5.0;  }
    return v / 16.0;
  }

  // Swirl noise
  float swirl(vec2 uv, float t) {
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float v  = sin(a * 2.0 + r * 3.5 - t * speed * 1.5) * 0.5 + 0.5;
    v       += sin(r * 4.5 - t * speed * 0.9 + a * 1.5) * 0.18;
    v       += sin(uv.x * 1.8 + uv.y * 1.2 + t * speed * 0.4) * 0.08;
    return clamp(v, 0.0, 1.0);
  }

  void main() {
    vec2 pixelGrid = gl_FragCoord.xy / pxSize;
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

    float value     = swirl(uv, time);
    float threshold = bayer4(pixelGrid);

    vec3 color = (value > threshold) ? colorFront : colorBack;
    gl_FragColor = vec4(color, 1.0);
  }
`

export function DitheringShader({
  colorBack  = "#000820",
  colorFront = "#0066ff",
  pxSize     = 4,
  speed      = 0.5,
  width      = 1920,
  height     = 1080,
  style,
  className  = "",
}: DitheringShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<{
    renderer:    THREE.WebGLRenderer
    animationId: number
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const [fr, fg, fb] = hexToVec3(colorFront)
    const [br, bg, bb] = hexToVec3(colorBack)

    const camera   = new THREE.Camera()
    camera.position.z = 1
    const scene    = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      resolution:  { value: new THREE.Vector2() },
      time:        { value: 0.0 },
      pxSize:      { value: pxSize },
      speed:       { value: speed },
      colorFront:  { value: new THREE.Vector3(fr, fg, fb) },
      colorBack:   { value: new THREE.Vector3(br, bg, bb) },
    }

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    const mesh     = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(1) // don't need high-DPI for a dither shader
    container.appendChild(renderer.domElement)

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height)
    }
    onResize()
    window.addEventListener("resize", onResize, false)

    const animate = () => {
      const id = requestAnimationFrame(animate)
      uniforms.time.value += 0.016
      renderer.render(scene, camera)
      if (sceneRef.current) sceneRef.current.animationId = id
    }
    sceneRef.current = { renderer, animationId: 0 }
    animate()

    return () => {
      window.removeEventListener("resize", onResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
        renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
      sceneRef.current = null
    }
  // Re-mount when colors or sizing change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorFront, colorBack, pxSize, speed])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}
    />
  )
}
