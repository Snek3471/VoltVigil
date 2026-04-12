"use client"

import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  Children,
  isValidElement,
  useCallback,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import maplibregl from "maplibre-gl"

// ─── Map context ─────────────────────────────────────────────────────────────

interface MapContextValue {
  map: maplibregl.Map | null
  isLoaded: boolean
}
const MapContext = createContext<MapContextValue>({ map: null, isLoaded: false })

// ─── useMap hook ──────────────────────────────────────────────────────────────

export function useMap() {
  return useContext(MapContext)
}

// ─── Map ─────────────────────────────────────────────────────────────────────

interface MapProps {
  children?: ReactNode
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  maxBounds?: [[number, number], [number, number]]
  renderWorldCopies?: boolean
  className?: string
}

export function Map({
  children,
  center = [-98.5795, 39.8283],
  zoom = 3.8,
  minZoom,
  maxZoom,
  maxBounds,
  renderWorldCopies = false,
  className = "",
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap]           = useState<maplibregl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const m = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center,
      zoom,
      minZoom,
      maxZoom,
      ...(maxBounds ? { maxBounds: maxBounds as maplibregl.LngLatBoundsLike } : {}),
      renderWorldCopies,
      attributionControl: false,
    })

    m.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    )

    m.on("load", () => { setMap(m); setIsLoaded(true) })

    return () => {
      m.remove()
      setMap(null)
      setIsLoaded(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <MapContext.Provider value={{ map, isLoaded }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
        className={className}
      />
      {map && children}
    </MapContext.Provider>
  )
}

// ─── Sentinel components (identity only — MapMarker reads their children) ────

export function MarkerContent({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function MarkerPopup({
  children,
  closeButton: _closeButton,
}: {
  children?: ReactNode
  closeButton?: boolean
}) {
  return <>{children}</>
}

export function MarkerLabel({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

// ─── MapMarker ────────────────────────────────────────────────────────────────

interface MapMarkerProps {
  children?: ReactNode
  longitude: number
  latitude: number
}

export function MapMarker({ children, longitude, latitude }: MapMarkerProps) {
  const { map } = useContext(MapContext)
  const [ready, setReady] = useState(false)

  // Stable DOM elements — created once, never recreated
  const markerElRef = useRef<HTMLDivElement | null>(null)
  const popupElRef  = useRef<HTMLDivElement | null>(null)
  const popupRef    = useRef<maplibregl.Popup | null>(null)
  const isOpenRef   = useRef(false)

  if (!markerElRef.current) markerElRef.current = document.createElement("div")
  if (!popupElRef.current)  popupElRef.current  = document.createElement("div")

  const handleMarkerClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!map || !popupRef.current) return
      isOpenRef.current = !isOpenRef.current
      if (isOpenRef.current) {
        popupRef.current.setLngLat([longitude, latitude]).addTo(map)
      } else {
        popupRef.current.remove()
      }
    },
    [map, longitude, latitude]
  )

  useEffect(() => {
    if (!map) return

    const el = markerElRef.current!
    const popupEl = popupElRef.current!

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 12,
      maxWidth: "none",
    }).setDOMContent(popupEl)
    popupRef.current = popup

    // Track when maplibre closes the popup via its own X button
    popup.on("close", () => { isOpenRef.current = false })

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map)

    // Close popup when clicking elsewhere on the map
    const closeOnMapClick = () => {
      if (isOpenRef.current) {
        popup.remove()
        isOpenRef.current = false
      }
    }
    map.on("click", closeOnMapClick)

    setReady(true)

    return () => {
      map.off("click", closeOnMapClick)
      popup.remove()
      marker.remove()
      popupRef.current = null
      isOpenRef.current = false
      setReady(false)
    }
  }, [map, longitude, latitude])

  // Split children into content node and popup node
  let contentNode: ReactNode = null
  let popupNode: ReactNode   = null
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if ((child.type as any) === MarkerContent) contentNode = (child.props as any).children
    if ((child.type as any) === MarkerPopup)   popupNode   = (child.props as any).children
  })

  if (!ready || !markerElRef.current || !popupElRef.current) return null

  return (
    <>
      {createPortal(
        <div
          onClick={handleMarkerClick}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {contentNode}
        </div>,
        markerElRef.current
      )}
      {createPortal(
        <div>{popupNode}</div>,
        popupElRef.current
      )}
    </>
  )
}

// ─── MapControls ──────────────────────────────────────────────────────────────

interface MapControlsProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  showZoom?: boolean
  showFullscreen?: boolean
}

export function MapControls({
  position = "bottom-right",
  showZoom = true,
  showFullscreen = false,
}: MapControlsProps) {
  const { map } = useContext(MapContext)

  useEffect(() => {
    if (!map) return
    const removers: (() => void)[] = []

    if (showZoom) {
      const nav = new maplibregl.NavigationControl({ showCompass: false })
      map.addControl(nav, position)
      removers.push(() => { try { map.removeControl(nav) } catch {} })
    }
    if (showFullscreen) {
      const full = new maplibregl.FullscreenControl()
      map.addControl(full, position)
      removers.push(() => { try { map.removeControl(full) } catch {} })
    }

    return () => removers.forEach((r) => r())
  }, [map, position, showZoom, showFullscreen])

  return null
}
