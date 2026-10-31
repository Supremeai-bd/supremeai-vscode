import React from "react";

export type NavTab = "chat" | "runs" | "agents" | "inbox" | "more";

const TABS: { id: NavTab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "runs", label: "Runs" },
  { id: "agents", label: "Agents" },
  { id: "inbox", label: "Inbox" },
  { id: "more", label: "More" },
];

const ICON_PATHS: Record<NavTab, string> = {
  chat: "M20 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-4.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 5a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 7 7v.4Z",
  runs: "M13 2 4.8 13h5.8L10 22l9.2-12h-5.8L13 2Z",
  agents: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0M19 8h3m-1.5-1.5v3",
  inbox: "M4 5h16v14H4zM4 13h4l1.5 2h5L16 13h4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

export interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => (
  <nav className="mobile-bottom-nav" aria-label="Primary navigation">
    {TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          className={`mobile-nav-button${isActive ? " mobile-nav-button--active" : ""}`}
          onClick={() => onSelectTab(tab.id)}
          aria-pressed={isActive}
        >
          <span className="mobile-nav-indicator" aria-hidden="true" />
          <span className="mobile-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICON_PATHS[tab.id]} />
            </svg>
          </span>
          <span className="mobile-nav-label">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);
