# Plan: Reduce SDD Permission Prompts (Task #4)

## Status: IMPLEMENTED

## Problem Statement

Running SDD commands triggers too many permission prompts, pausing the flow and wasting time. Users must approve nearly every file write operation individually.

**Previous State:**
- `settings.local.json` has ~60 pre-approved Bash commands
- No Write/Edit permissions were pre-granted
- No hooks were configured for smart auto-approval
- Each spec file, scaffold file, and implementation file required individual approval

**Impact:**
- `/sdd-init` creates ~50+ files → 50+ permission prompts
- `/sdd-new-change` creates 2-3 files → 2-3 prompts
- `/sdd-implement-change` invokes multiple agents writing many files → many prompts

---

## Solution Implemented

### 1. Plugin Hook (Automatic)

Added a validation hook that is **automatically registered** when the SDD plugin is installed:

**Files:**
- `plugin/hooks/hooks.json` - Hook configuration (auto-registered via plugin.json)
- `plugin/hooks/validate-sdd-writes.sh` - Smart approval logic
- `plugin/.claude-plugin/plugin.json` - Updated with `"hooks": "../hooks/hooks.json"`

**Behavior:**
- Auto-approves writes to safe SDD directories (`specs/`, `components/`, `config/`, `docs/`, `tests/`, `.github/workflows/`)
- Auto-approves writes to safe root files (`README.md`, `CLAUDE.md`, `package.json`, etc.)
- Blocks writes to sensitive paths (`.env*`, `secrets/`, `.git/`, `node_modules/`, credentials, private keys)
- Passes through unknown paths to normal Claude Code flow

**Requirement:** Users must have `jq` installed (`brew install jq` on macOS).

### 2. Static Permission Patterns (Optional)

Created recommended permission patterns for users who want additional coverage:

**Files:**
- `plugin/config/recommended-permissions.json` - Full permission template
- `plugin/docs/permissions.md` - User documentation

### 3. Documentation

Updated documentation to explain the permission system:

**Files:**
- `README.md` - Added "Reducing Permission Prompts" section
- `plugin/docs/permissions.md` - Comprehensive setup guide
- `plugin/commands/sdd-init.md` - Added permission note
- `plugin/commands/sdd-new-change.md` - Added permission note

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `plugin/.claude-plugin/plugin.json` | Updated | Added `hooks` field pointing to hooks.json |
| `plugin/hooks/hooks.json` | Created | Hook configuration for auto-registration |
| `plugin/hooks/validate-sdd-writes.sh` | Created | Smart auto-approval logic |
| `plugin/config/recommended-permissions.json` | Created | Optional static permission patterns |
| `plugin/docs/permissions.md` | Created | User documentation |
| `README.md` | Updated | Added permissions section |
| `plugin/commands/sdd-init.md` | Updated | Added permission note |
| `plugin/commands/sdd-new-change.md` | Updated | Added permission note |

---

## How It Works

1. **On Plugin Install:** Claude Code reads `plugin.json`, sees `"hooks": "../hooks/hooks.json"`, and registers the PreToolUse hook automatically.

2. **On Write/Edit Operation:**
   - Hook receives the tool invocation
   - Checks if path is blocked → Block with message
   - Checks if path is in safe directory → Allow
   - Checks if path is safe root file → Allow
   - Otherwise → Pass through to normal flow

3. **For Additional Coverage:** Users can add static permission patterns from `recommended-permissions.json` to their `.claude/settings.local.json`.

---

## Testing Results

Hook tested with these scenarios:
- ✅ `specs/changes/test.md` → Allowed
- ✅ `components/server/src/index.ts` → Allowed
- ✅ `README.md` → Allowed
- ✅ `.env.local` → Blocked
- ✅ `secrets/api-key.txt` → Blocked
- ✅ Read tool → Passed through (no output)

---

## Security Considerations

1. **Sensitive files always require manual approval:** `.env*`, `secrets/`, `.git/`, private keys
2. **The hook is conservative:** Unknown paths pass through to normal Claude Code flow
3. **No system-wide permissions:** All patterns are relative to project root
4. **Dangerous bash blocked:** `rm -rf`, `curl|bash`, `wget|bash` in deny list

---

## Open Questions (Resolved)

1. ~~Should permissions be auto-installed?~~ **YES** - Plugin hooks are auto-registered via plugin.json
2. ~~Project-level vs user-level settings?~~ **Project-level** - Hooks are per-plugin, static permissions can be either
3. ~~Hook dependency on jq~~ **Documented** - Users must install jq, documented in permissions.md
