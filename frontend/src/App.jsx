import './App.css';
import { Suspense, lazy } from 'react';
import { useAlertSocket } from './hooks/useAlertSocket';
import AlertFeed from './components/AlertFeed';
import FFTChart from './components/FFTChart';

// Lazy-load Leaflet map so it only runs in the browser (no SSR issues)
const SensorMap = lazy(() => import('./components/SensorMap'));

export default function App() {
  const { alerts, connected } = useAlertSocket();

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="header">
        <span className="header__title">⚡ VoltVigil – Power Grid Monitor</span>
        <div className="header__status">
          <div className={`status-dot ${connected ? 'status-dot--connected' : ''}`} />
          {connected ? 'Live' : 'Connecting…'}
          {alerts.length > 0 && (
            <span style={{ color: '#f85149', fontWeight: 600 }}>
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* ── Map ── */}
      <div className="panel panel--map">
        <div className="map-wrapper">
          <span className="panel__title">Sensor Network</span>
          <Suspense fallback={<div style={{ color: '#8b949e', padding: 24 }}>Loading map…</div>}>
            <SensorMap liveAlerts={alerts} />
          </Suspense>
        </div>
      </div>

      {/* ── FFT Chart ── */}
      <div className="panel panel--chart">
        <div className="panel__title">Live FFT – Peak Frequency (100–2000 Hz band)</div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <FFTChart alerts={alerts} />
        </div>
      </div>

      {/* ── Alert Feed ── */}
      <div className="panel panel--feed">
        <div className="panel__title">Recent Alerts</div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <AlertFeed alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
