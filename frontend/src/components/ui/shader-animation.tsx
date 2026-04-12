"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.018;
        float lineWidth = 0.003;
        vec3 color = vec3(0.0);

        for(int i = 0; i < 7; i++){
          float fi = float(i);

          // Purple/violet channel
          color.r += (lineWidth * 0.7) * float(i * i) / abs(
            fract(t - 0.009 * fi) * 6.0 - length(uv) + mod(uv.x + uv.y, 0.25)
          );
          // Blue channel
          color.b += lineWidth * float(i * i) / abs(
            fract(t + 0.007 * fi) * 5.5 - length(uv) + mod(uv.x - uv.y, 0.2)
          );
          // Cyan/white core
          color.g += (lineWidth * 0.4) * float(i) / abs(
            fract(t + 0.011 * fi) * 4.5 - length(uv) + mod(uv.x * uv.y, 0.18)
          );
        }

        // Electric purple boost
        color = pow(color, vec3(0.65));
        color *= vec3(0.95, 0.4, 1.3);

        // Add bright white electrical core on intense areas
        float intensity = dot(color, vec3(0.33));
        color += vec3(intensity * intensity * 0.8);

        color = clamp(color, 0.0, 1.0);
        gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    let startTime: number | null = null
    const DURATION = 4000 // ms — animation plays once then freezes

    const animate = () => {
      if (startTime === null) startTime = performance.now()
      const elapsed = performance.now() - startTime

      if (elapsed < DURATION) {
        uniforms.time.value += 0.025
        renderer.render(scene, camera)
        const animationId = requestAnimationFrame(animate)
        if (sceneRef.current) {
          sceneRef.current.animationId = animationId
        }
      } else {
        // Final render — freeze on last frame
        renderer.render(scene, camera)
      }
    }

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 }
    animate()

    return () => {
      window.removeEventListener("resize", onWindowResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }
        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
      }}
    />
  )
}
