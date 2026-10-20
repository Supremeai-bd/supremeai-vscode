"use strict";
/**
 * SupremeAI Status Bar — Visual telemetry indicator in VS Code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederationStatusBar = void 0;
const vscode = require("vscode");
class FederationStatusBar {
    statusBarItem;
    bridge;
    timer = null;
    isDisposed = false;
    constructor(bridge) {
        this.bridge = bridge;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = "supremeai.viewRunway";
        this.updateDisplay({
            status: "nominal",
            activeAgents: 0,
            openClaims: 0,
            runwayDepth: 0,
            latencyMs: 0,
            lastChecked: new Date().toISOString(),
        });
        this.statusBarItem.show();
    }
    get item() {
        return this.statusBarItem;
    }
    startPolling(intervalSeconds = 30) {
        this.stopPolling();
        const intervalMs = Math.max(5, intervalSeconds) * 1000;
        this.refresh();
        this.timer = setInterval(() => {
            if (!this.isDisposed) {
                this.refresh();
            }
        }, intervalMs);
    }
    stopPolling() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async refresh() {
        const health = await this.bridge.fetchHealth();
        this.updateDisplay(health);
    }
    updateDisplay(health) {
        if (this.isDisposed)
            return;
        let icon = "$(cloud)";
        let label = "Nominal";
        switch (health.status) {
            case "nominal":
                if (health.activeAgents > 0) {
                    icon = "$(sync~spin)";
                    label = `Agents (${health.activeAgents})`;
                }
                else {
                    icon = "$(cloud)";
                    label = "Nominal";
                }
                this.statusBarItem.backgroundColor = undefined;
                break;
            case "degraded":
                icon = "$(warning)";
                label = "Degraded";
                this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
                break;
            case "critical":
                icon = "$(error)";
                label = "Critical";
                this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
                break;
            case "offline":
            default:
                icon = "$(circle-slash)";
                label = "Offline";
                this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
                break;
        }
        this.statusBarItem.text = `${icon} SupremeAI: ${label}`;
        this.statusBarItem.tooltip = new vscode.MarkdownString(`**SupremeAI Federation Status**\n\n` +
            `- **State:** \`${health.status.toUpperCase()}\`\n` +
            `- **Active Agents:** ${health.activeAgents}\n` +
            `- **Open Claims:** ${health.openClaims}\n` +
            `- **Runway Depth:** ${health.runwayDepth} PRs\n` +
            `- **Tower Latency:** ${health.latencyMs}ms\n` +
            `- **Last Polled:** ${new Date(health.lastChecked).toLocaleTimeString()}\n\n` +
            `*Click to view PR runway and gate diagnostics.*`);
    }
    dispose() {
        this.isDisposed = true;
        this.stopPolling();
        this.statusBarItem.dispose();
    }
}
exports.FederationStatusBar = FederationStatusBar;
//# sourceMappingURL=status_bar.js.map