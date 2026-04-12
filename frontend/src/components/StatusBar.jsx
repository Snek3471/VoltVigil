const StatusBar = ({ isConnected, alertCount }) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1e293b] border-b border-[#334155] shadow-[0_2px_16px_rgba(0,0,0,0.4)] z-10 flex-shrink-0">
      {/* Logo / Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-[15px] font-bold tracking-wide text-white leading-none">
            Tele<span className="text-yellow-400">Grid</span>
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:block tracking-widest uppercase leading-none">
            Power Grid Fault Detection
          </span>
        </div>
      </div>

      {/* Right side stats */}
      <div className="flex items-center gap-4">
        {/* Alert count */}
        <div className="hidden sm:flex flex-col items-end leading-none gap-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total Alerts</span>
          <span className="text-lg font-bold text-white tabular-nums leading-none">{alertCount}</span>
        </div>

        <div className="w-px h-7 bg-[#334155] hidden sm:block" />

        {/* Connection status pill */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 border text-xs font-semibold transition-colors ${
            isConnected
              ? 'bg-green-500/10 border-green-500/25 text-green-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isConnected
                ? 'bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse'
                : 'bg-red-500 shadow-[0_0_6px_#ef4444]'
            }`}
          />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>
    </header>
  );
};

export default StatusBar;
