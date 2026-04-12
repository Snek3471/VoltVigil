import { useState, useEffect, useCallback } from 'react';
import TabNav from './components/TabNav';
import Home from './components/Home';
import About from './components/About';
import MapView from './components/MapView';
import SensorList from './components/SensorList';
import Notifications from './components/Notifications';
import GlobalThermalCursor from './components/GlobalThermalCursor';
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
      const data = res.data;
      setAlerts(Array.isArray(data) ? data : []);
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

  // Handle new_alert (prepend) and alert_updated (replace) from Socket.io
  useEffect(() => {
    if (!latestAlert) return;
    setAlerts((prev) => {
      const existingIndex = prev.findIndex((a) => a._id === latestAlert._id);
      if (existingIndex !== -1) {
        // alert_updated — replace in-place with ML-enriched version
        const updated = [...prev];
        updated[existingIndex] = latestAlert;
        return updated;
      }
      // new_alert — prepend
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
        <Home onTabChange={setActiveTab} alerts={alerts} isConnected={isConnected} />
        {/* Cursor — last child, floats above everything via z-index:9999 */}
        <GlobalThermalCursor />
      </div>
    );
  }

  // ── All other tabs: TabNav sits as a solid header, content below
  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
      <TabNav {...tabNavProps} overlay={false} />

      {/* ── Map tab ──────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="flex-1 min-h-0">
          <MapView alerts={alerts} />
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

      {/* Cursor — last child, floats above everything via z-index:9999 */}
      <GlobalThermalCursor />
    </div>
  );
};

export default App;
