import { useState, useEffect, useCallback } from 'react';
import TabNav from './components/TabNav';
import Home from './components/Home';
import About from './components/About';
import MapView from './components/MapView';
import FFTChart from './components/FFTChart';
import AlertFeed from './components/AlertFeed';
import SensorList from './components/SensorList';
import Notifications from './components/Notifications';
import useSocket from './hooks/useSocket';
import { getAlerts, simulateAlerts } from './services/api';

const MAX_ALERTS = 50;

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const { isConnected, latestAlert } = useSocket();

  // Initial fetch
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      const apiMsg = err.response?.data?.error;
      setError(apiMsg || err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleSimulateAlerts = useCallback(async () => {
    setSimulating(true);
    setError(null);
    try {
      await simulateAlerts(8);
      await fetchAlerts();
    } catch (err) {
      const apiMsg = err.response?.data?.error;
      setError(apiMsg || err.message || 'Simulate request failed');
    } finally {
      setSimulating(false);
    }
  }, [fetchAlerts]);

  // Prepend real-time alerts from Socket.io
  useEffect(() => {
    if (!latestAlert) return;
    setAlerts((prev) => {
      const exists = prev.some((a) => a._id === latestAlert._id);
      if (exists) return prev;
      return [latestAlert, ...prev].slice(0, MAX_ALERTS);
    });
  }, [latestAlert]);

  const tabNavProps = {
    activeTab,
    onTabChange: setActiveTab,
    alertCount: alerts.length,
    isConnected,
  };

  // ── Home tab: TabNav floats as an absolute overlay over the full-screen shader
  if (activeTab === 'home') {
    return (
      <div className="relative h-screen overflow-hidden bg-black text-white">
        <TabNav {...tabNavProps} overlay={true} />
        <Home onTabChange={setActiveTab} />
      </div>
    );
  }

  // ── All other tabs: TabNav sits as a solid header, content below
  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
      <TabNav {...tabNavProps} overlay={false} />

      {/* ── Map tab ──────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Tab header bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e293b] flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Sensor Network Map</h1>
              <p className="text-sm text-[#475569] mt-0.5">Live fault detection across all deployed nodes</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSimulateAlerts}
                disabled={simulating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border border-amber-500/50 text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {simulating ? 'Simulating…' : 'Simulate alerts'}
              </button>
              {[
                { label: 'Critical', dot: 'bg-red-400' },
                { label: 'High',     dot: 'bg-orange-400' },
                { label: 'Medium',   dot: 'bg-yellow-400' },
                { label: 'Low',      dot: 'bg-green-400' },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <span className="text-xs text-[#94a3b8]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map content */}
          <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 overflow-hidden min-h-0">
            <div className="flex flex-col gap-4 min-h-0">
              <div style={{ height: '55%', minHeight: '300px' }}>
                <MapView alerts={alerts} liveAlert={latestAlert} />
              </div>
              <div
                className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col"
                style={{ height: '45%', minHeight: '220px' }}
              >
                <FFTChart alerts={alerts} />
              </div>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col overflow-hidden">
              <AlertFeed alerts={alerts} loading={loading} error={error} />
            </div>
          </main>
        </div>
      )}

      {/* ── Sensors tab ──────────────────────────────────────────────── */}
      {activeTab === 'sensors' && (
        <SensorList alerts={alerts} liveAlert={latestAlert} />
      )}

      {/* ── Notifications tab ────────────────────────────────────────── */}
      {activeTab === 'notifications' && <Notifications />}

      {/* ── About tab ────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <About alerts={alerts} isConnected={isConnected} />
      )}
    </div>
  );
};

export default App;
