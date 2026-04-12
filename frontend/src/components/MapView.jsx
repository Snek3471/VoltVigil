import { useMemo, useEffect } from 'react'
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  useMap,
} from '@/components/ui/map'
import { defaultSensorNodes, REAL_SENSOR_ID } from '@/data/sensorNodes'

function MapBoundsFixer() {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    map.setMaxBounds([[-140, 18], [-60, 72]])
    map.setMinZoom(3.5)

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()
    map.setPitch(0)
    map.setBearing(0)

    const onZoomEnd = () => {
      const center = map.getCenter()
      if (center.lng < -140 || center.lng > -60 ||
          center.lat < 18   || center.lat > 72) {
        map.easeTo({ center: [-98.5795, 39.8283], zoom: 3.8, duration: 500 })
      }
    }
    map.on('zoomend', onZoomEnd)
    return () => { map.off('zoomend', onZoomEnd) }
  }, [map, isLoaded])

  return null
}


const severityConfig = {
  critical: {
    color:  '#ef4444',
    bg:     'bg-red-500/20',
    text:   'text-red-300',
    border: 'border-red-500/30',
    glow:   '0 0 14px rgba(239,68,68,0.65)',
    dot:    16,
  },
  high: {
    color:  '#f97316',
    bg:     'bg-orange-500/20',
    text:   'text-orange-300',
    border: 'border-orange-500/30',
    glow:   '0 0 10px rgba(249,115,22,0.55)',
    dot:    13,
  },
  medium: {
    color:  '#eab308',
    bg:     'bg-yellow-500/20',
    text:   'text-yellow-300',
    border: 'border-yellow-500/30',
    glow:   '0 0 8px rgba(234,179,8,0.45)',
    dot:    10,
  },
  low: {
    color:  '#22c55e',
    bg:     'bg-green-500/20',
    text:   'text-green-300',
    border: 'border-green-500/30',
    glow:   '0 0 6px rgba(34,197,94,0.35)',
    dot:    8,
  },
}

function SensorMarker({ node }) {
  const cfg        = severityConfig[node.severity] ?? severityConfig.low
  const isCritical = node.severity === 'critical'
  const isHigh     = node.severity === 'high'

  return (
    <MapMarker longitude={node.lng} latitude={node.lat}>

      <MarkerContent>
        <div className="relative flex items-center justify-center">
          {/* Pulse ring — critical and high only */}
          {(isCritical || isHigh) && (
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width:           isCritical ? 30 : 24,
                height:          isCritical ? 30 : 24,
                backgroundColor: cfg.color,
                opacity:         0.28,
              }}
            />
          )}

          {/* Main dot */}
          <div
            className="relative rounded-full border-2 border-white z-10
                       hover:scale-125 transition-transform duration-200"
            style={{
              width:           cfg.dot,
              height:          cfg.dot,
              backgroundColor: cfg.color,
              boxShadow:       cfg.glow,
            }}
          />
        </div>
      </MarkerContent>

      <MarkerPopup closeButton={true}>
        <div className="w-56 p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#f8fafc] font-mono font-bold text-sm">
              {node.nodeId}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          uppercase tracking-wider border
                          ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {node.severity}
            </span>
          </div>

          <div className="border-t border-[#334155] mb-3" />

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#475569] uppercase tracking-wider">
                Peak Frequency
              </span>
              <span className="text-[#f8fafc] font-mono text-sm font-semibold">
                {node.peakFrequency} Hz
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#475569] uppercase tracking-wider">
                Latitude
              </span>
              <span className="text-[#94a3b8] font-mono text-xs">
                {node.lat.toFixed(4)}° N
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#475569] uppercase tracking-wider">
                Longitude
              </span>
              <span className="text-[#94a3b8] font-mono text-xs">
                {Math.abs(node.lng).toFixed(4)}° W
              </span>
            </div>
          </div>

        </div>
      </MarkerPopup>

    </MapMarker>
  )
}

export default function MapView({ alerts }) {
  const sensorNodes = useMemo(() => {
    const nodes = [...defaultSensorNodes]

    if (!alerts || alerts.length === 0) return nodes

    const realAlerts = alerts.filter(a => a.nodeId === REAL_SENSOR_ID)
    if (realAlerts.length === 0) return nodes

    const latest = realAlerts.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0]

    return nodes.map(node =>
      node.nodeId === REAL_SENSOR_ID
        ? {
            ...node,
            lat:           latest.lat,
            lng:           latest.lng,
            peakFrequency: latest.peakFrequency,
            severity:      latest.severity,
          }
        : node
    )
  }, [alerts])

  return (
    <div className="w-full h-full bg-[#0f172a]">
      <Map
        center={[-98.5795, 39.8283]}
        zoom={3.8}
        minZoom={3.5}
        maxZoom={12}
        maxBounds={[[-140, 18], [-60, 72]]}
        renderWorldCopies={false}
      >
        <MapBoundsFixer />

        {sensorNodes.map((node) => (
          <SensorMarker key={node.nodeId} node={node} />
        ))}

        <MapControls position="bottom-right" showZoom={true} showFullscreen={true} />
      </Map>
    </div>
  )
}
