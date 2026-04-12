import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Presentational sub-components
// ---------------------------------------------------------------------------

const OVERVIEW_ACCENTS = ['border-blue-500/40', 'border-yellow-500/40', 'border-purple-500/40'];
const OVERVIEW_ICON_BG = ['bg-blue-500/10 text-blue-400', 'bg-yellow-500/10 text-yellow-400', 'bg-purple-500/10 text-purple-400'];

const OverviewCard = ({ icon, title, body, index = 0 }) => (
  <div className={`bg-[#1e293b] border border-[#334155] border-t-2 ${OVERVIEW_ACCENTS[index % OVERVIEW_ACCENTS.length]} rounded-xl p-5 flex flex-col gap-4 hover:bg-[#243247] transition-colors duration-150`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${OVERVIEW_ICON_BG[index % OVERVIEW_ICON_BG.length]}`}>
      {icon}
    </div>
    <div className="flex flex-col gap-2">
      <h3 className="text-white font-semibold text-sm">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
    </div>
  </div>
);

const TEAM_ACCENTS = ['border-cyan-500/40', 'border-orange-500/40', 'border-emerald-500/40'];
const TEAM_ICON_BG = ['bg-cyan-500/10 text-cyan-400', 'bg-orange-500/10 text-orange-400', 'bg-emerald-500/10 text-emerald-400'];

const TeamCard = ({ role, tech, icon, index = 0 }) => (
  <div className={`bg-[#1e293b] border border-[#334155] border-t-2 ${TEAM_ACCENTS[index % TEAM_ACCENTS.length]} rounded-xl p-5 flex flex-col gap-4 hover:bg-[#243247] transition-colors duration-150`}>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${TEAM_ICON_BG[index % TEAM_ICON_BG.length]}`}>
      {icon}
    </div>
    <div className="flex flex-col gap-1.5">
      <h3 className="text-white font-semibold text-sm">{role}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{tech}</p>
    </div>
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col gap-2 hover:bg-[#243247] transition-colors duration-150">
    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-3xl font-bold tabular-nums leading-none ${accent ?? 'text-white'}`}>{value}</p>
  </div>
);

const SectionHeading = ({ children }) => (
  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-[#334155] pb-2.5">
    {children}
  </h2>
);

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

const About = ({ alerts, isConnected }) => {
  const totalSensors = useMemo(() => {
    return new Set(alerts.map((a) => a.nodeId)).size;
  }, [alerts]);

  return (
    <div className="flex-1 overflow-y-auto alert-scroll">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* ── Project Overview ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading>Project Overview</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OverviewCard
              index={0}
              icon="🔌"
              title="What It Detects"
              body="Corona discharge anomalies in power transmission lines. These discharges produce characteristic acoustic emissions that indicate insulation degradation, conductor damage, or dangerously high electric field concentrations — all early-warning signs of grid failure."
            />
            <OverviewCard
              index={1}
              icon="📡"
              title="How It Works"
              body="ESP32 microcontrollers paired with INMP441 MEMS microphones sample audio at 8 kHz. Each node applies a 512-sample Hamming-windowed FFT, identifies the peak frequency bin, classifies it by severity, and transmits a structured alert to the backend over WiFi."
            />
            <OverviewCard
              index={2}
              icon="🗺️"
              title="How to Read the Map"
              body="Each circle marker represents one physical sensor node. Marker color indicates the most recent fault severity: green = low, yellow = medium, orange = high, red = critical. Click any marker to see the node ID, peak frequency, and last-seen timestamp."
            />
          </div>
        </section>

        {/* ── Team ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading>Team</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TeamCard
              index={0}
              icon="💻"
              role="Frontend & Backend"
              tech="React dashboard, Node.js REST API, Socket.io real-time events, MongoDB persistence, Leaflet map, Recharts FFT visualization"
            />
            <TeamCard
              index={1}
              icon="⚙️"
              role="Firmware"
              tech="ESP32 microcontroller, INMP441 MEMS microphone, I2S digital audio interface, arduinoFFT library, WiFi alert transmission"
            />
            <TeamCard
              index={2}
              icon="🔧"
              role="Hardware"
              tech="Circuit design and PCB layout, weatherproof sensor housing, power management and battery backup, field deployment and mounting"
            />
          </div>
        </section>

        {/* ── System Status ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading>System Status</SectionHeading>
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

export default About;
