import { useMemo, useEffect } from 'react'
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  useMap,
} from '@/components/ui/map'

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

const simulatedNodes = [
  { nodeId: 'sensor-01', lat: 38.90, lng: -77.03,  peakFrequency: 847,  severity: 'high'     },
  { nodeId: 'sensor-02', lat: 40.71, lng: -74.00,  peakFrequency: 312,  severity: 'low'      },
  { nodeId: 'sensor-03', lat: 34.05, lng: -118.24, peakFrequency: 1850, severity: 'critical'  },
  { nodeId: 'sensor-04', lat: 41.87, lng: -87.62,  peakFrequency: 640,  severity: 'medium'   },
  { nodeId: 'sensor-05', lat: 29.76, lng: -95.36,  peakFrequency: 278,  severity: 'low'      },
  { nodeId: 'sensor-06', lat: 33.44, lng: -112.07, peakFrequency: 920,  severity: 'high'     },
  { nodeId: 'sensor-07', lat: 47.60, lng: -122.33, peakFrequency: 510,  severity: 'medium'   },
  { nodeId: 'sensor-08', lat: 25.76, lng: -80.19,  peakFrequency: 1760, severity: 'critical'  },
  { nodeId: 'sensor-09', lat: 39.95, lng: -75.16,  peakFrequency: 190,  severity: 'low'      },
  { nodeId: 'sensor-10', lat: 32.77, lng: -96.79,  peakFrequency: 1100, severity: 'high'     },
  { nodeId: 'sensor-11', lat: 37.77, lng: -122.41, peakFrequency: 430,  severity: 'medium'   },
  { nodeId: 'sensor-12', lat: 42.36, lng: -71.05,  peakFrequency: 220,  severity: 'low'      },
]

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
    if (!alerts || alerts.length === 0) return simulatedNodes

    const nodeMap = {}
    alerts.forEach((alert) => {
      if (
        !nodeMap[alert.nodeId] ||
        new Date(alert.timestamp) > new Date(nodeMap[alert.nodeId].timestamp)
      ) {
        nodeMap[alert.nodeId] = alert
      }
    })

    const real = Object.values(nodeMap).map((alert) => ({
      nodeId:        alert.nodeId,
      lat:           alert.lat,
      lng:           alert.lng,
      peakFrequency: alert.peakFrequency,
      severity:      alert.severity,
    }))

    return real.length > 0 ? real : simulatedNodes
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
