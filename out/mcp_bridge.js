"use strict";
/**
 * SupremeAI MCP Bridge — Remote Control Tower client adapter for VS Code.
 *
 * Communicates via JSON-RPC 2.0 / HTTP to the public or authenticated
 * Control Tower endpoint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpBridge = void 0;
class McpBridge {
    towerUrl;
    timeoutMs;
    constructor(towerUrl = "https://supremeai-mcp-tower.onrender.com/mcp", timeoutMs = 8000) {
        this.towerUrl = towerUrl;
        this.timeoutMs = timeoutMs;
    }
    updateConfig(towerUrl, timeoutMs = 8000) {
        this.towerUrl = towerUrl;
        this.timeoutMs = timeoutMs;
    }
    async fetchHealth() {
        const started = Date.now();
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            // Lightweight health check against MCP endpoint or base /health
            const healthUrl = this.towerUrl.replace(/\/mcp\/?$/, "/health");
            const res = await fetch(healthUrl, {
                method: "GET",
                headers: { "Accept": "application/json" },
                signal: controller.signal,
            });
            clearTimeout(timer);
            const latencyMs = Date.now() - started;
            if (!res.ok) {
                return {
                    status: "degraded",
                    activeAgents: 0,
                    openClaims: 0,
                    runwayDepth: 0,
                    latencyMs,
                    lastChecked: new Date().toISOString(),
                };
            }
            const data = (await res.json().catch(() => ({})));
            return {
                status: data.status || "nominal",
                activeAgents: typeof data.activeAgents === "number" ? data.activeAgents : 0,
                openClaims: typeof data.openClaims === "number" ? data.openClaims : 0,
                runwayDepth: typeof data.runwayDepth === "number" ? data.runwayDepth : 0,
                latencyMs,
                lastChecked: new Date().toISOString(),
            };
        }
        catch {
            return {
                status: "offline",
                activeAgents: 0,
                openClaims: 0,
                runwayDepth: 0,
                latencyMs: Date.now() - started,
                lastChecked: new Date().toISOString(),
            };
        }
    }
    async fetchRunway() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            // Call MCP method work.runway or fallback endpoint
            const payload = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: {
                    name: "work_runway_status",
                    arguments: {},
                },
            };
            const res = await fetch(this.towerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) {
                return [];
            }
            const data = (await res.json().catch(() => ({})));
            const rawText = data?.result?.content?.[0]?.text;
            if (!rawText)
                return [];
            const parsed = JSON.parse(rawText);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    async dispatchTask(req) {
        if (!req.title || !req.repo) {
            return { success: false, error: "Task title and repository are required." };
        }
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            const payload = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: {
                    name: "bridge_work_order",
                    arguments: {
                        target_repo: req.repo,
                        summary: req.title,
                        scope_paths: req.scopePaths,
                        description: req.description,
                        priority: req.priority || "P1-high",
                    },
                },
            };
            const res = await fetch(this.towerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) {
                return { success: false, error: `Tower responded with HTTP ${res.status}` };
            }
            const data = (await res.json().catch(() => ({})));
            if (data.error) {
                return { success: false, error: data.error.message || "MCP Dispatch Error" };
            }
            const responseText = data?.result?.content?.[0]?.text || "";
            return {
                success: true,
                taskId: `task-${Date.now().toString(36)}`,
                error: responseText ? undefined : undefined,
            };
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "Network error during dispatch",
            };
        }
    }
    async triggerEmergencyKill(pin) {
        if (!pin || pin.length < 4) {
            return false;
        }
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            const payload = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: {
                    name: "emergency_kill_switch",
                    arguments: { pin },
                },
            };
            const res = await fetch(this.towerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timer);
            return res.ok;
        }
        catch {
            return false;
        }
    }
}
exports.McpBridge = McpBridge;
//# sourceMappingURL=mcp_bridge.js.map