import { useState } from "react";
import { ShaderAnimation } from './ui/shader-animation';
import { AnimatedText } from '@/components/ui/animated-text';
import { TextScramble } from '@/components/ui/text-scramble';

const Home = ({ onTabChange }) => {
  const [scrambleTrigger, setScrambleTrigger] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Shader animation — full background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45 z-10" />

      {/* Hero content — fully centered */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-8">

        {/* Main title with scramble effect */}
        <div
          onMouseEnter={() => {
            if (!isComplete) return;
            setIsComplete(false);
            setScrambleTrigger(false);
            setTimeout(() => setScrambleTrigger(true), 50);
          }}
          className="cursor-default mb-6"
        >
          <TextScramble
            as="h1"
            duration={1.5}
            speed={0.05}
            characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
            trigger={scrambleTrigger}
            onScrambleComplete={() => setIsComplete(true)}
            className="text-[9rem] font-black leading-none tracking-tighter text-white font-mono"
            style={{ fontWeight: 900 }}
          >
            TeleGrid.
          </TextScramble>
        </div>

        {/* Animated tagline */}
        <div className="mb-12">
          <AnimatedText
            text="No Surprises."
            duration={0.08}
            delay={0.15}
            textClassName="text-5xl font-semibold text-blue-300"
            underlineGradient="from-blue-400 via-violet-500 to-purple-500"
            underlineHeight="h-[3px]"
            underlineOffset="-bottom-3"
          />
        </div>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onTabChange('map')}
            className="px-10 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full transition-all duration-200 text-sm tracking-wider uppercase shadow-lg shadow-blue-500/30"
          >
            View Map
          </button>
          <button
            onClick={() => onTabChange('about')}
            className="px-10 py-3.5 border border-white/30 hover:border-white/60 text-white font-medium rounded-full transition-all duration-200 text-sm tracking-wider uppercase backdrop-blur-sm"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Scroll indicator — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="w-5 h-8 border border-white/30 rounded-full flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>

    </div>
  );
};

export default Home;
