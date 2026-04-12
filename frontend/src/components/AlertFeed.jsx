import { useEffect, useRef } from 'react';

const SEVERITY_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

const SEVERITY_BADGE = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  low:      'bg-green-500/20 text-green-300 border border-green-500/30',
};

const MAX_ALERTS = 50;

const AlertCard = ({ alert }) => {
  const accentColor = SEVERITY_COLOR[alert.severity] || SEVERITY_COLOR.low;
  const badgeCls    = SEVERITY_BADGE[alert.severity] || SEVERITY_BADGE.low;

  const time = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = new Date(alert.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 bg-[#1e293b] border border-[#334155] rounded-xl hover:border-[#475569] transition-all duration-200"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-[#f8fafc] font-mono font-semibold text-sm truncate">
            {alert.nodeId}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex-shrink-0 ${badgeCls}`}>
            {alert.severity}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#94a3b8] font-mono text-xs">
            {alert.peakFrequency?.toFixed(1)} Hz
          </span>
          <span className="text-[#475569] text-xs font-mono tabular-nums">
            {date} · {time}
          </span>
        </div>
      </div>

      {(alert.lat != null && alert.lng != null) && (
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#475569] font-mono">
            {alert.lat.toFixed(2)}° N
          </p>
          <p className="text-xs text-[#475569] font-mono">
            {Math.abs(alert.lng).toFixed(2)}° W
          </p>
        </div>
      )}
    </div>
  );
};

const AlertFeed = ({ alerts, loading, error }) => {
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  const displayed = alerts.slice(0, MAX_ALERTS);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#334155]">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-[#475569]">
          Alert Feed
        </h2>
        <span className="text-xs text-[#475569] font-mono tabular-nums">
          {displayed.length} / {MAX_ALERTS}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
          Failed to load alerts: {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#475569] text-sm">
          Loading alerts…
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-2xl opacity-30">📡</span>
          <span className="text-[#475569] text-sm">Waiting for sensor data…</span>
        </div>
      ) : (
        <div
          ref={topRef}
          className="flex-1 overflow-y-auto alert-scroll flex flex-col gap-2 pr-0.5"
        >
          {displayed.map((alert) => (
            <AlertCard key={alert._id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertFeed;
