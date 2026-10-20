"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCommandAvailable = isCommandAvailable;
exports.runExtensionCommand = runExtensionCommand;
exports.notifyManualHandoff = notifyManualHandoff;
/**
 * Orchestrator Adapter — V0.2 programmatic helpers.
 *
 * Programmatic mode invokes only documented public commands after a runtime
 * availability check. If the command is absent, we degrade gracefully and
 * notify the user instead of crashing (Command ID Fragility mitigation).
 */
const vscode = require("vscode");
async function isCommandAvailable(commandId) {
    try {
        const commands = await vscode.commands.getCommands(true);
        return commands.includes(commandId);
    }
    catch {
        return false;
    }
}
async function runExtensionCommand(commandId, ...args) {
    const available = await isCommandAvailable(commandId);
    if (!available) {
        vscode.window.showInformationMessage(`Orchestrator: command "${commandId}" is not available. Trigger it manually from its extension panel.`);
        return { ok: false, invoked: false, reason: "command_not_available" };
    }
    try {
        await vscode.commands.executeCommand(commandId, ...args);
        return { ok: true, invoked: true };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showWarningMessage(`Orchestrator: failed to run "${commandId}": ${msg}`);
        return { ok: false, invoked: false, reason: msg };
    }
}
function notifyManualHandoff(stage, handoffPath) {
    vscode.window.showInformationMessage(`Orchestrator: ${stage} ready (manual handoff). Open ${handoffPath} and paste into the worker extension.`);
}
//# sourceMappingURL=adapter.js.map