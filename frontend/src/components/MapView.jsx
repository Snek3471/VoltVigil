import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon broken-image bug in Vite/webpack bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { simulatedNodes } from '../data/simulatedNodes';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLOR = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#6b7280',
};

const createNodeIcon = (severity) => {
  const color = SEVERITY_COLOR[severity] || SEVERITY_COLOR.unknown;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px;
      height: 16px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 6px ${color};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const formatCoord = (lat, lng) => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
};

const formatTimestamp = (ts) =>
  new Date(ts).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

// ---------------------------------------------------------------------------
// Build node map from alerts (most recent alert wins per nodeId)
// ---------------------------------------------------------------------------

const buildNodeMap = (alerts) => {
  const map = {};
  alerts.forEach((alert) => {
    const existing = map[alert.nodeId];
    if (!existing || new Date(alert.timestamp) > new Date(existing.timestamp)) {
      map[alert.nodeId] = {
        nodeId: alert.nodeId,
        lat: alert.lat,
        lng: alert.lng,
        severity: alert.severity,
        peakFrequency: alert.peakFrequency,
        timestamp: alert.timestamp,
      };
    }
  });
  return map;
};

// ---------------------------------------------------------------------------
// Sub-component: auto-fit map bounds whenever the node list changes
// ---------------------------------------------------------------------------

const BoundsUpdater = ({ nodes }) => {
  const map = useMap();

  useEffect(() => {
    if (nodes.length === 0) return;
    const latLngs = nodes.map((n) => [n.lat, n.lng]);
    try {
      map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 10 });
    } catch {
      // ignore edge cases where map isn't ready yet
    }
  }, [nodes, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// ---------------------------------------------------------------------------
// MapView
// ---------------------------------------------------------------------------

const MapView = ({ alerts, liveAlert }) => {
  // nodeMap: nodeId -> { nodeId, lat, lng, severity, peakFrequency, timestamp }
  // Initialized from fetched alerts; falls back to simulated nodes when empty.
  const [nodeMap, setNodeMap] = useState(() => {
    const fromAlerts = buildNodeMap([]);
    if (Object.keys(fromAlerts).length > 0) return fromAlerts;
    // seed with simulated nodes
    const sim = {};
    simulatedNodes.forEach((n) => {
      sim[n.nodeId] = { ...n, timestamp: new Date().toISOString() };
    });
    return sim;
  });

  // Sync when the full alerts array arrives / changes
  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    const realMap = buildNodeMap(alerts);
    setNodeMap((prev) => {
      // Merge: real data overrides simulated nodes for the same nodeId,
      // simulated nodes that have no real counterpart are kept.
      const merged = { ...prev };
      Object.entries(realMap).forEach(([id, node]) => {
        merged[id] = node;
      });
      return merged;
    });
  }, [alerts]);

  // Apply a single live alert without waiting for a full re-fetch
  useEffect(() => {
    if (!liveAlert) return;
    setNodeMap((prev) => {
      const existing = prev[liveAlert.nodeId];
      // Only update if this alert is newer than what we already have
      if (
        existing &&
        new Date(liveAlert.timestamp) <= new Date(existing.timestamp)
      ) {
        return prev;
      }
      return {
        ...prev,
        [liveAlert.nodeId]: {
          nodeId: liveAlert.nodeId,
          lat: liveAlert.lat,
          lng: liveAlert.lng,
          severity: liveAlert.severity,
          peakFrequency: liveAlert.peakFrequency,
          timestamp: liveAlert.timestamp,
        },
      };
    });
  }, [liveAlert]);

  const nodes = useMemo(() => Object.values(nodeMap), [nodeMap]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[#334155]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <BoundsUpdater nodes={nodes} />

        {nodes.map((node) => {
          const icon = createNodeIcon(node.severity);
          return (
            <Marker
              key={node.nodeId}
              position={[node.lat, node.lng]}
              icon={icon}
            >
              <Popup minWidth={200}>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', lineHeight: '1.6' }}>
                  <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                    {node.nodeId}
                  </p>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', paddingRight: '8px' }}>Severity</td>
                        <td>
                          <span style={{
                            color: '#fff',
                            background: SEVERITY_COLOR[node.severity] || SEVERITY_COLOR.unknown,
                            padding: '1px 7px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {node.severity}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingRight: '8px' }}>Peak Frequency</td>
                        <td style={{ fontWeight: 600 }}>
                          {typeof node.peakFrequency === 'number'
                            ? `${node.peakFrequency.toFixed(1)} Hz`
                            : `${node.peakFrequency} Hz`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingRight: '8px' }}>Last Seen</td>
                        <td>{formatTimestamp(node.timestamp)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', paddingRight: '8px' }}>Coordinates</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatCoord(node.lat, node.lng)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
