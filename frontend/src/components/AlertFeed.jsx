const SEV_COLOR = {
  low:      '#3fb950',
  medium:   '#d29922',
  high:     '#f85149',
  critical: '#ff7b72',
};

/**
 * Scrollable feed of recent fault alerts.
 * @param {Array} alerts – array of alert objects (newest first)
 */
export default function AlertFeed({ alerts = [] }) {
  if (alerts.length === 0) {
    return (
      <div style={emptyStyle}>
        No alerts yet – waiting for sensor data…
      </div>
    );
  }

  return (
    <ul style={listStyle}>
      {alerts.map((alert, i) => (
        <li key={alert._id ?? i} style={itemStyle}>
          <div style={headerStyle}>
            <span style={{ color: SEV_COLOR[alert.severity] ?? '#c9d1d9', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>
              {alert.severity}
            </span>
            <span style={{ color: '#8b949e', fontSize: 11 }}>
              {new Date(alert.timestamp).toLocaleString()}
            </span>
          </div>
          <div style={bodyStyle}>
            <span style={{ color: '#c9d1d9' }}>{alert.nodeId}</span>
            <span style={{ color: '#8b949e' }}>·</span>
            <span style={{ color: '#58a6ff' }}>{alert.peakFrequency} Hz</span>
            <span style={{ color: '#8b949e', fontSize: 11 }}>
              ({alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)})
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const listStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  overflowY: 'auto',
  maxHeight: '100%',
};

const itemStyle = {
  padding: '8px 12px',
  borderRadius: 6,
  background: '#1c2333',
  border: '1px solid #30363d',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 4,
};

const bodyStyle = {
  display: 'flex',
  gap: 8,
  alignItems: 'baseline',
  fontSize: 13,
};

const emptyStyle = {
  color: '#8b949e',
  fontSize: 13,
  padding: '24px 0',
  textAlign: 'center',
};
