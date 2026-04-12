import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLOR = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#6b7280',
};

const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

const SEVERITY_BADGE = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  low:      'bg-green-500/20 text-green-300 border border-green-500/30',
  unknown:  'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

// Leaflet Circle radius in meters
const RISK_RADIUS = { critical: 100000, high: 50000, medium: 25000, low: 10000, unknown: 10000 };

const HEALTH_DOT = {
  green: 'bg-green-400 animate-pulse',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  gray: 'bg-gray-500',
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

const createNodeIcon = (severity) => {
  const color = SEVERITY_COLOR[severity] || SEVERITY_COLOR.unknown;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 0 6px ${color};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const getRegionalRisk = (lat, lng) => {
  if (lat > 45 && lng < -115)
    return { emoji: '🌲', label: 'High wildfire / forest fire risk', level: 'high' };
  if (lat < 30 && lng > -85)
    return { emoji: '🌀', label: 'Hurricane exposure risk', level: 'high' };
  if (lat < 32 && lng > -97 && lng < -85)
    return { emoji: '🌊', label: 'Flood and storm surge risk', level: 'medium' };
  if (lat > 32 && lat < 42 && lng < -114)
    return { emoji: '🔥', label: 'Wildfire and drought risk', level: 'high' };
  return { emoji: '⚡', label: 'Standard grid fault risk', level: 'low' };
};

const getFreqRisk = (freq) => {
  if (freq < 500) return { label: 'Low', level: 'low' };
  if (freq < 1000) return { label: 'Medium', level: 'medium' };
  if (freq < 1500) return { label: 'High', level: 'high' };
  return { label: 'Critical', level: 'critical' };
};

const combineRisk = (freqRisk, regionalRisk) => {
  const fo = SEVERITY_ORDER[freqRisk.level] ?? 0;
  const ro = SEVERITY_ORDER[regionalRisk.level] ?? 0;
  if (fo === 3 || ro === 3) return 'critical';
  if (ro >= 2 && fo >= 1) return 'high';
  const maxLevel = Math.max(fo, ro);
  return Object.keys(SEVERITY_ORDER).find((k) => SEVERITY_ORDER[k] === maxLevel) || 'low';
};

const getHealthStatus = ({ timestamp }) => {
  if (!timestamp) return { dot: 'gray', label: 'No Data', emoji: '⚫' };
  const ageSec = (Date.now() - new Date(timestamp).getTime()) / 1000;
  if (ageSec < 60) return { dot: 'green', label: 'Healthy', emoji: '🟢' };
  if (ageSec < 300) return { dot: 'yellow', label: 'Degraded', emoji: '🟡' };
  return { dot: 'red', label: 'Offline', emoji: '🔴' };
};

const formatTs = (ts) => {
  if (!ts) return 'Simulated';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// ---------------------------------------------------------------------------
// Small shared sub-components
// ---------------------------------------------------------------------------

const SeverityBadge = ({ severity }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
      SEVERITY_BADGE[severity] || SEVERITY_BADGE.unknown
    }`}
  >
    {severity || 'unknown'}
  </span>
);

const ChevronIcon = ({ isExpanded }) => (
  <svg
    className={`w-4 h-4 text-[#475569] flex-shrink-0 transition-transform duration-200 ${
      isExpanded ? 'rotate-180' : ''
    }`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PanelHeading = ({ children }) => (
  <h3 className="text-xs font-semibold tracking-widest uppercase text-[#475569] mb-4">
    {children}
  </h3>
);

// ---------------------------------------------------------------------------
// MapResizer — calls invalidateSize after the accordion opens
// ---------------------------------------------------------------------------

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

// ---------------------------------------------------------------------------
// FrequencyGraph
// ---------------------------------------------------------------------------

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#475569] mb-1">{label}</p>
      <p className="font-bold tabular-nums" style={{ color: '#eab308' }}>
        {payload[0].value?.toFixed(1)} <span className="font-normal text-[#94a3b8]">Hz</span>
      </p>
    </div>
  );
};

const FrequencyGraph = ({ data, severity }) => {
  const lineColor = SEVERITY_COLOR[severity] || SEVERITY_COLOR.unknown;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 4" stroke="#1e3250" vertical={false} />
        <XAxis
          dataKey="time"
          stroke="#1e3250"
          tick={{ fill: '#475569', fontSize: 9 }}
          tickLine={false}
          axisLine={{ stroke: '#1e3250' }}
          label={{ value: 'Time', position: 'insideBottom', offset: -18, fill: '#475569', fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#1e3250"
          tick={{ fill: '#475569', fontSize: 9 }}
          tickLine={false}
          axisLine={{ stroke: '#1e3250' }}
          domain={[0, 2500]}
          label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', offset: 12, fill: '#475569', fontSize: 10 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
        <ReferenceLine y={500}  stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Low',      position: 'insideTopRight', fill: '#22c55e', fontSize: 8 }} />
        <ReferenceLine y={1000} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Medium',   position: 'insideTopRight', fill: '#eab308', fontSize: 8 }} />
        <ReferenceLine y={1500} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'High',     position: 'insideTopRight', fill: '#f97316', fontSize: 8 }} />
        <ReferenceLine y={2000} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Critical', position: 'insideTopRight', fill: '#ef4444', fontSize: 8 }} />
        <Line
          type="monotone"
          dataKey="frequency"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          isAnimationActive={false}
          name="Peak Freq (Hz)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ---------------------------------------------------------------------------
// RiskZoneMap — isolated Leaflet map per sensor
// ---------------------------------------------------------------------------

const CIRCLE_COLOR = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#6b7280',
};

const RiskZoneMap = ({ node, severity }) => {
  const center = [node.lat, node.lng];
  const radius = RISK_RADIUS[severity] || RISK_RADIUS.unknown;
  const color = CIRCLE_COLOR[severity] || CIRCLE_COLOR.unknown;
  const icon = createNodeIcon(severity);

  return (
    <MapContainer
      key={`risk-${node.nodeId}`}
      center={center}
      zoom={6}
      style={{ width: '100%', height: '220px', borderRadius: '8px' }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <MapResizer />
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.2,
          opacity: 0.6,
          weight: 2,
        }}
      />
      <Marker position={center} icon={icon}>
        <Popup>
          <strong>{node.nodeId}</strong>
          <br />
          <span style={{ color: SEVERITY_COLOR[severity] || '#6b7280', textTransform: 'capitalize' }}>
            {severity}
          </span>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

// ---------------------------------------------------------------------------
// ThreatAssessment
// ---------------------------------------------------------------------------

const THREAT_BADGE = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  low:      'bg-green-500/20 text-green-300 border border-green-500/30',
};

const ThreatAssessment = ({ freqRisk, regionalRisk, overallThreat }) => (
  <div className="space-y-3">
    <div className="space-y-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#94a3b8]">Frequency Risk</span>
        <SeverityBadge severity={freqRisk.level} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[#94a3b8]">Regional Factors</span>
        <span className="text-[#f8fafc] text-xs text-right max-w-[160px]">
          {regionalRisk.emoji} {regionalRisk.label}
        </span>
      </div>
    </div>

    <div className="pt-2.5 border-t border-[#334155]">
      <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-2">Overall Threat Level</p>
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          THREAT_BADGE[overallThreat] || THREAT_BADGE.low
        }`}
      >
        {overallThreat}
      </span>
    </div>

    <p className="text-xs italic text-[#475569] leading-relaxed pt-1">
      Threat assessment will be refined with real environmental and grid topology data post-deployment.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// HealthPanel
// ---------------------------------------------------------------------------

const DOT_COLOR = {
  green:  'bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse',
  yellow: 'bg-yellow-400 shadow-[0_0_6px_#facc15]',
  red:    'bg-red-500 shadow-[0_0_6px_#ef4444]',
};

const HealthPanel = ({ healthStatus, totalAlerts, timestamp }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLOR[healthStatus.dot] || 'bg-slate-500'}`} />
      <span className="text-[#f8fafc] font-semibold text-sm">{healthStatus.label}</span>
    </div>

    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <span className="text-[#94a3b8]">Alerts logged</span>
        <span className="text-[#f8fafc] font-semibold tabular-nums font-mono">{totalAlerts}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#94a3b8]">Last transmission</span>
        <span className="text-[#94a3b8] text-xs text-right font-mono">{formatTs(timestamp)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#94a3b8]">Uptime estimate</span>
        <span className="text-[#94a3b8] text-xs text-right">
          {totalAlerts >= 10
            ? 'Stable history'
            : 'Insufficient data'}
        </span>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// SensorCard — collapsed + expanded
// ---------------------------------------------------------------------------

const SensorCard = ({ node, nodeAlerts, liveAlert, isExpanded, onToggle }) => {
  const current = useMemo(() => {
    if (
      liveAlert &&
      (!node.timestamp || new Date(liveAlert.timestamp) >= new Date(node.timestamp))
    ) {
      return {
        severity:      liveAlert.severity,
        peakFrequency: liveAlert.peakFrequency,
        timestamp:     liveAlert.timestamp,
      };
    }
    return {
      severity:      node.severity,
      peakFrequency: node.peakFrequency,
      timestamp:     node.timestamp,
    };
  }, [node, liveAlert]);

  const graphData = useMemo(() => {
    const all = [...nodeAlerts];
    if (liveAlert && !all.some((a) => a._id === liveAlert._id)) {
      all.push(liveAlert);
    }
    const sorted = all
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-20);

    if (sorted.length === 0) return [];
    return sorted.map((a) => ({
      time: new Date(a.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      frequency: a.peakFrequency,
    }));
  }, [nodeAlerts, liveAlert, node.peakFrequency]);

  const totalAlerts =
    nodeAlerts.length +
    (liveAlert && !nodeAlerts.some((a) => a._id === liveAlert._id) ? 1 : 0);

  const healthStatus = getHealthStatus(current);
  const freqRisk     = getFreqRisk(current.peakFrequency);
  const regionalRisk = getRegionalRisk(node.lat, node.lng);
  const overallThreat = combineRisk(freqRisk, regionalRisk);
  const healthDot = HEALTH_DOT[healthStatus.dot] || HEALTH_DOT.gray;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'border-[#475569]'
          : 'border-[#334155] hover:border-[#3b82f6]/40'
      }`}
    >
      {/* ── Collapsed row ─────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-6 px-6 py-4 text-left transition-colors duration-150 group ${
          isExpanded ? 'bg-[#1e293b]' : 'bg-[#1e293b] hover:bg-[#243247]'
        }`}
      >
        {/* Left — health dot + node ID */}
        <div className="flex items-center gap-3 w-36 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${healthDot}`} />
          <span className="text-[#f8fafc] font-mono font-semibold text-sm tracking-wide">
            {node.nodeId}
          </span>
        </div>

        {/* Center — key stats */}
        <div className="flex items-center gap-10 flex-1 justify-center">
          <div className="text-center">
            <p className="text-xs text-[#475569] uppercase tracking-wider mb-0.5">Frequency</p>
            <p className="text-[#f8fafc] font-mono text-sm font-semibold">
              {typeof current.peakFrequency === 'number'
                ? current.peakFrequency.toFixed(1)
                : current.peakFrequency}{' '}
              <span className="text-[#475569] text-xs font-normal">Hz</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#475569] uppercase tracking-wider mb-0.5">Last Seen</p>
            <p className="text-[#94a3b8] font-mono text-sm">{formatTs(current.timestamp)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#475569] uppercase tracking-wider mb-0.5">Alerts</p>
            <p className="text-[#f8fafc] font-mono text-sm font-semibold">{totalAlerts}</p>
          </div>
        </div>

        {/* Right — severity badge + chevron */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <SeverityBadge severity={current.severity} />
          <ChevronIcon isExpanded={isExpanded} />
        </div>
      </button>

      {/* ── Expanded panel ─────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="bg-[#0f172a] border-t border-[#334155] p-6 grid grid-cols-2 gap-5">

          {/* Frequency graph — full width */}
          <div className="col-span-2 bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
            <PanelHeading>Frequency Over Time</PanelHeading>
            <div style={{ height: '220px' }}>
              <FrequencyGraph data={graphData} severity={current.severity} />
            </div>
          </div>

          {/* Blackout risk zone map */}
          <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
            <PanelHeading>Blackout Risk Zone</PanelHeading>
            <RiskZoneMap node={node} severity={current.severity} />
            <p className="text-xs italic text-[#475569] mt-2 leading-relaxed">
              Simulated risk zone based on severity level. Real propagation data pending hardware
              deployment.
            </p>
          </div>

          {/* Threat assessment + sensor health stacked */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155] flex-1">
              <PanelHeading>Threat Assessment</PanelHeading>
              <ThreatAssessment
                freqRisk={freqRisk}
                regionalRisk={regionalRisk}
                overallThreat={overallThreat}
              />
            </div>
            <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155] flex-1">
              <PanelHeading>Sensor Health</PanelHeading>
              <HealthPanel
                healthStatus={healthStatus}
                totalAlerts={totalAlerts}
                timestamp={current.timestamp}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SensorList — main export
// ---------------------------------------------------------------------------

const SensorList = ({ alerts, liveAlert }) => {
  const [expandedId, setExpandedId] = useState(null);

  const nodes = useMemo(() => {
    const latestByNode = {};
    alerts.forEach((alert) => {
      if (
        !latestByNode[alert.nodeId] ||
        new Date(alert.timestamp) > new Date(latestByNode[alert.nodeId].timestamp)
      ) {
        latestByNode[alert.nodeId] = alert;
      }
    });
    return Object.values(latestByNode).map((alert) => ({
      nodeId:        alert.nodeId,
      lat:           alert.lat,
      lng:           alert.lng,
      severity:      alert.severity,
      peakFrequency: alert.peakFrequency,
      timestamp:     alert.timestamp,
    }));
  }, [alerts]);

  const alertsByNode = useMemo(() => {
    const map = {};
    alerts.forEach((alert) => {
      if (!map[alert.nodeId]) map[alert.nodeId] = [];
      map[alert.nodeId].push(alert);
    });
    return map;
  }, [alerts]);

  const toggleExpand = (nodeId) =>
    setExpandedId((prev) => (prev === nodeId ? null : nodeId));

  return (
    <div className="flex-1 overflow-hidden flex flex-col">

      {/* Page header */}
      <div className="px-8 py-6 border-b border-[#1e293b] flex-shrink-0">
        <h1 className="text-xl font-bold text-[#f8fafc] tracking-tight">Sensor Nodes</h1>
        <p className="text-sm text-[#475569] mt-0.5">
          {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'} active — click any node to expand details
        </p>
      </div>

      {/* Scrollable node list */}
      <div className="flex-1 overflow-y-auto alert-scroll">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-3">

          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center border border-[#334155]">
                <span className="text-3xl opacity-50">📡</span>
              </div>
              <p className="text-[#f8fafc] font-medium">No sensor data received yet</p>
              <p className="text-[#475569] text-sm max-w-xs">
                Waiting for hardware nodes to come online and POST alerts.
              </p>
            </div>
          ) : (
            nodes.map((node) => {
              const relevantLiveAlert =
                liveAlert?.nodeId === node.nodeId ? liveAlert : null;
              return (
                <SensorCard
                  key={node.nodeId}
                  node={node}
                  nodeAlerts={alertsByNode[node.nodeId] || []}
                  liveAlert={relevantLiveAlert}
                  isExpanded={expandedId === node.nodeId}
                  onToggle={() => toggleExpand(node.nodeId)}
                />
              );
            })
          )}

        </div>
      </div>
    </div>
  );
};

export default SensorList;
