import React from "react";

export type NavTab = "home" | "chat" | "activity" | "account" | "overview" | "clients" | "approvals" | "security";
export type IconName = "home" | "chat" | "activity" | "user" | "users" | "check" | "shield" | "sparkle" | "arrow" | "arrow-up" | "chevron" | "plus" | "more" | "info" | "pulse";

export interface NavItem {
  id: NavTab;
  label: string;
  icon: IconName;
}

export interface BottomNavProps {
  activeTab: NavTab;
  items: NavItem[];
  onSelectTab: (tab: NavTab) => void;
}

const ICONS: Record<IconName, React.ReactNode> = {
  home: <><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9.5v10h5.2v-5.8h2.6v5.8h5.2v-10" /></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3.5 2v-5.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h8M8 8.5h5" /></>,
  activity: <><path d="M3 12h4l2.2-6 4.2 12 2.1-6H21" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.1 3.2-4.7 7-4.7s6.2 1.6 7 4.7" /></>,
  users: <><path d="M16 20v-1.4c0-2-1.6-3.6-3.6-3.6H7.6C5.6 15 4 16.6 4 18.6V20" /><circle cx="10" cy="8" r="3.2" /><path d="M16.4 5.2a3.2 3.2 0 0 1 0 6.2M17 15.3c1.9.5 3 1.6 3 3.4V20" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.2 2.5 2.5 5.5-5.5" /></>,
  shield: <><path d="M12 21s7.5-3.6 7.5-10V5.5L12 2.8 4.5 5.5V11c0 6.4 7.5 10 7.5 10Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  "arrow-up": <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  chevron: <><path d="m9 18 6-6-6-6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  pulse: <><path d="M3 12h4l2-5 4 10 2-5h6" /><circle cx="12" cy="12" r="9" /></>,
};

export const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {ICONS[name]}
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, items, onSelectTab }) => (
  <nav className="bottom-nav" aria-label="Main navigation">
    {items.map((item) => {
      const active = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          className="nav-item"
          aria-current={active ? "page" : undefined}
          onClick={() => onSelectTab(item.id)}
        >
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);
