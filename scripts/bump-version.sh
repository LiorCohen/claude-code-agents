#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# File paths
PLUGIN_JSON="plugin/.claude-plugin/plugin.json"
MARKETPLACE_JSON=".claude-plugin/marketplace.json"

# Check if files exist
if [[ ! -f "$PLUGIN_JSON" ]]; then
    echo -e "${RED}Error: $PLUGIN_JSON not found${NC}"
    exit 1
fi

if [[ ! -f "$MARKETPLACE_JSON" ]]; then
    echo -e "${RED}Error: $MARKETPLACE_JSON not found${NC}"
    exit 1
fi

# Get current version from plugin.json
CURRENT_VERSION=$(jq -r '.version' "$PLUGIN_JSON")

if [[ -z "$CURRENT_VERSION" ]]; then
    echo -e "${RED}Error: Could not read current version from $PLUGIN_JSON${NC}"
    exit 1
fi

echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Determine new version based on argument
BUMP_TYPE="${1:-patch}"

case "$BUMP_TYPE" in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    patch)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
    *)
        echo -e "${RED}Error: Invalid bump type '$BUMP_TYPE'. Use 'major', 'minor', or 'patch'${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Update plugin.json
jq ".version = \"$NEW_VERSION\"" "$PLUGIN_JSON" > "$PLUGIN_JSON.tmp" && mv "$PLUGIN_JSON.tmp" "$PLUGIN_JSON"
echo -e "${GREEN}✓ Updated $PLUGIN_JSON${NC}"

# Update marketplace.json
jq ".plugins[0].version = \"$NEW_VERSION\"" "$MARKETPLACE_JSON" > "$MARKETPLACE_JSON.tmp" && mv "$MARKETPLACE_JSON.tmp" "$MARKETPLACE_JSON"
echo -e "${GREEN}✓ Updated $MARKETPLACE_JSON${NC}"

# Update TODO.md with current version
TODO_FILE="plugin/TODO.md"
if [[ -f "$TODO_FILE" ]]; then
    sed -i.bak "s/Current version: .*/Current version: $NEW_VERSION/" "$TODO_FILE"
    rm -f "$TODO_FILE.bak"
    echo -e "${GREEN}✓ Updated $TODO_FILE${NC}"
fi

echo ""
echo -e "${GREEN}Version bump complete: $CURRENT_VERSION → $NEW_VERSION${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Commit the changes: git add . && git commit -m 'Bump version to $NEW_VERSION'"
