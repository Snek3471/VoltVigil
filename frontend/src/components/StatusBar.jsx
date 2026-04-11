const StatusBar = ({ isConnected, alertCount }) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1e293b] border-b border-[#334155] shadow-md">
      {/* Logo / Name */}
      <div className="flex items-center gap-3">
        <svg
          className="w-7 h-7 text-yellow-400"
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
        <span className="text-xl font-bold tracking-wide text-white">
          Volt<span className="text-yellow-400">Vigil</span>
        </span>
        <span className="text-xs text-slate-400 hidden sm:block">
          Power Grid Fault Detection
        </span>
      </div>

      {/* Right side stats */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-slate-400">
          Total Alerts:{' '}
          <span className="text-white font-semibold">{alertCount}</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? 'bg-green-500 shadow-[0_0_6px_#22c55e]'
                : 'bg-red-500 shadow-[0_0_6px_#ef4444]'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default StatusBar;
