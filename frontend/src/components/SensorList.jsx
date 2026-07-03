import { useState, useEffect, useMemo } from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { DitheringShader } from '@/components/ui/dithering-shader'
import { getClosestCity, getRegionRisk } from '@/utils/cityLookup'
import { defaultSensorNodes, REAL_SENSOR_ID } from '@/data/sensorNodes'

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

const severityConfig = {
  critical: { color: '#ef4444', bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40'    },
  high:     { color: '#f97316', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  medium:   { color: '#eab308', bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  low:      { color: '#22c55e', bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/40'  },
}

const shaderColors = {
  critical: { front: '#ef4444', back: '#1a0000' },
  high:     { front: '#f97316', back: '#1a0a00' },
  medium:   { front: '#eab308', back: '#1a1500' },
  low:      { front: '#22c55e', back: '#001a08' },
}

// ---------------------------------------------------------------------------
// Real-time frequency graph
// ---------------------------------------------------------------------------

function FrequencyGraph({ nodeId, initialFreq, severity, liveAlert, alerts }) {
  const config    = severityConfig[severity] || severityConfig.low
  const maxPoints = 20

  const [data, setData] = useState(() => {
    // Seed with real historical data for this node if available
    if (alerts && alerts.length > 0) {
      const nodeAlerts = alerts
        .filter(a => a.nodeId === nodeId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-10)
      if (nodeAlerts.length > 0) {
        return nodeAlerts.map(a => ({
          time:      new Date(a.timestamp).toLocaleTimeString(),
          frequency: a.peakFrequency || initialFreq,
        }))
      }
    }
    // Fallback — flat line at initial frequency
    return Array.from({ length: 5 }, (_, i) => ({
      time:      new Date(Date.now() - (4 - i) * 3000).toLocaleTimeString(),
      frequency: initialFreq,
    }))
  })

  // Update graph when a live alert arrives for THIS node
  useEffect(() => {
    if (!liveAlert) return
    if (liveAlert.nodeId !== nodeId) return
    if (liveAlert.peakFrequency == null) return

    setData(prev => {
      const next = [...prev, {
        time:      new Date(liveAlert.timestamp || Date.now()).toLocaleTimeString(),
        frequency: liveAlert.peakFrequency,
      }]
      return next.slice(-maxPoints)
    })
  }, [liveAlert, nodeId])

  // Simulate fluctuations only for simulated sensors — never for real sensor
  useEffect(() => {
    if (nodeId === REAL_SENSOR_ID) return
    if (!nodeId.startsWith('Simulated')) return

    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1]
        const next = [...prev, {
          time:      new Date().toLocaleTimeString(),
          frequency: Math.max(50, Math.min(2000, last.frequency + (Math.random() - 0.5) * 60)),
        }]
        return next.slice(-maxPoints)
      })
    }, 3000)
    return () => clearInterval(id)
  }, [nodeId])

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 2200]}
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(v) => `${v}Hz`}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '8px', color: '#f8fafc', fontSize: 12,
            }}
            formatter={(v) => [`${Math.round(v)} Hz`, 'Frequency']}
          />
          <ReferenceLine y={500}  stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Low',      fill: '#22c55e', fontSize: 9 }} />
          <ReferenceLine y={1000} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Medium',   fill: '#eab308', fontSize: 9 }} />
          <ReferenceLine y={1500} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'High',     fill: '#f97316', fontSize: 9 }} />
          <ReferenceLine y={2000} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical', fill: '#ef4444', fontSize: 9 }} />
          <Line
            type="monotone"
            dataKey="frequency"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: config.color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual sensor accordion item
// ---------------------------------------------------------------------------

function SensorCard({ node, liveAlert, alerts }) {
  const config     = severityConfig[node.severity] || severityConfig.low
  const city       = getClosestCity(node.lat, node.lng)
  const regionRisk = getRegionRisk(node.lat, node.lng)
  const shader     = shaderColors[node.severity] || shaderColors.low

  return (
    <AccordionPrimitive.Item
      value={node.nodeId}
      className="border-b border-white/10 last:border-0"
    >
      {/* ── Trigger row — + style ─────────────────────────────────────── */}
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className="flex flex-1 items-center gap-4 py-4 px-6 text-left
                     transition-all duration-150 hover:bg-white/5 group
                     [&[data-state=open]>svg]:rotate-45"
        >
          {/* Health dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ backgroundColor: config.color }}
          />

          {/* Node ID */}
          <span className="text-white font-mono font-bold text-sm w-24 flex-shrink-0">
            {node.nodeId}
          </span>

          {/* City */}
          <span className="text-[#94a3b8] text-sm flex-1">
            {city.name}, {city.state}
          </span>

          {/* Frequency */}
          <span className="text-white font-mono text-sm w-24 text-right flex-shrink-0">
            {node.peakFrequency} Hz
          </span>

          {/* Severity badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        uppercase tracking-wider border flex-shrink-0
                        ${config.bg} ${config.text} ${config.border}`}
          >
            {node.severity}
          </span>

          {/* Plus icon — rotates 45° to × on open */}
          <Plus
            size={16}
            strokeWidth={2}
            className="flex-shrink-0 text-[#475569] transition-transform duration-200
                       group-hover:text-[#94a3b8]"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      {/* ── Expanded content ──────────────────────────────────────────── */}
      <AccordionPrimitive.Content
        className="overflow-hidden transition-all
                   data-[state=closed]:animate-accordion-up
                   data-[state=open]:animate-accordion-down"
      >
        <div className="relative overflow-hidden">

          {/* Dithering shader background — severity-tinted */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <DitheringShader
              shape="swirl"
              type="4x4"
              colorBack={shader.back}
              colorFront={shader.front}
              pxSize={6}
              speed={0.4}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Content grid */}
          <div className="relative z-10 p-6 grid grid-cols-3 gap-6">

            {/* ── Column 1: Sensor Details ───────��──────────────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-4">
                Sensor Details
              </h3>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">Location</p>
                <p className="text-white font-semibold mb-1">{city.name}, {city.state}</p>
                <p className="text-[#94a3b8] font-mono text-xs mb-1">
                  {node.lat.toFixed(4)}° N, {Math.abs(node.lng).toFixed(4)}° W
                </p>
                <p className="text-[#475569] text-xs">
                  ~{city.distanceMiles} mi from {city.name} center
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">Alert Level</p>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-bold
                               uppercase tracking-wider border
                               ${config.bg} ${config.text} ${config.border}`}
                >
                  {node.severity}
                </span>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">Regional Risk</p>
                <p className="text-white text-sm">
                  {regionRisk.icon} {regionRisk.label}
                </p>
              </div>
            </div>

            {/* ── Column 2: Signal Data ─────────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-4">
                Signal Data
              </h3>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">Peak Frequency</p>
                <p className="text-4xl font-black font-mono" style={{ color: config.color }}>
                  {node.peakFrequency}
                  <span className="text-lg font-normal text-[#475569] ml-1">Hz</span>
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">Detection Range</p>
                <p className="text-white font-mono text-sm">100 — 2000 Hz</p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">Sample Rate</p>
                <p className="text-white font-mono text-sm">16,000 Hz</p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">Thresholds</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Low',      range: '< 500 Hz',      color: '#22c55e' },
                    { label: 'Medium',   range: '500–1000 Hz',   color: '#eab308' },
                    { label: 'High',     range: '1000–1500 Hz',  color: '#f97316' },
                    { label: 'Critical', range: '> 1500 Hz',     color: '#ef4444' },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-[#94a3b8]">{t.label}</span>
                      </div>
                      <span className="text-xs font-mono text-[#475569]">{t.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Column 3: Real-Time Graph ──────────────────────────── */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-4">
                Real-Time Frequency
              </h3>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <FrequencyGraph
                  nodeId={node.nodeId}
                  initialFreq={node.peakFrequency}
                  severity={node.severity}
                  liveAlert={liveAlert}
                  alerts={alerts}
                />
              </div>
            </div>

          </div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

// ---------------------------------------------------------------------------
// SensorList — main export
// ---------------------------------------------------------------------------

export default function SensorList({ alerts, liveAlert }) {
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
  }, [alerts, liveAlert])

  return (
    <div className="relative flex-1 overflow-y-auto alert-scroll bg-[#0f172a]">

      {/* Full-page dithering shader background — very subtle */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
        <DitheringShader
          shape="swirl"
          type="4x4"
          colorBack="#000820"
          colorFront="#0066ff"
          pxSize={8}
          speed={0.3}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">

        {/* Page header */}
        <div className="px-8 py-6 border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white tracking-tight">Sensor Nodes</h1>
          <p className="text-sm text-[#475569] mt-0.5">
            4 nodes active (1 real, 3 simulated) — click any node to expand details
          </p>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-6 py-2.5 border-b border-white/5 bg-black/20">
          <div className="w-2 flex-shrink-0" />
          <span className="text-xs text-[#475569] uppercase tracking-wider w-24 flex-shrink-0 ml-4">
            Node ID
          </span>
          <span className="text-xs text-[#475569] uppercase tracking-wider flex-1">
            Closest City
          </span>
          <span className="text-xs text-[#475569] uppercase tracking-wider w-24 text-right flex-shrink-0">
            Frequency
          </span>
          <span className="text-xs text-[#475569] uppercase tracking-wider w-20 text-center flex-shrink-0">
            Severity
          </span>
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* Accordion list */}
        <AccordionPrimitive.Root type="single" collapsible className="w-full">
          {sensorNodes.map((node) => (
            <SensorCard key={node.nodeId} node={node} liveAlert={liveAlert} alerts={alerts} />
          ))}
        </AccordionPrimitive.Root>

      </div>
    </div>
  )
}
