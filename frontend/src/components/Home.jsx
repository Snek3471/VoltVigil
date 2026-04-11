import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Small presentational sub-components
// ---------------------------------------------------------------------------

const OverviewCard = ({ icon, title, body }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col gap-3">
    <div className="text-3xl">{icon}</div>
    <h3 className="text-white font-semibold text-base">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
  </div>
);

const TeamCard = ({ role, tech, icon }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col gap-3">
    <div className="text-2xl">{icon}</div>
    <h3 className="text-white font-semibold">{role}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{tech}</p>
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col gap-1">
    <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

const Home = ({ alerts, isConnected }) => {
  const totalSensors = useMemo(() => {
    return new Set(alerts.map((a) => a.nodeId)).size;
  }, [alerts]);

  return (
    <div className="flex-1 overflow-y-auto alert-scroll">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="w-10 h-10 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h1 className="text-5xl font-extrabold tracking-tight">
              Volt<span className="text-yellow-400">Vigil</span>
            </h1>
          </div>
          <p className="text-xl text-slate-300 font-medium">
            Real-Time Power Grid Fault Detection System
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            VoltVigil monitors distributed power grid infrastructure for corona discharge anomalies
            using acoustic emission analysis. Sensor nodes continuously transmit FFT frequency data
            over WiFi, allowing operators to detect and respond to grid faults in real time —
            before cascading failures trigger outages.
          </p>
        </section>

        {/* ── Project Overview ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 border-b border-[#334155] pb-2">
            Project Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OverviewCard
              icon="🔌"
              title="What It Detects"
              body="Corona discharge anomalies in power transmission lines. These discharges produce characteristic acoustic emissions that indicate insulation degradation, conductor damage, or dangerously high electric field concentrations — all early-warning signs of grid failure."
            />
            <OverviewCard
              icon="📡"
              title="How It Works"
              body="ESP32 microcontrollers paired with INMP441 MEMS microphones sample audio at 8 kHz. Each node applies a 512-sample Hamming-windowed FFT, identifies the peak frequency bin, classifies it by severity, and transmits a structured alert to the backend over WiFi."
            />
            <OverviewCard
              icon="🗺️"
              title="How to Read the Map"
              body="Each circle marker represents one physical sensor node. Marker color indicates the most recent fault severity: green = low, yellow = medium, orange = high, red = critical. Click any marker to see the node ID, peak frequency, and last-seen timestamp."
            />
          </div>
        </section>

        {/* ── Team ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 border-b border-[#334155] pb-2">
            Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TeamCard
              icon="💻"
              role="Frontend & Backend"
              tech="React dashboard, Node.js REST API, Socket.io real-time events, MongoDB persistence, Leaflet map, Recharts FFT visualization"
            />
            <TeamCard
              icon="⚙️"
              role="Firmware"
              tech="ESP32 microcontroller, INMP441 MEMS microphone, I2S digital audio interface, arduinoFFT library, WiFi alert transmission"
            />
            <TeamCard
              icon="🔧"
              role="Hardware"
              tech="Circuit design and PCB layout, weatherproof sensor housing, power management and battery backup, field deployment and mounting"
            />
          </div>
        </section>

        {/* ── System Status ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 border-b border-[#334155] pb-2">
            System Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Sensors Online"
              value={totalSensors}
              accent="text-blue-400"
            />
            <StatCard
              label="Alerts Logged"
              value={alerts.length}
              accent="text-yellow-400"
            />
            <StatCard
              label="Backend Connection"
              value={isConnected ? 'Connected' : 'Disconnected'}
              accent={isConnected ? 'text-green-400' : 'text-red-400'}
            />
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
