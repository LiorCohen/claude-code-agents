#!/usr/bin/env python3
"""
SDD Project Scaffolding Script

Creates project structure from templates with variable substitution.
Called by Claude after user approves project configuration.

Templates are colocated with their scaffolding skills:
- skills/project-scaffolding/templates/ - Root files, specs, config
- skills/backend-scaffolding/templates/ - Server components
- skills/frontend-scaffolding/templates/ - Webapp components
- skills/contract-scaffolding/templates/ - Contract component

Usage:
    python scaffolding.py --config config.json

Config JSON format:
{
    "project_name": "my-app",
    "project_description": "My application",
    "primary_domain": "E-commerce",
    "target_dir": "/path/to/output",
    "components": ["contract", "server", "webapp", "config"],
    "skills_dir": "/path/to/skills"
}
"""

import argparse
import json
import shutil
import sys
from pathlib import Path
from typing import TypedDict


class Config(TypedDict):
    project_name: str
    project_description: str
    primary_domain: str
    target_dir: str
    components: list[str]
    skills_dir: str


class ParsedComponent(TypedDict):
    component_type: str  # "server", "webapp", etc.
    name: str | None     # None for simple format, custom name for "type:name" format
    dir_name: str        # Directory name: "server", "server-api", "webapp-admin", etc.


def parse_component(component: str) -> ParsedComponent:
    """
    Parse component specification into type, name, and directory name.

    Formats:
    - Simple: "server" -> type=server, name=None, dir_name=server
    - Named: "server:api" -> type=server, name=api, dir_name=server-api
    """
    if ":" in component:
        component_type, name = component.split(":", 1)
        return {
            "component_type": component_type,
            "name": name,
            "dir_name": f"{component_type}-{name}",
        }
    return {
        "component_type": component,
        "name": None,
        "dir_name": component,
    }


def get_components_by_type(components: list[str], component_type: str) -> list[ParsedComponent]:
    """Get all components of a specific type."""
    return [
        parse_component(c)
        for c in components
        if parse_component(c)["component_type"] == component_type
    ]


def has_component_type(components: list[str], component_type: str) -> bool:
    """Check if any component of the given type exists."""
    return any(parse_component(c)["component_type"] == component_type for c in components)


def substitute_variables(content: str, config: Config) -> str:
    """Replace template variables with config values."""
    replacements = {
        "{{PROJECT_NAME}}": config["project_name"],
        "{{PROJECT_DESCRIPTION}}": config["project_description"],
        "{{PRIMARY_DOMAIN}}": config["primary_domain"],
    }
    for var, value in replacements.items():
        content = content.replace(var, value)
    return content


def copy_template_file(
    src: Path, dest: Path, config: Config, substitute: bool = True
) -> None:
    """Copy a template file, optionally substituting variables."""
    dest.parent.mkdir(parents=True, exist_ok=True)

    if substitute and src.suffix in [".md", ".json", ".yaml", ".yml", ".ts", ".tsx", ".html", ".css", ".js"]:
        content = src.read_text()
        content = substitute_variables(content, config)
        dest.write_text(content)
    else:
        shutil.copy2(src, dest)

    print(f"  Created: {dest.relative_to(config['target_dir'])}")


def create_directory(path: Path, config: Config) -> None:
    """Create a directory if it doesn't exist."""
    path.mkdir(parents=True, exist_ok=True)
    print(f"  Created: {path.relative_to(config['target_dir'])}/")


def scaffold_project(config: Config) -> dict:
    """Create the complete project structure."""
    target = Path(config["target_dir"])
    skills_dir = Path(config["skills_dir"])
    components_raw = config["components"]

    # Template locations (colocated with skills)
    project_templates = skills_dir / "project-scaffolding" / "templates"
    backend_templates = skills_dir / "backend-scaffolding" / "templates"
    frontend_templates = skills_dir / "frontend-scaffolding" / "templates"
    contract_templates = skills_dir / "contract-scaffolding" / "templates"
    database_templates = skills_dir / "database-scaffolding" / "templates"

    # Parse all components
    parsed_components = [parse_component(c) for c in components_raw]
    component_types = {pc["component_type"] for pc in parsed_components}

    created_files = []
    created_dirs = []

    # Create target directory
    target.mkdir(parents=True, exist_ok=True)

    # Build display string for components
    component_display = []
    for pc in parsed_components:
        if pc["name"]:
            component_display.append(f"{pc['component_type']}:{pc['name']}")
        else:
            component_display.append(pc["component_type"])

    print(f"\nScaffolding project: {config['project_name']}")
    print(f"Target: {target}")
    print(f"Components: {', '.join(component_display)}")
    print()

    # -------------------------------------------------------------------------
    # Step 1: Create root .gitignore
    # -------------------------------------------------------------------------
    print("Creating root files...")
    gitignore = target / ".gitignore"
    gitignore.write_text("""node_modules/
.env
.DS_Store
dist/
*.log
""")
    created_files.append(".gitignore")
    print("  Created: .gitignore")

    # -------------------------------------------------------------------------
    # Step 2: Create directory structure
    # -------------------------------------------------------------------------
    print("\nCreating directory structure...")

    # Always create specs directories
    specs_dirs = [
        "specs",
        "specs/domain",
        "specs/domain/definitions",
        "specs/domain/use-cases",
        "specs/architecture",
        "specs/changes",
        "specs/external",
    ]
    for d in specs_dirs:
        create_directory(target / d, config)
        created_dirs.append(d)

    # Config is always created
    config_dirs = [
        "components/config",
        "components/config/schemas",
    ]
    for d in config_dirs:
        create_directory(target / d, config)
        created_dirs.append(d)

    # Component-specific directories
    if "contract" in component_types:
        create_directory(target / "components/contract", config)
        created_dirs.append("components/contract")

    # Server components (supports multiple instances)
    server_components = get_components_by_type(components_raw, "server")
    for server in server_components:
        dir_name = server["dir_name"]
        server_subdirs = [
            f"components/{dir_name}/src/operator",
            f"components/{dir_name}/src/config",
            f"components/{dir_name}/src/controller/http_handlers",
            f"components/{dir_name}/src/model/definitions",
            f"components/{dir_name}/src/model/use-cases",
            f"components/{dir_name}/src/dal",
        ]
        for d in server_subdirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    # Webapp components (supports multiple instances)
    webapp_components = get_components_by_type(components_raw, "webapp")
    for webapp in webapp_components:
        dir_name = webapp["dir_name"]
        webapp_subdirs = [
            f"components/{dir_name}/src/pages",
            f"components/{dir_name}/src/components",
            f"components/{dir_name}/src/viewmodels",
            f"components/{dir_name}/src/models",
            f"components/{dir_name}/src/services",
            f"components/{dir_name}/src/stores",
            f"components/{dir_name}/src/types",
            f"components/{dir_name}/src/utils",
        ]
        for d in webapp_subdirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    if "helm" in component_types:
        create_directory(target / "components/helm", config)
        created_dirs.append("components/helm")

    if "testing" in component_types:
        testing_dirs = [
            "components/testing/tests/integration",
            "components/testing/tests/component",
            "components/testing/tests/e2e",
            "components/testing/testsuites",
        ]
        for d in testing_dirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    if "cicd" in component_types:
        create_directory(target / ".github/workflows", config)
        created_dirs.append(".github/workflows")

    if "database" in component_types:
        database_dirs = [
            "components/database",
            "components/database/migrations",
            "components/database/seeds",
            "components/database/scripts",
        ]
        for d in database_dirs:
            create_directory(target / d, config)
            created_dirs.append(d)

    # -------------------------------------------------------------------------
    # Step 3: Copy and customize template files
    # -------------------------------------------------------------------------
    print("\nCopying template files...")

    # Root project files (from project-scaffolding skill)
    project_files_dir = project_templates / "project"
    if project_files_dir.exists():
        for template_file in ["README.md", "CLAUDE.md", "package.json"]:
            src = project_files_dir / template_file
            if src.exists():
                copy_template_file(src, target / template_file, config)
                created_files.append(template_file)

    # Spec files (from project-scaffolding skill)
    specs_files_dir = project_templates / "specs"
    if specs_files_dir.exists():
        spec_files = [
            ("INDEX.md", "specs/INDEX.md"),
            ("SNAPSHOT.md", "specs/SNAPSHOT.md"),
            ("glossary.md", "specs/domain/glossary.md"),
        ]
        for src_name, dest_path in spec_files:
            src = specs_files_dir / src_name
            if src.exists():
                copy_template_file(src, target / dest_path, config)
                created_files.append(dest_path)

    # Architecture overview (generate, not from template)
    arch_overview = target / "specs/architecture/overview.md"
    arch_content = f"""# Architecture Overview

This document describes the architecture of {config['project_name']}.

## Components

"""
    # Static component descriptions
    static_descriptions = {
        "contract": "- **Contract** (`components/contract/`): OpenAPI specifications and type generation",
        "config": "- **Config** (`components/config/`): YAML-based configuration management",
        "database": "- **Database** (`components/database/`): PostgreSQL migrations, seeds, and management scripts",
        "helm": "- **Helm** (`components/helm/`): Kubernetes deployment charts",
        "testing": "- **Testing** (`components/testing/`): Testkube test definitions",
    }

    # Add static components
    for comp_type in ["contract", "config", "database", "helm", "testing"]:
        if comp_type in component_types:
            arch_content += static_descriptions[comp_type] + "\n"

    # Add server components (may be multiple)
    for server in server_components:
        dir_name = server["dir_name"]
        display_name = server["name"] or "Server"
        arch_content += f"- **{display_name.title()}** (`components/{dir_name}/`): Node.js/TypeScript backend with CMDO architecture\n"

    # Add webapp components (may be multiple)
    for webapp in webapp_components:
        dir_name = webapp["dir_name"]
        display_name = webapp["name"] or "Webapp"
        arch_content += f"- **{display_name.title()}** (`components/{dir_name}/`): React/TypeScript frontend with MVVM pattern\n"

    arch_overview.write_text(arch_content)
    created_files.append("specs/architecture/overview.md")
    print("  Created: specs/architecture/overview.md")

    # Config component (from project-scaffolding skill, always created)
    config_files_dir = project_templates / "config"
    if config_files_dir.exists():
        config_files = [
            "config.yaml",
            "config-local.yaml",
            "config-testing.yaml",
            "config-production.yaml",
            "schemas/schema.json",
            "schemas/ops-schema.json",
            "schemas/app-schema.json",
        ]
        for cf in config_files:
            src = config_files_dir / cf
            if src.exists():
                copy_template_file(src, target / "components/config" / cf, config)
                created_files.append(f"components/config/{cf}")

    # Contract component (from contract-scaffolding skill)
    if "contract" in component_types:
        if contract_templates.exists():
            contract_files = ["package.json", "openapi.yaml"]
            for cf in contract_files:
                src = contract_templates / cf
                if src.exists():
                    copy_template_file(src, target / "components/contract" / cf, config)
                    created_files.append(f"components/contract/{cf}")

        # Create contract .gitignore
        contract_gitignore = target / "components/contract/.gitignore"
        contract_gitignore.write_text("node_modules/\ngenerated/\n")
        created_files.append("components/contract/.gitignore")
        print("  Created: components/contract/.gitignore")

    # Server components (from backend-scaffolding skill, supports multiple instances)
    if backend_templates.exists():
        for server in server_components:
            dir_name = server["dir_name"]

            # Walk through all server template files
            for src_file in backend_templates.rglob("*"):
                if src_file.is_file():
                    rel_path = src_file.relative_to(backend_templates)
                    dest_file = target / f"components/{dir_name}" / rel_path
                    copy_template_file(src_file, dest_file, config)
                    created_files.append(f"components/{dir_name}/{rel_path}")

    # Webapp components (from frontend-scaffolding skill, supports multiple instances)
    if frontend_templates.exists():
        for webapp in webapp_components:
            dir_name = webapp["dir_name"]

            # Walk through all webapp template files
            for src_file in frontend_templates.rglob("*"):
                if src_file.is_file():
                    rel_path = src_file.relative_to(frontend_templates)
                    dest_file = target / f"components/{dir_name}" / rel_path
                    copy_template_file(src_file, dest_file, config)
                    created_files.append(f"components/{dir_name}/{rel_path}")

    # Database component (from database-scaffolding skill)
    if "database" in component_types:
        if database_templates.exists():
            # Walk through all database template files
            for src_file in database_templates.rglob("*"):
                if src_file.is_file():
                    rel_path = src_file.relative_to(database_templates)
                    dest_file = target / "components/database" / rel_path
                    copy_template_file(src_file, dest_file, config)
                    created_files.append(f"components/database/{rel_path}")

    # CI/CD workflows
    if "cicd" in component_types:
        ci_workflow = target / ".github/workflows/ci.yaml"

        # Build list of workspaces for CI
        workspaces = []
        if "contract" in component_types:
            workspaces.append("components/contract")
        for server in server_components:
            workspaces.append(f"components/{server['dir_name']}")
        for webapp in webapp_components:
            workspaces.append(f"components/{webapp['dir_name']}")

        ci_content = """name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --workspaces

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build
"""
        ci_workflow.write_text(ci_content)
        created_files.append(".github/workflows/ci.yaml")
        print("  Created: .github/workflows/ci.yaml")

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print(f"\n{'='*60}")
    print("Scaffolding complete!")
    print(f"{'='*60}")
    print(f"Created {len(created_dirs)} directories")
    print(f"Created {len(created_files)} files")
    print(f"Location: {target}")

    return {
        "success": True,
        "target_dir": str(target),
        "created_dirs": len(created_dirs),
        "created_files": len(created_files),
        "files": created_files,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="SDD Project Scaffolding")
    parser.add_argument(
        "--config",
        required=True,
        help="Path to JSON config file",
    )
    parser.add_argument(
        "--json-output",
        action="store_true",
        help="Output result as JSON",
    )

    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}", file=sys.stderr)
        return 1

    with open(config_path) as f:
        config: Config = json.load(f)

    # Support both old template_dir and new skills_dir
    if "skills_dir" not in config and "template_dir" in config:
        # Legacy support: derive skills_dir from template_dir
        # template_dir was typically <plugin>/templates, skills_dir is <plugin>/skills
        template_dir = Path(config["template_dir"])
        config["skills_dir"] = str(template_dir.parent / "skills")

    # Validate required fields
    required = ["project_name", "target_dir", "components", "skills_dir"]
    for field in required:
        if field not in config:
            print(f"Error: Missing required config field: {field}", file=sys.stderr)
            return 1

    # Set defaults
    config.setdefault("project_description", f"A {config['project_name']} project")
    config.setdefault("primary_domain", "General")

    # Run scaffolding
    try:
        result = scaffold_project(config)

        if args.json_output:
            print(json.dumps(result, indent=2))

        return 0 if result["success"] else 1

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if args.json_output:
            print(json.dumps({"success": False, "error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
