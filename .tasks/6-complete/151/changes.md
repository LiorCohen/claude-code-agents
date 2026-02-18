---
generated: 2026-02-18 09:42 UTC
branch: feature/task-151-vscode-extension
commits: 2
---

# Task #151 — Changes

**Files changed:** 21 (+7864 / -0 lines)

| File | Added | Removed |
|------|------:|--------:|
| [`vscode-extension/src/types.ts`](vscode-extension/src/types.ts) | +185 | -0 |
| [`vscode-extension/src/workflow-parser.ts`](vscode-extension/src/workflow-parser.ts) | +281 | -0 |
| [`vscode-extension/src/workflow-watcher.ts`](vscode-extension/src/workflow-watcher.ts) | +160 | -0 |
| [`vscode-extension/src/extension.ts`](vscode-extension/src/extension.ts) | +109 | -0 |
| [`vscode-extension/src/notifications/approval-gates.ts`](vscode-extension/src/notifications/approval-gates.ts) | +101 | -0 |
| [`vscode-extension/src/views/workflow-tree.ts`](vscode-extension/src/views/workflow-tree.ts) | +282 | -0 |
| [`vscode-extension/src/views/status-bar.ts`](vscode-extension/src/views/status-bar.ts) | +202 | -0 |
| [`vscode-extension/src/views/lifecycle-webview.ts`](vscode-extension/src/views/lifecycle-webview.ts) | +148 | -0 |
| [`vscode-extension/webview/StepperPanel.tsx`](vscode-extension/webview/StepperPanel.tsx) | +236 | -0 |
| [`vscode-extension/webview/index.tsx`](vscode-extension/webview/index.tsx) | +39 | -0 |
| [`vscode-extension/webview/stepper.css`](vscode-extension/webview/stepper.css) | +225 | -0 |
| [`vscode-extension/webview/vscode-api.ts`](vscode-extension/webview/vscode-api.ts) | +30 | -0 |
| [`vscode-extension/package.json`](vscode-extension/package.json) | +125 | -0 |
| [`vscode-extension/webpack.config.js`](vscode-extension/webpack.config.js) | +85 | -0 |
| [`vscode-extension/tsconfig.json`](vscode-extension/tsconfig.json) | +16 | -0 |
| [`vscode-extension/tsconfig.extension.json`](vscode-extension/tsconfig.extension.json) | +10 | -0 |
| [`vscode-extension/tsconfig.webview.json`](vscode-extension/tsconfig.webview.json) | +9 | -0 |
| [`vscode-extension/media/icons/sdd-icon.svg`](vscode-extension/media/icons/sdd-icon.svg) | +5 | -0 |
| [`vscode-extension/.vscodeignore`](vscode-extension/.vscodeignore) | +8 | -0 |
| [`vscode-extension/.gitignore`](vscode-extension/.gitignore) | +3 | -0 |
| [`vscode-extension/package-lock.json`](vscode-extension/package-lock.json) | +5605 | -0 |
