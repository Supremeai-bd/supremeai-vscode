import React, { useEffect, useState } from "react";
import { BottomNav, NavTab } from "./components/BottomNav.js";

export interface MobileAppState {
  activeMissions: number;
  towerHealth: "CHECKING" | "HEALTHY" | "DEGRADED" | "DOWN";
  lastTelemetryTimestamp: number;
}

type Message = { role: "assistant" | "user"; content: string };

export const initialMobileState: MobileAppState = {
  activeMissions: 0,
  towerHealth: "CHECKING",
  lastTelemetryTimestamp: 0,
};

export function renderMobileStatus(state: MobileAppState = initialMobileState): string {
  return `SupremeAI Mobile Supervisor | Active Missions: ${state.activeMissions} | Health: ${state.towerHealth}`;
}

const TAB_META: Record<NavTab, { index: string; title: string; description: string }> = {
  chat: { index: "01 / COMPANION", title: "Conversation", description: "A focused space to think, ask, and keep moving." },
  runs: { index: "02 / ACTIVITY", title: "Mission runs", description: "A clear view of the mission state exposed by this client." },
  agents: { index: "03 / SUPERVISION", title: "Agent supervision", description: "Control surfaces stay explicit about what is connected." },
  inbox: { index: "04 / APPROVALS", title: "Inbox", description: "Review requests only when an approvals feed is connected." },
  more: { index: "05 / PREFERENCES", title: "More", description: "App details and the latest verified connection status." },
};

const BrandMark: React.FC = () => (
  <svg className="mobile-orbit-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="14.5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="20" cy="20" rx="7" ry="14.5" stroke="currentColor" strokeWidth="1.1" opacity=".72" />
    <path d="M5.5 20h29M8.7 11.5h22.6M8.7 28.5h22.6" stroke="currentColor" strokeWidth="1" opacity=".5" />
    <circle cx="30.8" cy="11.2" r="2.4" fill="currentColor" />
  </svg>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("chat");
  const [state, setState] = useState<MobileAppState>(initialMobileState);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "স্বাগতম! SupremeAI Mobile Companion-এ আপনাকে সাহায্য করতে প্রস্তুত।" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      let towerHealth: MobileAppState["towerHealth"];
      try {
        const response = await fetch("https://supremeai-primary-node.onrender.com/health");
        towerHealth = response.ok ? "HEALTHY" : "DEGRADED";
      } catch {
        towerHealth = "DOWN";
      }
      if (mounted) {
        setState((previous) => ({ ...previous, towerHealth, lastTelemetryTimestamp: Date.now() }));
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isSending) return;
    setInput("");
    setMessages((previous) => [...previous, { role: "user", content: userMsg }]);
    setIsSending(true);

    try {
      const response = await fetch("https://supremeai-api-ulw0.onrender.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: userMsg }] }),
      });
      if (response.ok) {
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = data.choices?.[0]?.message?.content || "No response received.";
        setMessages((previous) => [...previous, { role: "assistant", content: reply }]);
      } else {
        setMessages((previous) => [...previous, { role: "assistant", content: `Gateway error: ${response.statusText || response.status}` }]);
      }
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Failed to reach the gateway.";
      setMessages((previous) => [...previous, { role: "assistant", content: `Network error: ${detail}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const tab = TAB_META[activeTab];
  const healthLabel = state.towerHealth === "CHECKING" ? "Checking" : state.towerHealth;
  const healthClass = state.towerHealth.toLowerCase();
  const lastChecked = state.lastTelemetryTimestamp
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(state.lastTelemetryTimestamp)
    : "First check in progress";

  return (
    <div className="mobile-shell">
      <a className="mobile-skip-link" href="#mobile-main">Skip to content</a>
      <header className="mobile-header">
        <div className="mobile-brand">
          <span className="mobile-brand-mark"><BrandMark /></span>
          <span className="mobile-brand-copy">
            <strong>SUPREME<span>AI</span></strong>
            <small>MOBILE COMPANION</small>
          </span>
        </div>
        <div className={`mobile-health mobile-health--${healthClass}`} role="status" aria-live="polite">
          <span className="mobile-health-dot" aria-hidden="true" />
          <span>{healthLabel}</span>
        </div>
      </header>

      <main id="mobile-main" className="mobile-main">
        <section key={activeTab} id={`mobile-panel-${activeTab}`} className={`mobile-screen mobile-screen--${activeTab}`} aria-labelledby="mobile-screen-title">
          <header className="mobile-page-heading">
            <p className="mobile-eyebrow"><span>{tab.index}</span><span className="mobile-eyebrow-line" /></p>
            <h1 id="mobile-screen-title">{tab.title}</h1>
            <p>{tab.description}</p>
          </header>

          {activeTab === "chat" && (
            <>
              <section className="mobile-chat-card" aria-label="Conversation">
                <div className="mobile-chat-toolbar">
                  <span><i className="mobile-live-dot" aria-hidden="true" /> SUPREMEAI ASSISTANT</span>
                  <span className="mobile-session-label">CURRENT SESSION</span>
                </div>
                <div className="mobile-chat-feed" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Chat messages">
                  {messages.map((message, index) => (
                    <article key={`${message.role}-${index}`} className={`mobile-message mobile-message--${message.role}`}>
                      {message.role === "assistant" && <span className="mobile-message-mark"><BrandMark /></span>}
                      <div className="mobile-message-body">
                        <span className="mobile-message-label">{message.role === "user" ? "YOU" : "SUPREMEAI"}</span>
                        <p className="mobile-message-bubble">{message.content}</p>
                      </div>
                    </article>
                  ))}
                  {isSending && (
                    <div className="mobile-thinking" role="status" aria-label="SupremeAI is responding">
                      <span /><span /><span />
                    </div>
                  )}
                </div>
              </section>
              <form className="mobile-composer" onSubmit={(event) => { event.preventDefault(); void handleSend(); }} aria-busy={isSending}>
                <label className="mobile-sr-only" htmlFor="mobile-message-input">Message SupremeAI</label>
                <input
                  id="mobile-message-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  type="text"
                  placeholder="Ask SupremeAI anything…"
                  autoComplete="off"
                  enterKeyHint="send"
                  disabled={isSending}
                />
                <button type="submit" disabled={isSending || !input.trim()} aria-label={isSending ? "Sending message" : "Send message"}>
                  <span>{isSending ? "Working" : "Send"}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-4 14-3-6-7-1Zm7 1 7-8" /></svg>
                </button>
              </form>
              <p className="mobile-disclaimer">AI can make mistakes. Verify important information.</p>
            </>
          )}

          {activeTab === "runs" && (
            <>
              <article className="mobile-stat-card">
                <div className="mobile-card-orbit" aria-hidden="true" />
                <p className="mobile-card-kicker">CURRENT CLIENT STATE</p>
                <div className="mobile-stat-number">{String(state.activeMissions).padStart(2, "0")}</div>
                <p className="mobile-stat-caption">Active missions</p>
                <span className="mobile-state-chip">LOCAL VALUE</span>
              </article>
              <article className="mobile-info-card">
                <span className="mobile-info-mark" aria-hidden="true">↗</span>
                <div>
                  <strong>Mission feed not connected</strong>
                  <p>This view shows the mission count held in the client. Live run records are not currently available here.</p>
                </div>
              </article>
            </>
          )}

          {activeTab === "agents" && (
            <article className="mobile-feature-card">
              <span className="mobile-feature-icon" aria-hidden="true"><BrandMark /></span>
              <p className="mobile-card-kicker">SAFE PREVIEW</p>
              <h2>Supervision, without surprises.</h2>
              <p>Remote agent actions are not connected in this build. The controls remain unavailable until a verified control service is wired in.</p>
              <div className="mobile-control-status"><span className="mobile-status-square" /> Remote controls unavailable</div>
              <button type="button" className="mobile-disabled-action" disabled>Control service not connected</button>
            </article>
          )}

          {activeTab === "inbox" && (
            <article className="mobile-empty-card">
              <span className="mobile-empty-orbit" aria-hidden="true"><span>0</span></span>
              <p className="mobile-card-kicker">APPROVALS</p>
              <h2>No requests loaded</h2>
              <p>No approval feed is connected to this client yet. When it is, pending decisions will appear here for review.</p>
            </article>
          )}

          {activeTab === "more" && (
            <>
              <article className="mobile-account-card">
                <span className="mobile-account-mark"><BrandMark /></span>
                <div><p className="mobile-card-kicker">YOUR COMPANION</p><h2>SupremeAI Mobile</h2><p>Chat, activity and supervision in one place.</p></div>
                <span className="mobile-version-badge">v0.2.0</span>
              </article>
              <section className="mobile-settings-card" aria-labelledby="mobile-settings-title">
                <h2 id="mobile-settings-title">App details</h2>
                <div className="mobile-setting-row"><span className="mobile-setting-symbol">↗</span><span><strong>Tower health</strong><small>Verified service status</small></span><span className={`mobile-setting-value mobile-setting-value--${healthClass}`}>{healthLabel}</span></div>
                <div className="mobile-setting-row"><span className="mobile-setting-symbol">◷</span><span><strong>Last checked</strong><small>Health endpoint</small></span><time className="mobile-setting-value">{lastChecked}</time></div>
                <div className="mobile-setting-row"><span className="mobile-setting-symbol">◈</span><span><strong>Platform</strong><small>Capacitor companion</small></span><span className="mobile-setting-value">Android</span></div>
              </section>
              <p className="mobile-build-note">SupremeAI Companion · Design preview for the connected client surfaces.</p>
            </>
          )}
        </section>
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
};

export default App;
