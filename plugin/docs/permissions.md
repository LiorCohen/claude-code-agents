# SDD Plugin Permissions Setup

SDD commands create and modify many files during project initialization and development. By default, Claude Code will prompt you to approve each file operation individually, which can be tedious.

This guide explains how to configure permissions to reduce prompts while maintaining security.

## Automatic Hook (Built-in)

The SDD plugin includes a validation hook that automatically:
- **Auto-approves** writes to safe SDD directories (`specs/`, `components/`, `config/`, etc.)
- **Blocks** writes to sensitive paths (`.env`, `secrets/`, `.git/`, etc.)

This hook is registered automatically when the plugin is installed. No manual configuration required.

**Requirement:** The hook requires `jq` to be installed:
```bash
# macOS
brew install jq

# Ubuntu/Debian
apt-get install jq
```

## Additional Permission Configuration (Optional)

For even fewer prompts, you can add static permission patterns to your project's `.claude/settings.local.json`.

### Option 1: Minimal Permissions (Recommended)

```json
{
  "permissions": {
    "allow": [
      "Write(specs/**)",
      "Write(components/**)",
      "Write(config/**)",
      "Edit(specs/**)",
      "Edit(components/**)",
      "Edit(config/**)",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(mkdir -p:*)"
    ],
    "deny": [
      "Write(.env*)",
      "Write(**/secrets/**)",
      "Edit(.env*)",
      "Edit(**/secrets/**)"
    ]
  }
}
```

### Option 2: Full SDD Permissions

For the complete recommended permission set, copy from:
```
plugin/config/recommended-permissions.json
```

### Option 3: Maximum Convenience (Development Only)

For local development where you trust all operations:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash"
    ],
    "deny": [
      "Write(.env*)",
      "Edit(.env*)",
      "Bash(rm -rf *)"
    ]
  }
}
```

**Warning:** This grants broad permissions. Only use in trusted development environments.

## Understanding SDD File Operations

### What SDD Commands Write

| Command | Files Created/Modified |
|---------|----------------------|
| `/sdd-init` | ~50+ files: project structure, specs, components, config |
| `/sdd-new-change` | 2-3 files: SPEC.md, PLAN.md, INDEX.md |
| `/sdd-implement-change` | Many files: implementation code, tests, docs |
| `/sdd-verify-change` | None (read-only verification) |

### Safe Directories (Auto-Approved by Hook)

These directories contain SDD-managed content:

- `specs/` - Specifications, plans, domain definitions
- `components/` - Generated component code
- `config/` - Configuration files
- `.github/workflows/` - CI/CD definitions
- `docs/` - Documentation
- `tests/` - Test files

### Protected Paths (Blocked by Hook)

These are always blocked:

- `.env*` - Environment variables with secrets
- `secrets/` - Sensitive credentials
- `.git/` - Git internals
- `node_modules/` - Dependencies (should use npm)
- `credentials` - Credential files
- `*.pem`, `*.key` - Private keys
- `id_rsa`, `id_ed25519` - SSH keys

## Troubleshooting

### Still Getting Many Prompts?

1. **Check jq is installed**: `which jq`
2. **Check plugin is enabled**: `claude plugins list`
3. **Add static permissions**: Use Option 1 above for additional coverage

### Hook Not Working?

1. **Check jq is installed**: `which jq`
2. **Test hook manually**:
   ```bash
   echo '{"tool":"Write","tool_input":{"file_path":"specs/test.md"}}' | ${CLAUDE_PLUGIN_ROOT}/hooks/validate-sdd-writes.sh
   ```
3. **Check plugin version**: Ensure you have v4.6.0+ which includes the hook

### Permission Denied Unexpectedly?

The hook blocks paths containing:
- `.env`
- `secrets/`
- `.git/`
- `node_modules/`
- `credentials`
- `*.pem`, `*.key`
- `id_rsa`, `id_ed25519`

If you need to write to a blocked path, you'll need to approve it manually (this is intentional for security).

## Security Considerations

1. **Sensitive files always prompt** - `.env`, secrets, keys require manual approval
2. **Review deny rules** - Ensure sensitive paths are blocked
3. **Project-level settings** - Use `.claude/settings.local.json` (gitignored) for permissions
4. **The hook is conservative** - Unknown paths pass through to normal Claude Code flow

## Further Reading

- [Claude Code Settings Documentation](https://docs.anthropic.com/claude-code/settings)
- [Claude Code Hooks Guide](https://docs.anthropic.com/claude-code/hooks)
