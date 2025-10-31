import React, { createContext, useContext, useState } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  children?: React.ReactNode;
  tabs?: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  tabs,
  activeTab,
  onTabChange,
  defaultValue,
  value,
  onValueChange,
  className = "",
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultValue || ""
  );

  // Support both APIs
  const currentActiveTab = activeTab || value || internalActiveTab;

  const setActiveTab = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (value === undefined) {
      setInternalActiveTab(tab);
    }
    onValueChange?.(tab);
  };

  // If tabs prop is provided, render simple tab interface
  if (tabs) {
    return (
      <div className={className}>
        <div className="flex border-b border-[rgb(var(--color-border))]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                currentActiveTab === tab.id
                  ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                  : "text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Otherwise use context-based API
  return (
    <TabsContext.Provider value={{ activeTab: currentActiveTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = "",
}) => {
  const baseClasses =
    "inline-flex h-10 items-center justify-center rounded-lg bg-[rgb(var(--color-surface))] p-1";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses} role="tablist">
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value,
  disabled = false,
  className = "",
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-[rgb(var(--color-background))] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const activeClasses = isActive
    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] shadow-sm"
    : "text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]";

  const combinedClasses = `${baseClasses} ${activeClasses} ${className}`.trim();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      className={combinedClasses}
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value,
  className = "",
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  const baseClasses =
    "mt-2 ring-offset-[rgb(var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div
      id={`tabpanel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={combinedClasses}
    >
      {children}
    </div>
  );
};
