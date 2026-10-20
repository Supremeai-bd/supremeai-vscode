"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItem = exports.OrchestratorTaskProvider = void 0;
exports.createTaskContract = createTaskContract;
/**
 * Orchestrator Task Tracker - V0.2 sidebar tree view.
 *
 * Reads .ide-orchestrator/tasks/<id>/task.json from the workspace and renders
 * task stages with status icons. Refreshes on file changes.
 */
const vscode = require("vscode");
const fs = require("node:fs");
const path = require("node:path");
const STAGE_ICON = {
    queued: "circle-outline",
    planning: "sync~spin",
    planned: "check",
    implementing: "tools",
    reviewing: "eye",
    fixing: "wrench",
    verifying: "beaker",
    completed: "pass-filled",
    blocked: "warning",
    failed: "error",
    cancelled: "circle-slash",
};
class OrchestratorTaskProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    watcher;
    constructor() {
        this.setupWatcher();
    }
    getTasksRoot() {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!ws)
            return undefined;
        return path.join(ws, ".ide-orchestrator", "tasks");
    }
    setupWatcher() {
        const root = this.getTasksRoot();
        if (!root)
            return;
        const pattern = new vscode.RelativePattern(root, "**/task.json");
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
        this.watcher.onDidChange(() => this.refresh());
        this.watcher.onDidCreate(() => this.refresh());
        this.watcher.onDidDelete(() => this.refresh());
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    dispose() {
        this.watcher?.dispose();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element)
            return [];
        const root = this.getTasksRoot();
        if (!root || !fs.existsSync(root))
            return [];
        const items = [];
        for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
            if (!entry.isDirectory())
                continue;
            const taskPath = path.join(root, entry.name, "task.json");
            if (!fs.existsSync(taskPath))
                continue;
            try {
                const raw = JSON.parse(fs.readFileSync(taskPath, "utf-8"));
                const state = {
                    taskId: String(raw.task_id ?? entry.name),
                    stage: String(raw.stage ?? "queued"),
                    userRequest: String(raw.user_request ?? ""),
                    reviewRound: Number(raw.review_round ?? 0),
                    maxReviewRounds: Number(raw.max_review_rounds ?? 2),
                    blockers: Array.isArray(raw.blockers) ? raw.blockers : [],
                };
                items.push(new TaskItem(state));
            }
            catch {
                // skip malformed task files
            }
        }
        return items;
    }
}
exports.OrchestratorTaskProvider = OrchestratorTaskProvider;
class TaskItem extends vscode.TreeItem {
    constructor(state) {
        super(state.taskId, vscode.TreeItemCollapsibleState.None);
        this.description = state.stage + " (" + state.reviewRound + "/" + state.maxReviewRounds + ")";
        this.tooltip = state.userRequest || state.taskId;
        this.iconPath = new vscode.ThemeIcon(STAGE_ICON[state.stage] ?? "circle-outline");
        if (state.blockers.length > 0) {
            this.description = this.description + " - blocked: " + state.blockers.join(", ");
        }
    }
}
exports.TaskItem = TaskItem;
async function createTaskContract(title) {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) {
        vscode.window.showErrorMessage("Orchestrator: No workspace folder open.");
        return undefined;
    }
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30) || "task";
    const shortHash = Math.random().toString(36).substring(2, 6);
    const taskId = `task-${dateStr}-${slug}-${shortHash}`;
    const taskDir = path.join(ws, ".ide-orchestrator", "tasks", taskId);
    const handoffsDir = path.join(taskDir, "handoffs");
    fs.mkdirSync(handoffsDir, { recursive: true });
    const now = new Date().toISOString();
    const taskData = {
        task_id: taskId,
        created_at: now,
        updated_at: now,
        user_request: title,
        stage: "planning",
        max_review_rounds: 2,
        review_round: 0,
        scope: {
            allowed_paths: [],
            prohibited_paths: [".github/**", "secrets/**"],
            destructive_ops_allowed: false,
        },
        acceptance_criteria: [],
        roles: {
            planner: "ext-gsd",
            implementer: "ext-cline",
            reviewer: "ext-coderabbit",
            fixer: "ext-cline",
            verifier: "terminal-test-runner",
        },
        automation_mode: {
            planner: "manual",
            implementer: "manual",
            reviewer: "programmatic",
            fixer: "manual",
            verifier: "cli",
        },
        evidence: {
            changed_files: [],
            diff_hash: null,
            tests_run: [],
            tests_passed: null,
        },
        blockers: [],
        history: [
            { stage: "queued", at: now, actor: "user" },
            { stage: "planning", at: now, actor: "orchestrator" },
        ],
    };
    fs.writeFileSync(path.join(taskDir, "task.json"), JSON.stringify(taskData, null, 2), "utf-8");
    const planContent = `# Plan: ${title}\n\n## Objective\n${title}\n\n## Scope\n- Allowed files:\n- Prohibited files: .github/**, secrets/**\n\n## Implementation Steps\n1. \n\n## Acceptance Criteria\n- [ ] \n`;
    const planPath = path.join(taskDir, "plan.md");
    fs.writeFileSync(planPath, planContent, "utf-8");
    const handoffPlanContent = `# Stage 01: Planning\n\n**Task:** ${title}\n**Assigned Role:** Planner\n\nInstructions:\n1. Analyze the codebase.\n2. Define step-by-step changes.\n3. Save plan in plan.md.\n`;
    fs.writeFileSync(path.join(handoffsDir, "01-plan.md"), handoffPlanContent, "utf-8");
    try {
        const doc = await vscode.workspace.openTextDocument(planPath);
        await vscode.window.showTextDocument(doc);
    }
    catch {
        // Ignore if running outside interactive window
    }
    vscode.window.showInformationMessage(`Orchestrator: Created ${taskId} and opened plan.md`);
    return taskId;
}
//# sourceMappingURL=task_tracker.js.map