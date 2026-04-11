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
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
  unknown: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

// Leaflet Circle radius in meters
const RISK_RADIUS = { critical: 100000, high: 50000, medium: 25000, low: 10000, unknown: 10000 };

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
    className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
      SEVERITY_BADGE[severity] || SEVERITY_BADGE.unknown
    }`}
  >
    {severity || 'unknown'}
  </span>
);

const ChevronIcon = ({ isExpanded }) => (
  <svg
    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
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

const SectionHeading = ({ children }) => (
  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
    {children}
  </h4>
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
    <div className="bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-xs text-slate-200">
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold" style={{ color: '#eab308' }}>
        {payload[0].value?.toFixed(1)} Hz
      </p>
    </div>
  );
};

const FrequencyGraph = ({ data, severity }) => {
  const lineColor = SEVERITY_COLOR[severity] || SEVERITY_COLOR.unknown;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="time"
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 9 }}
          label={{ value: 'Time', position: 'insideBottom', offset: -18, fill: '#94a3b8', fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 9 }}
          domain={[0, 2500]}
          label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', offset: 12, fill: '#94a3b8', fontSize: 10 }}
        />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={500}  stroke="#22c55e" strokeDasharray="4 3" label={{ value: 'Low',      position: 'insideTopRight', fill: '#22c55e', fontSize: 9 }} />
        <ReferenceLine y={1000} stroke="#eab308" strokeDasharray="4 3" label={{ value: 'Medium',   position: 'insideTopRight', fill: '#eab308', fontSize: 9 }} />
        <ReferenceLine y={1500} stroke="#f97316" strokeDasharray="4 3" label={{ value: 'High',     position: 'insideTopRight', fill: '#f97316', fontSize: 9 }} />
        <ReferenceLine y={2000} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Critical', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
        <Line
          type="monotone"
          dataKey="frequency"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
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
      style={{ width: '100%', height: '250px', borderRadius: '8px' }}
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
// MLPredictionPanel
// ---------------------------------------------------------------------------

const BREAKDOWN_LABEL = {
  frequencyRisk: 'Frequency Risk',
  regionRisk:    'Region Risk',
  behaviorRisk:  'Behavior Risk',
};

const MLPredictionPanel = ({ mlConfidence, mlFeatureBreakdown, severitySource, severity }) => {
  const isML      = severitySource === 'ml';
  const hasData   = mlConfidence !== null && mlConfidence !== undefined;
  const barColor  = SEVERITY_COLOR[severity] || SEVERITY_COLOR.unknown;
  const confidencePct = hasData ? Math.round(mlConfidence * 100) : 0;

  return (
    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 space-y-3">
      <SectionHeading>🤖 ML Severity Prediction</SectionHeading>

      {!hasData ? (
        <p className="text-slate-500 text-sm">
          ML service offline — alert severity determined by threshold rules.
        </p>
      ) : (
        <>
          {/* Predicted severity + source badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 text-sm">Predicted</span>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={severity} />
              {!isML && (
                <span className="text-xs text-slate-400 bg-slate-700/60 border border-slate-600/40 px-2 py-0.5 rounded-full">
                  Rule Based
                </span>
              )}
            </div>
          </div>

          {/* Confidence bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Confidence</span>
              <span className="text-slate-200 font-medium tabular-nums">{confidencePct}%</span>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${confidencePct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          {/* Source */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Source</span>
            <span className={isML ? 'text-green-400 font-medium' : 'text-slate-400'}>
              {isML ? 'ML Model' : 'Threshold Rules'}
            </span>
          </div>

          {/* Feature breakdown */}
          {mlFeatureBreakdown && (
            <div className="pt-2 border-t border-[#334155] space-y-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Feature Breakdown
              </p>
              {Object.entries(mlFeatureBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-slate-400">{BREAKDOWN_LABEL[key] || key}</span>
                  <span className="text-slate-200 capitalize">{value}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs italic text-slate-600 leading-relaxed pt-1">
            ⚠️ Model trained on simulated data. Accuracy improves post-deployment.
          </p>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ThreatAssessment
// ---------------------------------------------------------------------------

const THREAT_BADGE = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  low: 'bg-green-500/20 text-green-300 border border-green-500/40',
};

const ThreatAssessment = ({ freqRisk, regionalRisk, overallThreat }) => (
  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 space-y-3">
    <SectionHeading>Threat Assessment</SectionHeading>

    <div className="space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-slate-400">Frequency Risk</span>
        <SeverityBadge severity={freqRisk.level} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <span className="text-slate-400">Regional Factors</span>
        <span className="text-slate-200 text-xs text-right max-w-[160px]">
          {regionalRisk.emoji} {regionalRisk.label}
        </span>
      </div>
    </div>

    <div className="pt-2 border-t border-[#334155]">
      <p className="text-xs text-slate-500 mb-2">Overall Threat Level</p>
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${
          THREAT_BADGE[overallThreat] || THREAT_BADGE.low
        }`}
      >
        {overallThreat}
      </span>
    </div>

    <p className="text-xs italic text-slate-600 leading-relaxed pt-1">
      Threat assessment will be refined with real environmental and grid topology data post-deployment.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// HealthPanel
// ---------------------------------------------------------------------------

const DOT_COLOR = { green: 'bg-green-500', yellow: 'bg-yellow-400', red: 'bg-red-500' };

const HealthPanel = ({ healthStatus, totalAlerts, timestamp }) => (
  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 space-y-3">
    <SectionHeading>Sensor Health</SectionHeading>

    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${DOT_COLOR[healthStatus.dot] || 'bg-slate-500'}`} />
      <span className="text-white font-semibold text-sm">{healthStatus.label}</span>
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-400">Alerts logged</span>
        <span className="text-slate-200 font-medium">{totalAlerts}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Last transmission</span>
        <span className="text-slate-200 text-xs text-right">{formatTs(timestamp)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400">Uptime estimate</span>
        <span className="text-slate-200 text-xs text-right">
          {totalAlerts >= 10
            ? 'Stable transmission history'
            : 'Insufficient data for uptime estimate'}
        </span>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// SensorCard — collapsed + expanded
// ---------------------------------------------------------------------------

const SensorCard = ({ node, nodeAlerts, liveAlert, isExpanded, onToggle }) => {
  // If liveAlert is newer than the current node data, use it for display
  const current = useMemo(() => {
    if (
      liveAlert &&
      (!node.timestamp || new Date(liveAlert.timestamp) >= new Date(node.timestamp))
    ) {
      return {
        severity:           liveAlert.severity,
        peakFrequency:      liveAlert.peakFrequency,
        timestamp:          liveAlert.timestamp,
        mlConfidence:       liveAlert.mlConfidence       ?? null,
        mlFeatureBreakdown: liveAlert.mlFeatureBreakdown ?? null,
        severitySource:     liveAlert.severitySource     ?? 'threshold',
      };
    }
    return {
      severity:           node.severity,
      peakFrequency:      node.peakFrequency,
      timestamp:          node.timestamp,
      mlConfidence:       node.mlConfidence       ?? null,
      mlFeatureBreakdown: node.mlFeatureBreakdown ?? null,
      severitySource:     node.severitySource     ?? 'threshold',
    };
  }, [node, liveAlert]);

  // Build graph data: all nodeAlerts + liveAlert (deduped), last 20 sorted by time
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
  const freqRisk = getFreqRisk(current.peakFrequency);
  const regionalRisk = getRegionalRisk(node.lat, node.lng);
  const overallThreat = combineRisk(freqRisk, regionalRisk);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">

      {/* ── Collapsed row ──────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#263348] transition-colors text-left"
      >
        {/* Left: id + severity + freq */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="font-mono font-bold text-white text-sm flex-shrink-0">
            {node.nodeId}
          </span>
          <SeverityBadge severity={current.severity} />
          <span className="text-slate-300 text-sm flex-shrink-0">
            {typeof current.peakFrequency === 'number'
              ? current.peakFrequency.toFixed(1)
              : current.peakFrequency}{' '}
            Hz
          </span>
          <span className="text-slate-500 text-xs flex-shrink-0 hidden sm:block">
            {formatTs(current.timestamp)}
          </span>
        </div>

        {/* Right: health dot + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${DOT_COLOR[healthStatus.dot] || 'bg-slate-500'}`}
            />
            <span className="text-xs text-slate-400 hidden sm:block">{healthStatus.label}</span>
          </div>
          <ChevronIcon isExpanded={isExpanded} />
        </div>
      </button>

      {/* ── Expanded panel ─────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-[#334155] p-4 space-y-5">

          {/* Section 1: Frequency Over Time */}
          <div>
            <SectionHeading>Frequency Over Time</SectionHeading>
            <div style={{ height: '220px' }}>
              <FrequencyGraph data={graphData} severity={current.severity} />
            </div>
          </div>

          {/* Section 2: Blackout Risk Zone Map */}
          <div>
            <SectionHeading>Blackout Risk Zone</SectionHeading>
            <RiskZoneMap node={node} severity={current.severity} />
            <p className="text-xs italic text-slate-500 mt-2 leading-relaxed">
              Blackout risk zone is simulated based on severity level. Real propagation data pending
              hardware deployment.
            </p>
          </div>

          {/* Section 3: ML Prediction */}
          <MLPredictionPanel
            mlConfidence={current.mlConfidence}
            mlFeatureBreakdown={current.mlFeatureBreakdown}
            severitySource={current.severitySource}
            severity={current.severity}
          />

          {/* Sections 4 & 5 side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThreatAssessment
              freqRisk={freqRisk}
              regionalRisk={regionalRisk}
              overallThreat={overallThreat}
            />
            <HealthPanel
              healthStatus={healthStatus}
              totalAlerts={totalAlerts}
              timestamp={current.timestamp}
            />
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

  // Build node list from real alert data only — one entry per unique nodeId
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
      nodeId:             alert.nodeId,
      lat:                alert.lat,
      lng:                alert.lng,
      severity:           alert.severity,
      peakFrequency:      alert.peakFrequency,
      timestamp:          alert.timestamp,
      mlConfidence:       alert.mlConfidence       ?? null,
      mlFeatureBreakdown: alert.mlFeatureBreakdown ?? null,
      severitySource:     alert.severitySource     ?? 'threshold',
    }));
  }, [alerts]);

  // Per-node alert history for graphs
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
    <div className="flex-1 overflow-y-auto alert-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Sensor Nodes</h2>
          <span className="text-xs text-slate-500">{nodes.length} nodes registered</span>
        </div>

        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">📡</div>
            <p className="text-slate-300 font-medium">No sensor data received yet</p>
            <p className="text-slate-500 text-sm mt-1">
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
  );
};

export default SensorList;
