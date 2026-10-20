"use strict";
/**
 * Lightweight context gathering for SupremeAI chat/code actions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditorContext = getEditorContext;
exports.buildPrompt = buildPrompt;
const vscode = require("vscode");
function getEditorContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return undefined;
    const doc = editor.document;
    const selection = doc.getText(editor.selection);
    return {
        filePath: vscode.workspace.asRelativePath(doc.uri),
        language: doc.languageId,
        selection: selection.trim(),
        fileContent: doc.getText(),
    };
}
function buildPrompt(question, ctx) {
    if (!ctx)
        return question;
    const parts = [];
    if (ctx.selection) {
        parts.push(`File: ${ctx.filePath} (${ctx.language})\nSelected code:\n\`\`\`${ctx.language}\n${ctx.selection}\n\`\`\``);
    }
    else {
        parts.push(`File: ${ctx.filePath} (${ctx.language})`);
    }
    parts.push(`Question: ${question}`);
    return parts.join("\n\n");
}
//# sourceMappingURL=context.js.map