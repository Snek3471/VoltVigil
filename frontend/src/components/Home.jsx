import { useState, useMemo } from "react";
import { ShaderAnimation } from './ui/shader-animation';
import { AnimatedText } from '@/components/ui/animated-text';
import { TextScramble } from '@/components/ui/text-scramble';
import { TeleGridGlobe } from '@/components/ui/telegrid-globe';
import { defaultSensorNodes, REAL_SENSOR_ID } from '@/data/sensorNodes';

const Home = ({ onTabChange, alerts = [] }) => {
  const [scrambleTrigger, setScrambleTrigger] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Derive sensor markers — always 4 nodes, real sensor updated from live data
  const sensorMarkers = useMemo(() => {
    const nodes = [...defaultSensorNodes];

    if (alerts && alerts.length > 0) {
      const realAlerts = alerts.filter(a => a.nodeId === REAL_SENSOR_ID);
      if (realAlerts.length > 0) {
        const latest = realAlerts.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        const idx = nodes.findIndex(n => n.nodeId === REAL_SENSOR_ID);
        if (idx !== -1) {
          nodes[idx] = {
            ...nodes[idx],
            lat:           latest.lat,
            lng:           latest.lng,
            peakFrequency: latest.peakFrequency,
            severity:      latest.severity,
          };
        }
      }
    }

    return nodes.map(n => ({
      id:            n.nodeId,
      nodeId:        n.nodeId,
      location:      [n.lat, n.lng],
      peakFrequency: n.peakFrequency,
      severity:      n.severity,
    }));
  }, [alerts]);

  const activeNodeCount = 4;

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Shader animation — full background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45 z-10" />

      {/* Split layout — left text, right globe */}
      <div className="relative z-20 flex items-center justify-between h-full px-24 gap-12">

        {/* ── LEFT — Hero text ──────────────────────────────────────── */}
        <div className="flex flex-col justify-center max-w-xl pl-16">

          {/* TeleGrid. title with scramble */}
          <div
            onMouseEnter={() => {
              if (!isComplete) return;
              setIsComplete(false);
              setScrambleTrigger(false);
              setTimeout(() => setScrambleTrigger(true), 50);
            }}
            className="cursor-default"
          >
            <TextScramble
              as="h1"
              duration={1.5}
              speed={0.05}
              characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
              trigger={scrambleTrigger}
              onScrambleComplete={() => setIsComplete(true)}
              className="text-[7rem] font-black leading-none tracking-tighter text-white font-mono mb-6"
              style={{ fontWeight: 900 }}
            >
              TeleGrid.
            </TextScramble>
          </div>

          {/* Animated tagline */}
          <div className="mb-10">
            <AnimatedText
              text="No Surprises."
              duration={0.08}
              delay={0.15}
              textClassName="text-4xl font-semibold text-blue-300"
              underlineGradient="from-blue-400 via-violet-500 to-purple-500"
              underlineHeight="h-[3px]"
              underlineOffset="-bottom-3"
            />
          </div>

          {/* Description */}
          <p className="text-lg text-[#94a3b8] leading-relaxed mb-10 max-w-md">
            Real-time acoustic emission monitoring for power grid fault detection.
            Detecting corona discharge before it becomes a blackout.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-4 mb-16">
            <button
              onClick={() => onTabChange('map')}
              className="px-10 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold
                         rounded-full transition-all duration-200 text-sm tracking-wider
                         uppercase shadow-lg shadow-blue-500/30"
            >
              View Map
            </button>
            <button
              onClick={() => onTabChange('about')}
              className="px-10 py-3.5 border border-white/30 hover:border-white/60 text-white
                         font-medium rounded-full transition-all duration-200 text-sm
                         tracking-wider uppercase backdrop-blur-sm"
            >
              Learn More
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
            </div>
            <span className="text-xs text-[#475569] uppercase tracking-widest">
              Explore Dashboard
            </span>
          </div>

        </div>

        {/* ── RIGHT — Interactive Globe ─────────────────────────────── */}
        <div className="flex flex-col items-center justify-center w-[520px] flex-shrink-0">

          {/* Label */}
          <p className="text-xs text-[#475569] uppercase tracking-widest mb-6">
            Live Sensor Network
          </p>

          {/* Globe */}
          <TeleGridGlobe
            sensors={sensorMarkers}
            className="w-[460px] h-[460px]"
            speed={0.003}
          />

          {/* Stats row below globe */}
          <div className="flex items-center gap-8 mt-20">
            <div className="text-center">
              <p className="text-2xl font-black font-mono text-[#f8fafc]">
                {activeNodeCount}
              </p>
              <p className="text-xs text-[#475569] uppercase tracking-wider mt-1">
                Active Nodes
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black font-mono text-blue-400">8kHz</p>
              <p className="text-xs text-[#475569] uppercase tracking-wider mt-1">
                Sample Rate
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black font-mono text-green-400">Live</p>
              <p className="text-xs text-[#475569] uppercase tracking-wider mt-1">
                Data Stream
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
