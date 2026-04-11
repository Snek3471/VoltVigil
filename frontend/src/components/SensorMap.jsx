import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NODES } from '../data/nodes';

const SEVERITY_COLOR = {
  low:      '#3fb950',
  medium:   '#d29922',
  high:     '#f85149',
  critical: '#ff7b72',
};

const SEVERITY_RADIUS = {
  low:      8,
  medium:   10,
  high:     13,
  critical: 16,
};

/**
 * Leaflet map showing 12 sensor node markers, colour-coded by severity.
 * @param {Array} liveAlerts – real-time alert objects from Socket.io
 */
export default function SensorMap({ liveAlerts = [] }) {
  // Merge live alert data into node display state
  const [nodeState, setNodeState] = useState(
    () => Object.fromEntries(NODES.map((n) => [n.id, n.severity]))
  );

  useEffect(() => {
    if (liveAlerts.length === 0) return;
    const latest = liveAlerts[0];
    setNodeState((prev) => ({
      ...prev,
      [latest.nodeId]: latest.severity,
    }));
  }, [liveAlerts]);

  const nodes = useMemo(
    () => NODES.map((n) => ({ ...n, severity: nodeState[n.id] || n.severity })),
    [nodeState]
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[40.73, -73.95]}
        zoom={11}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {nodes.map((node) => (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={SEVERITY_RADIUS[node.severity] ?? 8}
            pathOptions={{
              color: SEVERITY_COLOR[node.severity] ?? '#8b949e',
              fillColor: SEVERITY_COLOR[node.severity] ?? '#8b949e',
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <strong>{node.id}</strong>
              <br />
              Severity: <strong style={{ color: SEVERITY_COLOR[node.severity] }}>
                {node.severity}
              </strong>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
