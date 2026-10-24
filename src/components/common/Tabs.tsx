import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Segmented control: used for switching between modes of the same screen. */
export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div
    role="tablist"
    className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-subtle p-1 scrollbar-none ${className}`}
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors [&>svg]:h-4 [&>svg]:w-4 ${
            isActive ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && <span className="num text-xs text-faint">{tab.count}</span>}
        </button>
      );
    })}
  </div>
);
