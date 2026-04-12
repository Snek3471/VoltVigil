import { useEffect, useRef } from 'react';

const SEVERITY_STYLES = {
  critical: {
    badge: 'bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]',
    card: 'border-l-red-500',
    glow: 'shadow-[inset_0_0_0_0_transparent]',
  },
  high: {
    badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]',
    card: 'border-l-orange-500',
    glow: '',
  },
  medium: {
    badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40',
    card: 'border-l-yellow-500',
    glow: '',
  },
  low: {
    badge: 'bg-green-500/15 text-green-400 border border-green-500/40',
    card: 'border-l-green-500',
    glow: '',
  },
};

const MAX_ALERTS = 50;

const AlertCard = ({ alert }) => {
  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
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
      className={`bg-[#1e293b] border border-[#2d3f55] border-l-[3px] ${styles.card} rounded-lg p-3.5 flex flex-col gap-2 hover:bg-[#243247] transition-colors duration-150`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-bold text-sm font-mono tracking-wide">{alert.nodeId}</span>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded capitalize tracking-wider ${styles.badge}`}>
          {alert.severity}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono">
          <span className="text-slate-100 font-semibold">{alert.peakFrequency.toFixed(1)}</span>
          <span className="text-slate-500 text-xs ml-1">Hz</span>
        </span>
        <span className="text-slate-500 text-xs tabular-nums">
          {date} · {time}
        </span>
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
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#334155]">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Alert Feed
        </h2>
        <span className="text-[11px] text-slate-600 tabular-nums">
          {displayed.length} / {MAX_ALERTS}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
          Failed to load alerts: {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
          Loading alerts…
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-2xl opacity-30">📡</span>
          <span className="text-slate-600 text-sm">Waiting for sensor data…</span>
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
