import { useEffect, useRef } from 'react';

const SEVERITY_STYLES = {
  critical: {
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
    card: 'border-l-red-500',
    dot: 'bg-red-500',
  },
  high: {
    badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    card: 'border-l-orange-500',
    dot: 'bg-orange-500',
  },
  medium: {
    badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    card: 'border-l-yellow-500',
    dot: 'bg-yellow-500',
  },
  low: {
    badge: 'bg-green-500/20 text-green-400 border border-green-500/30',
    card: 'border-l-green-500',
    dot: 'bg-green-500',
  },
};

const MAX_ALERTS = 50;

const AlertCard = ({ alert }) => {
  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;

  return (
    <div
      className={`bg-[#1e293b] border border-[#334155] border-l-4 ${styles.card} rounded-lg p-3 flex flex-col gap-1 hover:bg-[#263348] transition-colors`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-semibold text-sm">{alert.nodeId}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles.badge}`}
        >
          {alert.severity}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>
          <span className="text-slate-300 font-medium">
            {alert.peakFrequency.toFixed(1)} Hz
          </span>{' '}
          peak freq
        </span>
        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="text-xs text-slate-500">
        {new Date(alert.timestamp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </div>
  );
};

const AlertFeed = ({ alerts, loading, error }) => {
  const topRef = useRef(null);

  // Scroll to top when new alerts arrive
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  const displayed = alerts.slice(0, MAX_ALERTS);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Alert Feed
        </h2>
        <span className="text-xs text-slate-500">
          {displayed.length} / {MAX_ALERTS} max
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3 mb-3">
          Failed to load alerts: {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading alerts…
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          No alerts yet. Waiting for sensor data…
        </div>
      ) : (
        <div
          ref={topRef}
          className="flex-1 overflow-y-auto alert-scroll flex flex-col gap-2 pr-1"
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
