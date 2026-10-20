"use strict";
/**
 * SupremeAI VS Code Extension — Main Activation Entrypoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const mcp_bridge_1 = require("./mcp_bridge");
const status_bar_1 = require("./status_bar");
const chat_view_1 = require("./chat_view");
const inline_chat_1 = require("./commands/inline_chat");
const code_actions_1 = require("./code_actions");
const submit_task_1 = require("./commands/submit_task");
const runway_status_1 = require("./commands/runway_status");
const task_tracker_1 = require("./orchestrator/task_tracker");
const adapter_1 = require("./orchestrator/adapter");
let statusBar = null;
let bridge = null;
let orchestratorProvider = null;
function activate(context) {
    const config = vscode.workspace.getConfiguration("supremeai");
    const towerUrl = config.get("towerUrl", "https://supremeai-mcp-tower.onrender.com/mcp");
    const refreshSeconds = config.get("autoRefreshSeconds", 30);
    // 1. Initialize MCP Client Bridge
    bridge = new mcp_bridge_1.McpBridge(towerUrl);
    // 2. Initialize Status Bar Telemetry
    statusBar = new status_bar_1.FederationStatusBar(bridge);
    statusBar.startPolling(refreshSeconds);
    context.subscriptions.push(statusBar);
    // 3. Register Chat Sidebar Webview
    const chatProvider = new chat_view_1.SupremeAIChatViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(chat_view_1.SupremeAIChatViewProvider.viewType, chatProvider, {
        webviewOptions: { retainContextWhenHidden: true },
    }));
    // 4. Register Orchestrator Task Tracker (V0.2, opt-in via tasks present)
    orchestratorProvider = new task_tracker_1.OrchestratorTaskProvider();
    const treeView = vscode.window.createTreeView("supremeai.orchestratorTasks", {
        treeDataProvider: orchestratorProvider,
    });
    context.subscriptions.push(treeView, orchestratorProvider);
    // 5. Register Orchestrator Commands
    const orchestratorNewTask = vscode.commands.registerCommand("supremeai.orchestrator.newTask", async () => {
        const title = await vscode.window.showInputBox({ prompt: "Task title", placeHolder: "e.g. Fix auth token expiry" });
        if (!title)
            return;
        await (0, task_tracker_1.createTaskContract)(title);
        orchestratorProvider?.refresh();
    });
    const orchestratorTriggerReview = vscode.commands.registerCommand("supremeai.orchestrator.triggerReview", async () => {
        await (0, adapter_1.runExtensionCommand)("coderabbit-vscode.initiateReview");
        orchestratorProvider?.refresh();
    });
    const orchestratorRunVerifier = vscode.commands.registerCommand("supremeai.orchestrator.runVerifier", async () => {
        const terminal = vscode.window.createTerminal("SupremeAI Verifier");
        terminal.show();
        terminal.sendText("npm test");
    });
    context.subscriptions.push(orchestratorNewTask, orchestratorTriggerReview, orchestratorRunVerifier);
    // 3. Register Commands
    const dispatchDisposable = vscode.commands.registerCommand("supremeai.dispatchTask", () => {
        if (bridge) {
            (0, submit_task_1.submitTaskCommand)(bridge);
        }
    });
    const runwayDisposable = vscode.commands.registerCommand("supremeai.viewRunway", () => {
        if (bridge) {
            (0, runway_status_1.runwayStatusCommand)(bridge);
        }
    });
    const killSwitchDisposable = vscode.commands.registerCommand("supremeai.emergencyStop", async () => {
        const pin = await vscode.window.showInputBox({
            prompt: "Enter Superadmin Emergency PIN to halt all autonomous execution",
            password: true,
            placeHolder: "PIN (minimum 4 digits)",
            validateInput: (text) => (text.length < 4 ? "PIN must be at least 4 digits" : null),
        });
        if (!pin || !bridge)
            return;
        const confirmed = await vscode.window.showWarningMessage("Are you sure you want to trigger the EMERGENCY KILL-SWITCH across the entire federation?", { modal: true }, "HALT ALL AUTONOMY");
        if (confirmed === "HALT ALL AUTONOMY") {
            const ok = await bridge.triggerEmergencyKill(pin);
            if (ok) {
                vscode.window.showErrorMessage("🚨 EMERGENCY KILL-SWITCH ACTIVATED: All autonomous agent runs paused.");
                if (statusBar) {
                    statusBar.refresh();
                }
            }
            else {
                vscode.window.showErrorMessage("❌ Kill-switch request rejected (invalid PIN or server error).");
            }
        }
    });
    const askSelectionDisposable = vscode.commands.registerCommand("supremeai.askSelection", () => {
        (0, inline_chat_1.inlineChatCommand)();
    });
    const openChatDisposable = vscode.commands.registerCommand("supremeai.openChat", () => {
        vscode.commands.executeCommand("supremeai.chat.focus");
    });
    (0, code_actions_1.registerCodeActions)(context);
    // 4. Listen to configuration updates
    const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("supremeai")) {
            const updatedConfig = vscode.workspace.getConfiguration("supremeai");
            const newUrl = updatedConfig.get("towerUrl", "https://supremeai-mcp-tower.onrender.com/mcp");
            const newRefresh = updatedConfig.get("autoRefreshSeconds", 30);
            if (bridge) {
                bridge.updateConfig(newUrl);
            }
            if (statusBar) {
                statusBar.startPolling(newRefresh);
            }
        }
    });
    context.subscriptions.push(dispatchDisposable, runwayDisposable, killSwitchDisposable, askSelectionDisposable, openChatDisposable, configDisposable);
}
function deactivate() {
    if (statusBar) {
        statusBar.dispose();
        statusBar = null;
    }
    if (orchestratorProvider) {
        orchestratorProvider.dispose();
        orchestratorProvider = null;
    }
    bridge = null;
}
//# sourceMappingURL=extension.js.map