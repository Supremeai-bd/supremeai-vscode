"use strict";
/**
 * Code actions: Explain / Fix / Refactor selected code with SupremeAI.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCodeActions = registerCodeActions;
const vscode = require("vscode");
class SupremeAICodeActionProvider {
    provideCodeActions(_document, range) {
        if (range.isEmpty)
            return [];
        const explain = new vscode.CodeAction("SupremeAI: Explain selection", vscode.CodeActionKind.QuickFix);
        explain.command = { command: "supremeai.askSelection", title: "Explain" };
        const fix = new vscode.CodeAction("SupremeAI: Fix selection", vscode.CodeActionKind.QuickFix);
        fix.command = { command: "supremeai.askSelection", title: "Fix" };
        return [explain, fix];
    }
}
function registerCodeActions(context) {
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ scheme: "file" }, new SupremeAICodeActionProvider(), {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }));
}
//# sourceMappingURL=code_actions.js.map