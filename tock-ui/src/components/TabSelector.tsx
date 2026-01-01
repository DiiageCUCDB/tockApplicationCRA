import React from 'react';

interface TabSelectorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="flex justify-center items-center gap-2 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-slate-700 text-white shadow-lg'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
