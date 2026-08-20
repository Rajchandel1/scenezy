'use client';

interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, activeTab, onTabChange, className = '' }: FilterTabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === tab.id
              ? 'bg-[#c4f000] text-black shadow-lg shadow-[#c4f000]/20'
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-black/20' : 'bg-neutral-800'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
