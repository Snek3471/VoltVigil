import { useMemo } from 'react';
import { DitheringShader } from '@/components/ui/dithering-shader';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionHeading = ({ children }) => (
  <div className="relative mb-6">
    {/* Subtle wave line divider */}
    <div className="h-px w-full opacity-30 mb-6 overflow-hidden">
      <DitheringShader
        shape="wave"
        type="8x8"
        colorBack="#000000"
        colorFront="#3b82f6"
        pxSize={2}
        speed={0.8}
        width={1920}
        height={4}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
    <h2 className="text-xs font-semibold tracking-widest uppercase text-[#475569]">
      {children}
    </h2>
  </div>
);

const OverviewCard = ({ icon, title, body }) => (
  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#3b82f6]/40 transition-all duration-200">
    <div className="text-2xl mb-3">{icon}</div>
    <h3 className="text-[#f8fafc] font-semibold mb-2">{title}</h3>
    <p className="text-sm text-[#94a3b8] leading-relaxed">{body}</p>
  </div>
);

const TEAM_ACCENTS = [
  { bg: 'bg-blue-500/20',    border: 'border-blue-500/30',    text: 'text-blue-300'    },
  { bg: 'bg-cyan-500/20',    border: 'border-cyan-500/30',    text: 'text-cyan-300'    },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
];

const TeamCard = ({ number, role, subtitle, tech, index = 0 }) => {
  const accent = TEAM_ACCENTS[index % TEAM_ACCENTS.length];
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#3b82f6]/40 transition-all duration-200">
      <div
        className={`w-10 h-10 rounded-full ${accent.bg} border ${accent.border} flex items-center justify-center mb-4`}
      >
        <span className={`${accent.text} font-mono font-bold text-sm`}>{number}</span>
      </div>
      <h3 className="text-[#f8fafc] font-semibold mb-1">{role}</h3>
      <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">{subtitle}</p>
      <p className="text-sm text-[#94a3b8] leading-relaxed">{tech}</p>
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="relative overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-[#3b82f6]/40 transition-all duration-200">
    {/* Mini wave shader per card */}
    <div className="absolute inset-0 opacity-15 pointer-events-none">
      <DitheringShader
        shape="wave"
        type="4x4"
        colorBack="#000820"
        colorFront="#3b82f6"
        pxSize={4}
        speed={0.4}
        width={400}
        height={120}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
    <div className="relative z-10">
      <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-black font-mono leading-none ${accent ?? 'text-[#f8fafc]'}`}>
        {value}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

const About = ({ alerts, isConnected }) => {
  const totalSensors = useMemo(() => {
    return new Set(alerts.map((a) => a.nodeId)).size;
  }, [alerts]);

  return (
    <div className="relative min-h-[calc(100vh-60px)] bg-[#0f172a] flex flex-col">

      {/* Wave shader — full page fixed background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
        <DitheringShader
          shape="wave"
          type="8x8"
          colorBack="#001122"
          colorFront="#0088ff"
          pxSize={4}
          speed={0.5}
          width={1920}
          height={1080}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* All content relative z-10 */}
      <div className="relative z-10 flex flex-col flex-1">

        {/* Page header with shader accent */}
        <div className="relative px-8 py-10 border-b border-white/10 overflow-hidden flex-shrink-0">

          {/* Accent shader behind header only — more visible */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <DitheringShader
              shape="wave"
              type="4x4"
              colorBack="#000820"
              colorFront="#3b82f6"
              pxSize={3}
              speed={0.6}
              width={1920}
              height={200}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Header text */}
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              About VoltVigil
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              No Surprises. — Real-time power grid fault detection
            </p>
          </div>

        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto alert-scroll">
          <div className="p-8 space-y-8 max-w-6xl mx-auto">

            {/* ── Project Overview ─────────────────────────────────────── */}
            <div>
              <SectionHeading>Project Overview</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OverviewCard
                  icon="🔌"
                  title="What It Detects"
                  body="Corona discharge anomalies in power transmission lines. These discharges produce characteristic acoustic emissions that indicate insulation degradation, conductor damage, or dangerously high electric field concentrations — all early-warning signs of grid failure."
                />
                <OverviewCard
                  icon="📡"
                  title="How It Works"
                  body="ESP32 microcontrollers paired with INMP441 MEMS microphones sample audio at 16 kHz. Each node applies a 1024-sample Hann-windowed FFT, identifies the peak frequency bin, classifies it by severity, and transmits a structured alert to the backend over WiFi."
                />
                <OverviewCard
                  icon="🗺️"
                  title="How to Read the Map"
                  body="Each circle marker represents one physical sensor node. Marker color indicates the most recent fault severity: green = low, yellow = medium, orange = high, red = critical. Click any marker to see the node ID, peak frequency, and last-seen timestamp."
                />
              </div>
            </div>

            {/* ── Team ─────────────────────────────────────────────────── */}
            <div>
              <SectionHeading>Team</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TeamCard
                  index={0}
                  number="01"
                  role="Frontend & Backend"
                  subtitle="Full Stack"
                  tech="React dashboard, Node.js REST API, Socket.io real-time events, MongoDB persistence, MapLibre GL map, Recharts FFT visualization"
                />
                <TeamCard
                  index={1}
                  number="02"
                  role="Firmware"
                  subtitle="Embedded Systems"
                  tech="ESP32 microcontroller, INMP441 MEMS microphone, I2S digital audio interface, arduinoFFT library, WiFi alert transmission"
                />
                <TeamCard
                  index={2}
                  number="03"
                  role="Hardware"
                  subtitle="Electrical Engineering"
                  tech="Circuit design and PCB layout, weatherproof sensor housing, power management and battery backup, field deployment and mounting"
                />
              </div>
            </div>

            {/* ── System Status ─────────────────────────────────────────── */}
            <div>
              <SectionHeading>System Status</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Sensors Online"
                  value={totalSensors}
                  accent="text-blue-400"
                />
                <StatCard
                  label="Total Alerts"
                  value={alerts.length}
                  accent="text-[#f8fafc]"
                />
                <StatCard
                  label="Backend"
                  value={isConnected ? 'Live' : 'Down'}
                  accent={isConnected ? 'text-green-400' : 'text-red-400'}
                />
                <StatCard
                  label="Detection Range"
                  value="2kHz"
                  accent="text-blue-400"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
