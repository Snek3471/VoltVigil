const TABS = [
  { id: 'home',          label: 'Home'          },
  { id: 'map',           label: 'Map'           },
  { id: 'sensors',       label: 'Sensors'       },
  { id: 'notifications', label: 'Notifications' },
  { id: 'about',         label: 'About'         },
];

const TabNav = ({ activeTab, onTabChange, alertCount, isConnected, overlay = false }) => (
  <nav
    className={`flex items-center justify-between px-10 py-5 ${
      overlay
        ? 'absolute top-0 left-0 right-0 z-30 bg-black/50 backdrop-blur-md border-b border-white/10'
        : 'relative w-full border-b border-gray-800 bg-[#0f172a] flex-shrink-0'
    }`}
  >
    {/* Left — wordmark */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-white font-black text-xl tracking-tight select-none">
VOLT<span className="text-blue-300">VIGIL</span>
      </span>
    </div>

    {/* Center — navigation tabs */}
    <div className="flex items-center gap-8">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`text-sm font-semibold tracking-widest uppercase transition-all duration-200 px-2 py-1 focus:outline-none ${
            activeTab === tab.id
              ? 'text-white border-b-2 border-blue-400 pb-0.5'
              : 'text-gray-300 hover:text-white hover:border-b-2 hover:border-white/30 pb-0.5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Right — live status pill + alert count */}
    <div className="flex items-center gap-3 flex-shrink-0">
      <span className="text-gray-400 text-xs tracking-wider">
        ALERTS:{' '}
        <span className="text-white font-mono font-bold tabular-nums">{alertCount ?? 0}</span>
      </span>
      <div
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          isConnected
            ? 'bg-blue-500/30 border-blue-400/70 text-blue-200'
            : 'bg-red-500/30 border-red-400/70 text-red-200'
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isConnected ? 'bg-blue-400 animate-pulse' : 'bg-red-400'
          }`}
        />
        {isConnected ? 'LIVE' : 'OFFLINE'}
      </div>
    </div>
  </nav>
);

export default TabNav;
