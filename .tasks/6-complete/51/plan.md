# Plan: Add GitHub Actions Workflow for Automated Releases (Task 51)

## Status: COMPLETE

---

## Problem Summary

The marketplace repo (LiorCohen/claude-code-plugins) needs automated GitHub releases when plugin versions change. Currently, version bumps happen via the commit skill but no GitHub releases are created.

**Goal:** When a commit to `main` changes the plugin version in `.claude-plugin/marketplace.json`, automatically create a GitHub release with the changelog entry as release notes.

## Files to Create/Modify

| File | Changes |
|------|---------|
| `.github/workflows/release.yml` | Create new workflow file |

## Implementation

### Step 1: Create the Workflow File

Create `.github/workflows/release.yml` with the following logic:

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need previous commit to compare versions

      - name: Get current version
        id: current
        run: |
          VERSION=$(jq -r '.plugins[0].version' .claude-plugin/marketplace.json)
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Get previous version
        id: previous
        run: |
          git show HEAD~1:.claude-plugin/marketplace.json > /tmp/prev-manifest.json 2>/dev/null || echo '{"plugins":[{"version":"0.0.0"}]}' > /tmp/prev-manifest.json
          VERSION=$(jq -r '.plugins[0].version' /tmp/prev-manifest.json)
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Check if version changed
        id: check
        run: |
          if [ "${{ steps.current.outputs.version }}" != "${{ steps.previous.outputs.version }}" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

      - name: Extract changelog for version
        if: steps.check.outputs.changed == 'true'
        id: changelog
        run: |
          VERSION="${{ steps.current.outputs.version }}"
          # Extract changelog section for this version (from ## [x.y.z] to next ## [ or ## Infrastructure)
          CHANGELOG=$(awk -v ver="$VERSION" '
            BEGIN { found=0; output="" }
            /^## \[/ {
              if (found) exit
              if ($0 ~ "\\[" ver "\\]") { found=1; next }
            }
            /^## Infrastructure/ { if (found) exit }
            found { output = output $0 "\n" }
            END { print output }
          ' CHANGELOG.md)
          {
            echo "body<<EOF"
            echo "$CHANGELOG"
            echo "EOF"
          } >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        if: steps.check.outputs.changed == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release create "v${{ steps.current.outputs.version }}" \
            --title "SDD Plugin v${{ steps.current.outputs.version }}" \
            --notes "${{ steps.changelog.outputs.body }}"
```

### Key Design Decisions

1. **Version source:** Uses `.claude-plugin/marketplace.json` as the single source of truth for version detection (both plugin.json and marketplace.json are kept in sync by the bump-version.sh script)

2. **Comparison method:** Compares current commit's version against previous commit (HEAD~1). Falls back to "0.0.0" if the file didn't exist previously.

3. **Changelog extraction:** Uses awk to extract the section for the specific version from CHANGELOG.md. Handles the changelog format where:
   - Plugin releases: `## [x.y.z] - YYYY-MM-DD`
   - Infrastructure changes: `## Infrastructure - YYYY-MM-DD` (not versioned, no release created)

4. **Release creation:** Uses GitHub CLI (`gh release create`) which is pre-installed on GitHub-hosted runners. No third-party actions required.

5. **Permissions:** Uses `contents: write` for creating releases and tags.

### Edge Cases Handled

- **First release:** Falls back to "0.0.0" as previous version, so first version will always create a release
- **Infrastructure-only commits:** No version change = no release created
- **Missing changelog entry:** Release will be created with empty body (not a blocker)
- **Squash merges:** Works because we compare HEAD~1, not branch comparison

## Verification

1. **Unit test the awk script locally:**
   ```bash
   # Test changelog extraction
   VERSION="4.9.0"
   awk -v ver="$VERSION" '
     BEGIN { found=0; output="" }
     /^## \[/ {
       if (found) exit
       if ($0 ~ "\\[" ver "\\]") { found=1; next }
     }
     /^## Infrastructure/ { if (found) exit }
     found { output = output $0 "\n" }
     END { print output }
   ' CHANGELOG.md
   ```

2. **Verify workflow syntax:**
   ```bash
   # GitHub CLI can validate workflow syntax
   gh workflow view release.yml 2>&1 || echo "Push to test"
   ```

3. **Test with a real version bump:**
   - Make a plugin change that requires version bump
   - Use `/commit` skill to bump version and commit
   - Push to main
   - Verify GitHub release is created with correct tag, name, and body

4. **Test infrastructure-only commit:**
   - Make a change that doesn't require version bump (e.g., update CLAUDE.md)
   - Commit and push to main
   - Verify NO release is created

## Notes

- The workflow file was partially created during initial exploration. Need to verify it's complete and correct.
- Consider adding a `workflow_dispatch` trigger for manual release creation if needed in the future.
- The release tag format is `v{version}` (e.g., `v4.9.0`) to follow common conventions.
