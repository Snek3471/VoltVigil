const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'map', label: 'Map' },
  { id: 'sensors', label: 'Sensors' },
];

const TabNav = ({ activeTab, onTabChange }) => (
  <nav className="bg-[#0f172a] border-b border-[#334155] px-4">
    <div className="flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${
            activeTab === tab.id
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  </nav>
);

export default TabNav;
