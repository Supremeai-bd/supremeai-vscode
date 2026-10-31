import React, { useEffect, useRef, useState } from "react";
import { BottomNav, Icon, NavItem, NavTab } from "./components/BottomNav.js";

export type TowerHealth = "HEALTHY" | "DEGRADED" | "DOWN";
export type Persona = "customer" | "admin";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export interface MobileAppState {
  activeMissions: number;
  towerHealth: TowerHealth;
  lastTelemetryTimestamp: number;
}

export const initialMobileState: MobileAppState = {
  activeMissions: 0,
  towerHealth: "DEGRADED",
  lastTelemetryTimestamp: 0,
};

export function renderMobileStatus(state: MobileAppState = initialMobileState): string {
  return `SupremeAI Mobile Supervisor | Active Missions: ${state.activeMissions} | Health: ${state.towerHealth}`;
}

const CUSTOMER_NAV: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "activity", label: "Activity", icon: "activity" },
  { id: "account", label: "Account", icon: "user" },
];

const ADMIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "clients", label: "Clients", icon: "users" },
  { id: "approvals", label: "Approvals", icon: "check" },
  { id: "security", label: "Security", icon: "shield" },
];

const SAMPLE_ACTIVITY = [
  { title: "Task summary prepared", detail: "Workspace assistant · 12 min ago", status: "Completed" },
  { title: "Code review queued", detail: "VS Code client · 48 min ago", status: "In review" },
  { title: "Agent connection renewed", detail: "Personal workspace · Yesterday", status: "Completed" },
];

const SAMPLE_CLIENTS = [
  { initials: "VS", name: "VS Code workspace", detail: "Agent · Connected recently", status: "Active" },
  { initials: "CU", name: "Cursor workspace", detail: "Agent · Connected recently", status: "Active" },
  { initials: "CU", name: "Custom integration", detail: "Viewer · Awaiting review", status: "Pending" },
];

const SAMPLE_APPROVALS = [
  { initials: "CL", name: "Claude Desktop", detail: "New client connection · Viewer request" },
  { initials: "CU", name: "Custom integration", detail: "Tool access request · Read-only profile" },
];

const HEALTH_COPY: Record<TowerHealth, { label: string; tone: string; description: string }> = {
  HEALTHY: { label: "Connected", tone: "success", description: "The SupremeAI gateway responded successfully." },
  DEGRADED: { label: "Checking connection", tone: "warning", description: "We are checking the service connection." },
  DOWN: { label: "Connection unavailable", tone: "danger", description: "The gateway could not be reached. Your local view is still available." },
};

const isDevelopment = import.meta.env.DEV;

export const App: React.FC = () => {
  const [persona, setPersona] = useState<Persona>(() => {
    if (typeof window !== "undefined" && isDevelopment) {
      return new URLSearchParams(window.location.search).get("preview") === "admin" ? "admin" : "customer";
    }
    return "customer";
  });
  const [activeTab, setActiveTab] = useState<NavTab>(() => (persona === "admin" ? "overview" : "home"));
  const [state, setState] = useState<MobileAppState>(initialMobileState);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", content: "Welcome to SupremeAI. What would you like to work on today?" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageId = useRef(1);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | undefined;

    const checkHealth = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch("https://supremeai-primary-node.onrender.com/health", {
          method: "GET",
          cache: "no-store",
          signal: request.signal,
        });
        if (mounted) {
          setState((previous) => ({
            ...previous,
            towerHealth: response.ok ? "HEALTHY" : "DOWN",
            lastTelemetryTimestamp: Date.now(),
          }));
        }
      } catch {
        if (mounted && !request.signal.aborted) {
          setState((previous) => ({ ...previous, towerHealth: "DOWN", lastTelemetryTimestamp: Date.now() }));
        }
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);

  const selectPersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    setActiveTab(nextPersona === "admin" ? "overview" : "home");
  };

  const sendMessage = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = { id: messageId.current++, role: "user", content: text };
    const conversation = [...messages, userMessage].slice(-24);
    setMessages((previous) => [...previous, userMessage].slice(-60));
    setInput("");
    setIsSending(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch("https://supremeai-api-ulw0.onrender.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "auto",
          messages: conversation.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) throw new Error(`The gateway returned HTTP ${response.status}.`);
      const data: { choices?: Array<{ message?: { content?: string } }> } = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "The gateway returned an empty response.";
      const assistantMessage: ChatMessage = { id: messageId.current++, role: "assistant", content: reply };
      setMessages((previous) => [...previous, assistantMessage].slice(-60));
    } catch (error) {
      const message = controller.signal.aborted
        ? "The request timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "The gateway could not be reached. Please try again.";
      const assistantMessage: ChatMessage = { id: messageId.current++, role: "assistant", content: message };
      setMessages((previous) => [...previous, assistantMessage].slice(-60));
    } finally {
      window.clearTimeout(timeout);
      setIsSending(false);
    }
  };

  const navItems = persona === "admin" ? ADMIN_NAV : CUSTOMER_NAV;
  const health = HEALTH_COPY[state.towerHealth];
  const adminTab = persona === "admin";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="SupremeAI home" onClick={(event) => { event.preventDefault(); setActiveTab(adminTab ? "overview" : "home"); }}>
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">Supreme<span>AI</span></span>
        </a>
        <div className="topbar-tools">
          {isDevelopment && (
            <div className="persona-switch" role="group" aria-label="Development-only persona preview">
              <button type="button" aria-pressed={persona === "customer"} onClick={() => selectPersona("customer")}>Customer</button>
              <button type="button" aria-pressed={persona === "admin"} onClick={() => selectPersona("admin")}>Admin preview</button>
            </div>
          )}
          <button
            type="button"
            className="avatar-button"
            aria-label={adminTab ? "Open security preview" : "Open account"}
            onClick={() => setActiveTab(adminTab ? "security" : "account")}
          >
            SA
          </button>
        </div>
      </header>

      {adminTab && (
        <div className="preview-banner" role="status">
          <Icon name="shield" size={16} />
          <span>Admin preview only. Actions are disabled until secure sign-in and server authorization are connected.</span>
        </div>
      )}

      <main className="page-content" id="main-content" tabIndex={-1}>
        <div className="sample-label"><span className="sample-dot" /> Sample workspace data</div>
        {persona === "customer" && activeTab === "home" && <CustomerHome health={health} onOpenChat={() => setActiveTab("chat")} onOpenActivity={() => setActiveTab("activity")} />}
        {persona === "customer" && activeTab === "chat" && <ChatScreen messages={messages} input={input} isSending={isSending} onInput={setInput} onSend={sendMessage} />}
        {persona === "customer" && activeTab === "activity" && <ActivityScreen />}
        {persona === "customer" && activeTab === "account" && <AccountScreen health={health} />}
        {persona === "admin" && activeTab === "overview" && <AdminOverview health={health} onOpenClients={() => setActiveTab("clients")} onOpenApprovals={() => setActiveTab("approvals")} />}
        {persona === "admin" && activeTab === "clients" && <AdminClients />}
        {persona === "admin" && activeTab === "approvals" && <AdminApprovals />}
        {persona === "admin" && activeTab === "security" && <AdminSecurity health={health} />}
      </main>

      <BottomNav activeTab={activeTab} items={navItems} onSelectTab={setActiveTab} />
    </div>
  );
};

function CustomerHome({ health, onOpenChat, onOpenActivity }: { health: (typeof HEALTH_COPY)[TowerHealth]; onOpenChat: () => void; onOpenActivity: () => void }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Welcome back</h1>
          <p className="muted">A clear view of your AI work, wherever you are.</p>
        </div>
        <span className={`status-chip ${health.tone}`}><span className="status-dot" />{health.label}</span>
      </section>

      <button className="hero-card" type="button" onClick={onOpenChat}>
        <span className="hero-orb orb-one" /><span className="hero-orb orb-two" />
        <span className="hero-content">
          <span className="hero-label"><Icon name="sparkle" size={15} /> YOUR AI WORKSPACE</span>
          <strong>What can we help you<br />get done today?</strong>
          <span className="hero-cta">Start a conversation <Icon name="arrow" size={16} /></span>
        </span>
        <span className="hero-symbol" aria-hidden="true"><Icon name="sparkle" size={34} /></span>
      </button>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">AT A GLANCE</p><h2>Your activity</h2></div><button className="text-button" onClick={onOpenActivity}>See all <Icon name="arrow" size={14} /></button></div>
        <div className="metric-grid">
          <MetricCard icon="activity" label="Active runs" value="02" detail="1 needs your review" tone="violet" />
          <MetricCard icon="check" label="Completed" value="18" detail="This workspace · sample" tone="green" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">RECENT WORK</p><h2>Pick up where you left off</h2></div></div>
        <div className="surface-card activity-list">
          {SAMPLE_ACTIVITY.slice(0, 2).map((item) => <ActivityRow key={item.title} item={item} />)}
        </div>
      </section>

      <div className={`connection-card ${health.tone}`}>
        <span className="connection-icon"><Icon name="pulse" size={18} /></span>
        <div><strong>{health.label}</strong><p>{health.description}</p></div>
        <span className="connection-live">LIVE</span>
      </div>
    </>
  );
}

function ChatScreen({ messages, input, isSending, onInput, onSend }: { messages: ChatMessage[]; input: string; isSending: boolean; onInput: (value: string) => void; onSend: (event?: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isSending]);

  return (
    <section className="chat-screen" aria-labelledby="chat-title">
      <div className="page-heading compact-heading"><div><p className="eyebrow">ASSISTANT</p><h1 id="chat-title">Your conversation</h1><p className="muted">Ask a question or describe a task.</p></div><span className="status-chip success"><span className="status-dot" />Ready</span></div>
      <div className="chat-card">
        <div className="chat-feed" ref={feedRef} role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((message) => <div key={message.id} className={`message-row ${message.role}`}>
            {message.role === "assistant" && <div className="message-avatar" aria-hidden="true">S</div>}
            <div className="message-bubble">{message.content}</div>
          </div>)}
          {isSending && <div className="message-row assistant"><div className="message-avatar" aria-hidden="true">S</div><div className="message-bubble typing" aria-label="SupremeAI is responding"><span /><span /><span /></div></div>}
        </div>
        <form className="composer" onSubmit={onSend}>
          <label htmlFor="chat-message" className="sr-only">Message SupremeAI</label>
          <textarea id="chat-message" rows={1} maxLength={8000} placeholder="Message SupremeAI…" value={input} onChange={(event) => onInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void onSend(); } }} />
          <button className="send-button" type="submit" disabled={!input.trim() || isSending} aria-label={isSending ? "Sending message" : "Send message"}><Icon name="arrow-up" size={18} /></button>
        </form>
        <p className="composer-note">AI responses can be inaccurate. Review important information.</p>
      </div>
    </section>
  );
}

function ActivityScreen() {
  return <>
    <PageTitle eyebrow="WORKSPACE" title="Recent activity" description="A sample timeline of work across your workspace." />
    <div className="surface-card activity-list large-list">{SAMPLE_ACTIVITY.map((item) => <ActivityRow key={item.title} item={item} />)}</div>
    <div className="info-card"><Icon name="info" size={18} /><p>Activity is sample data in this preview. Connect the activity API to show your real runs and history.</p></div>
  </>;
}

function AccountScreen({ health }: { health: (typeof HEALTH_COPY)[TowerHealth] }) {
  return <>
    <PageTitle eyebrow="PERSONAL SPACE" title="Your account" description="Manage your workspace preferences and connections." />
    <div className="profile-card"><div className="profile-avatar">SA</div><div><strong>Workspace member</strong><p>Customer account · sample profile</p></div><span className="status-chip success">Active</span></div>
    <div className="surface-card settings-list">
      <SettingRow icon="user" title="Profile and preferences" detail="Personal workspace settings" />
      <SettingRow icon="shield" title="Security" detail="Sign-in and access controls" />
      <SettingRow icon="pulse" title="Service connection" detail={health.label} />
      <SettingRow icon="info" title="Help and support" detail="Get help with your workspace" />
    </div>
    <div className="info-card"><Icon name="info" size={18} /><p>Profile and sign-in actions are not connected in this UI preview.</p></div>
  </>;
}

function AdminOverview({ health, onOpenClients, onOpenApprovals }: { health: (typeof HEALTH_COPY)[TowerHealth]; onOpenClients: () => void; onOpenApprovals: () => void }) {
  return <>
    <PageTitle eyebrow="ADMIN CONSOLE" title="Workspace overview" description="A focused control room for clients, approvals, and service health." />
    <div className={`connection-card ${health.tone}`}><span className="connection-icon"><Icon name="pulse" size={18} /></span><div><strong>Gateway · {health.label}</strong><p>{health.description}</p></div><span className="connection-live">LIVE</span></div>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">SAMPLE METRICS</p><h2>Workspace health</h2></div></div><div className="metric-grid four-metrics">
      <MetricCard icon="users" label="Connected clients" value="18" detail="Sample data" tone="violet" />
      <MetricCard icon="check" label="Needs approval" value="03" detail="Sample data" tone="amber" />
      <MetricCard icon="activity" label="Active agents" value="07" detail="Sample data" tone="green" />
      <MetricCard icon="shield" label="Security alerts" value="00" detail="Sample data" tone="blue" />
    </div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">NEXT ACTIONS</p><h2>Keep things moving</h2></div></div>
      <button className="action-card" type="button" onClick={onOpenApprovals}><span className="action-icon amber"><Icon name="check" size={18} /></span><span><strong>Review access requests</strong><small>Preview requests — action is disabled</small></span><Icon name="chevron" size={18} /></button>
      <button className="action-card" type="button" onClick={onOpenClients}><span className="action-icon violet"><Icon name="users" size={18} /></span><span><strong>Manage connected clients</strong><small>Review client status and roles</small></span><Icon name="chevron" size={18} /></button>
    </section>
  </>;
}

function AdminClients() {
  return <>
    <PageTitle eyebrow="ADMIN CONSOLE" title="Connected clients" description="Review the clients linked to this workspace." />
    <div className="list-toolbar"><span className="status-chip neutral">Sample directory</span><button type="button" className="secondary-button" disabled aria-disabled="true"><Icon name="plus" size={16} /> Add client</button></div>
    <div className="surface-card client-list">{SAMPLE_CLIENTS.map((client) => <div className="client-row" key={client.name}><div className="client-avatar">{client.initials}</div><div className="client-copy"><strong>{client.name}</strong><p>{client.detail}</p></div><span className={`status-chip ${client.status === "Active" ? "success" : "warning"}`}>{client.status}</span><button type="button" className="more-button" aria-label={`More options for ${client.name}`} disabled><Icon name="more" size={18} /></button></div>)}</div>
    <div className="info-card"><Icon name="info" size={18} /><p>Client management is a preview. Connect server-side tenant authorization before enabling role or access changes.</p></div>
  </>;
}

function AdminApprovals() {
  return <>
    <PageTitle eyebrow="ADMIN CONSOLE" title="Access approvals" description="Review requests before a client can connect." />
    <div className="info-card approval-warning"><Icon name="shield" size={18} /><p>Preview only. Approval must be enforced by the authenticated server, not by this screen.</p></div>
    <div className="approval-list">{SAMPLE_APPROVALS.map((request) => <article className="surface-card approval-card" key={request.name}><div className="approval-top"><div className="client-avatar">{request.initials}</div><span className="status-chip warning">Pending</span></div><h2>{request.name}</h2><p className="muted">{request.detail}</p><div className="approval-actions"><button type="button" className="secondary-button" disabled>Decline</button><button type="button" className="primary-button" disabled>Approve</button></div></article>)}</div>
  </>;
}

function AdminSecurity({ health }: { health: (typeof HEALTH_COPY)[TowerHealth] }) {
  return <>
    <PageTitle eyebrow="ADMIN CONSOLE" title="Security and controls" description="Critical actions require verified identity and an auditable server decision." />
    <section className="security-card"><div className="security-card-top"><span className="security-icon"><Icon name="shield" size={20} /></span><span className="status-chip neutral">Disabled in preview</span></div><h2>Autonomy emergency stop</h2><p>Temporarily pause autonomous actions for this tenant. This preview does not send any control-plane command.</p><button type="button" className="danger-button" disabled aria-disabled="true">Emergency stop unavailable</button></section>
    <div className="surface-card settings-list"><SettingRow icon="pulse" title="Gateway status" detail={health.label} /><SettingRow icon="check" title="Audit trail" detail="Connect the audit-events API" /><SettingRow icon="user" title="Administrator role" detail="Must be derived from authenticated server claims" /></div>
  </>;
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div></section>;
}

function MetricCard({ icon, label, value, detail, tone }: { icon: "activity" | "check" | "shield" | "users"; label: string; value: string; detail: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon name={icon} size={18} /></span><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>;
}

function ActivityRow({ item }: { item: (typeof SAMPLE_ACTIVITY)[number] }) {
  return <div className="activity-row"><span className="activity-marker"><Icon name={item.status === "Completed" ? "check" : "activity"} size={16} /></span><div className="activity-copy"><strong>{item.title}</strong><p>{item.detail}</p></div><span className={`status-chip ${item.status === "Completed" ? "success" : "warning"}`}>{item.status}</span></div>;
}

function SettingRow({ icon, title, detail }: { icon: "user" | "shield" | "pulse" | "info" | "check"; title: string; detail: string }) {
  return <div className="setting-row"><span className="setting-icon"><Icon name={icon} size={18} /></span><div><strong>{title}</strong><p>{detail}</p></div><Icon name="chevron" size={18} /></div>;
}

export default App;
