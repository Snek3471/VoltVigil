import { useState, useEffect, useCallback } from 'react';
import StatusBar from './components/StatusBar';
import TabNav from './components/TabNav';
import Home from './components/Home';
import MapView from './components/MapView';
import FFTChart from './components/FFTChart';
import AlertFeed from './components/AlertFeed';
import SensorList from './components/SensorList';
import useSocket from './hooks/useSocket';
import { getAlerts } from './services/api';

const MAX_ALERTS = 50;

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isConnected, latestAlert } = useSocket();

  // Initial fetch
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
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

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
      <StatusBar isConnected={isConnected} alertCount={alerts.length} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Home tab ─────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <Home alerts={alerts} isConnected={isConnected} />
      )}

      {/* ── Map tab ──────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 overflow-hidden">
          {/* Left column: Map + FFT Chart */}
          <div className="flex flex-col gap-4 min-h-0">
            <div style={{ height: '55%', minHeight: '300px' }}>
              <MapView alerts={alerts} liveAlert={latestAlert} />
            </div>
            <div
              className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col"
              style={{ height: '45%', minHeight: '220px' }}
            >
              <FFTChart alerts={alerts} />
            </div>
          </div>

          {/* Right column: Alert Feed */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex flex-col overflow-hidden">
            <AlertFeed alerts={alerts} loading={loading} error={error} />
          </div>
        </main>
      )}

      {/* ── Sensors tab ──────────────────────────────────────────────── */}
      {activeTab === 'sensors' && (
        <SensorList alerts={alerts} liveAlert={latestAlert} />
      )}
    </div>
  );
};

export default App;
