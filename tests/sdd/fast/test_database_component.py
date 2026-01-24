"""
Test: Database Component Type
Verifies that the database component scaffolding works correctly.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

# Get paths relative to this test file
TESTS_DIR = Path(__file__).parent.parent  # tests/sdd/
PLUGIN_DIR = TESTS_DIR.parent.parent / "full-stack-spec-driven-dev"
SKILLS_DIR = PLUGIN_DIR / "skills"
DATABASE_SKILL_DIR = SKILLS_DIR / "database-scaffolding"
DATABASE_TEMPLATES_DIR = DATABASE_SKILL_DIR / "templates"
SCAFFOLDING_SCRIPT = SKILLS_DIR / "scaffolding" / "scaffolding.py"


class TestDatabaseSkillStructure:
    """Test that the database-scaffolding skill has the correct structure."""

    def test_skill_directory_exists(self):
        """Database scaffolding skill directory should exist."""
        assert DATABASE_SKILL_DIR.is_dir(), f"Expected {DATABASE_SKILL_DIR} to exist"

    def test_skill_md_exists(self):
        """SKILL.md should exist in the database-scaffolding skill."""
        skill_md = DATABASE_SKILL_DIR / "SKILL.md"
        assert skill_md.is_file(), f"Expected {skill_md} to exist"

    def test_skill_md_has_required_frontmatter(self):
        """SKILL.md should have required frontmatter fields."""
        skill_md = DATABASE_SKILL_DIR / "SKILL.md"
        content = skill_md.read_text()

        assert "---" in content, "SKILL.md should have frontmatter delimiters"
        assert "name: database-scaffolding" in content, "SKILL.md should have name field"
        assert "description:" in content, "SKILL.md should have description field"

    def test_templates_directory_exists(self):
        """Templates directory should exist."""
        assert DATABASE_TEMPLATES_DIR.is_dir(), f"Expected {DATABASE_TEMPLATES_DIR} to exist"


class TestDatabaseTemplates:
    """Test that all required database templates exist and have correct content."""

    def test_package_json_exists(self):
        """package.json template should exist."""
        package_json = DATABASE_TEMPLATES_DIR / "package.json"
        assert package_json.is_file(), f"Expected {package_json} to exist"

    def test_package_json_has_scripts(self):
        """package.json should define migrate, seed, and reset scripts."""
        package_json = DATABASE_TEMPLATES_DIR / "package.json"
        content = json.loads(package_json.read_text())

        assert "scripts" in content, "package.json should have scripts section"
        scripts = content["scripts"]
        assert "migrate" in scripts, "package.json should have migrate script"
        assert "seed" in scripts, "package.json should have seed script"
        assert "reset" in scripts, "package.json should have reset script"

    def test_package_json_has_project_name_variable(self):
        """package.json should use {{PROJECT_NAME}} variable."""
        package_json = DATABASE_TEMPLATES_DIR / "package.json"
        content = package_json.read_text()
        assert "{{PROJECT_NAME}}" in content, "package.json should use {{PROJECT_NAME}} variable"

    def test_readme_exists(self):
        """README.md template should exist."""
        readme = DATABASE_TEMPLATES_DIR / "README.md"
        assert readme.is_file(), f"Expected {readme} to exist"

    def test_readme_documents_usage(self):
        """README.md should document npm run commands."""
        readme = DATABASE_TEMPLATES_DIR / "README.md"
        content = readme.read_text()

        assert "npm run migrate" in content, "README should document migrate command"
        assert "npm run seed" in content, "README should document seed command"
        assert "npm run reset" in content, "README should document reset command"

    def test_migrations_directory_exists(self):
        """migrations/ directory should exist with initial migration."""
        migrations_dir = DATABASE_TEMPLATES_DIR / "migrations"
        assert migrations_dir.is_dir(), f"Expected {migrations_dir} to exist"

        initial_migration = migrations_dir / "001_initial_schema.sql"
        assert initial_migration.is_file(), "Initial migration template should exist"

    def test_initial_migration_has_transaction(self):
        """Initial migration should use BEGIN/COMMIT for transaction safety."""
        initial_migration = DATABASE_TEMPLATES_DIR / "migrations" / "001_initial_schema.sql"
        content = initial_migration.read_text()

        assert "BEGIN;" in content, "Migration should start with BEGIN"
        assert "COMMIT;" in content, "Migration should end with COMMIT"

    def test_seeds_directory_exists(self):
        """seeds/ directory should exist with initial seed file."""
        seeds_dir = DATABASE_TEMPLATES_DIR / "seeds"
        assert seeds_dir.is_dir(), f"Expected {seeds_dir} to exist"

        initial_seed = seeds_dir / "001_seed_data.sql"
        assert initial_seed.is_file(), "Initial seed template should exist"

    def test_initial_seed_mentions_idempotency(self):
        """Initial seed should mention ON CONFLICT for idempotency."""
        initial_seed = DATABASE_TEMPLATES_DIR / "seeds" / "001_seed_data.sql"
        content = initial_seed.read_text()

        assert "ON CONFLICT" in content, "Seed template should mention ON CONFLICT pattern"

    def test_scripts_directory_exists(self):
        """scripts/ directory should exist with all management scripts."""
        scripts_dir = DATABASE_TEMPLATES_DIR / "scripts"
        assert scripts_dir.is_dir(), f"Expected {scripts_dir} to exist"

        assert (scripts_dir / "migrate.sh").is_file(), "migrate.sh should exist"
        assert (scripts_dir / "seed.sh").is_file(), "seed.sh should exist"
        assert (scripts_dir / "reset.sh").is_file(), "reset.sh should exist"

    def test_migrate_script_has_shebang(self):
        """migrate.sh should have proper shebang."""
        migrate_script = DATABASE_TEMPLATES_DIR / "scripts" / "migrate.sh"
        content = migrate_script.read_text()

        assert content.startswith("#!/bin/bash"), "migrate.sh should start with #!/bin/bash"
        assert "set -e" in content, "migrate.sh should use set -e for error handling"

    def test_seed_script_has_shebang(self):
        """seed.sh should have proper shebang."""
        seed_script = DATABASE_TEMPLATES_DIR / "scripts" / "seed.sh"
        content = seed_script.read_text()

        assert content.startswith("#!/bin/bash"), "seed.sh should start with #!/bin/bash"
        assert "set -e" in content, "seed.sh should use set -e for error handling"

    def test_reset_script_has_safety_check(self):
        """reset.sh should have a safety confirmation prompt."""
        reset_script = DATABASE_TEMPLATES_DIR / "scripts" / "reset.sh"
        content = reset_script.read_text()

        assert "WARNING" in content or "Are you sure" in content, "reset.sh should warn about destructive action"


class TestScaffoldingScript:
    """Test that the scaffolding script handles database component correctly."""

    def test_scaffolding_script_references_database(self):
        """scaffolding.py should reference database component."""
        content = SCAFFOLDING_SCRIPT.read_text()

        assert "database" in content, "scaffolding.py should reference database component"
        assert "database-scaffolding" in content, "scaffolding.py should reference database-scaffolding skill"

    def test_scaffolding_script_creates_database_directories(self):
        """scaffolding.py should create database directories."""
        content = SCAFFOLDING_SCRIPT.read_text()

        assert "components/database" in content, "scaffolding.py should create components/database"
        assert "components/database/migrations" in content, "scaffolding.py should create migrations dir"
        assert "components/database/seeds" in content, "scaffolding.py should create seeds dir"
        assert "components/database/scripts" in content, "scaffolding.py should create scripts dir"

    def test_scaffolding_creates_database_component(self):
        """Running scaffolding.py with database component should create correct structure."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            target_dir = Path(tmp_dir) / "test-project"
            target_dir.mkdir()

            # Create config
            config = {
                "project_name": "test-project",
                "project_description": "Test project",
                "primary_domain": "Testing",
                "target_dir": str(target_dir),
                "components": ["database", "config"],
                "skills_dir": str(SKILLS_DIR),
            }

            config_file = Path(tmp_dir) / "config.json"
            config_file.write_text(json.dumps(config))

            # Run scaffolding
            result = subprocess.run(
                [sys.executable, str(SCAFFOLDING_SCRIPT), "--config", str(config_file)],
                capture_output=True,
                text=True,
                cwd=tmp_dir,
            )

            assert result.returncode == 0, f"Scaffolding failed: {result.stderr}"

            # Verify database structure
            db_dir = target_dir / "components" / "database"
            assert db_dir.is_dir(), "components/database should be created"
            assert (db_dir / "package.json").is_file(), "database/package.json should exist"
            assert (db_dir / "README.md").is_file(), "database/README.md should exist"
            assert (db_dir / "migrations").is_dir(), "database/migrations should exist"
            assert (db_dir / "seeds").is_dir(), "database/seeds should exist"
            assert (db_dir / "scripts").is_dir(), "database/scripts should exist"
            assert (db_dir / "scripts" / "migrate.sh").is_file(), "migrate.sh should exist"
            assert (db_dir / "scripts" / "seed.sh").is_file(), "seed.sh should exist"
            assert (db_dir / "scripts" / "reset.sh").is_file(), "reset.sh should exist"

    def test_scaffolding_substitutes_project_name(self):
        """Scaffolding should substitute {{PROJECT_NAME}} in templates."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            target_dir = Path(tmp_dir) / "my-app"
            target_dir.mkdir()

            config = {
                "project_name": "my-app",
                "project_description": "My application",
                "primary_domain": "Testing",
                "target_dir": str(target_dir),
                "components": ["database", "config"],
                "skills_dir": str(SKILLS_DIR),
            }

            config_file = Path(tmp_dir) / "config.json"
            config_file.write_text(json.dumps(config))

            result = subprocess.run(
                [sys.executable, str(SCAFFOLDING_SCRIPT), "--config", str(config_file)],
                capture_output=True,
                text=True,
                cwd=tmp_dir,
            )

            assert result.returncode == 0, f"Scaffolding failed: {result.stderr}"

            # Check variable substitution
            package_json = target_dir / "components" / "database" / "package.json"
            content = package_json.read_text()

            assert "my-app-database" in content, "Project name should be substituted"
            assert "{{PROJECT_NAME}}" not in content, "Template variable should be replaced"


class TestDocumentationConsistency:
    """Test that documentation across files is consistent about database component."""

    def test_scaffolding_skill_md_lists_database(self):
        """skills/scaffolding/SKILL.md should list database component."""
        skill_md = SKILLS_DIR / "scaffolding" / "SKILL.md"
        content = skill_md.read_text()

        assert "database" in content.lower(), "Scaffolding SKILL.md should mention database"
        assert "database-scaffolding" in content, "Should reference database-scaffolding skill"

    def test_project_settings_skill_includes_database(self):
        """skills/project-settings/SKILL.md should include database in schema."""
        skill_md = SKILLS_DIR / "project-settings" / "SKILL.md"
        content = skill_md.read_text()

        assert "database:" in content, "project-settings should include database field"
        assert "database: true" in content or "database: false" in content, \
            "project-settings should show database boolean examples"

    def test_sdd_init_command_includes_database_option(self):
        """commands/sdd-init.md should include database in project type options."""
        command_md = PLUGIN_DIR / "commands" / "sdd-init.md"
        content = command_md.read_text()

        assert "Database" in content, "sdd-init should mention Database component"
        assert "Backend with Database" in content, "sdd-init should have Backend with Database option"

    def test_planner_agent_knows_about_database(self):
        """agents/planner.md should list database in standard components."""
        agent_md = PLUGIN_DIR / "agents" / "planner.md"
        content = agent_md.read_text()

        assert "Database" in content, "Planner should know about Database component"
        assert "components/database" in content, "Planner should know database path"

    def test_readme_shows_database_in_structure(self):
        """README.md should show database in project structure."""
        readme = PLUGIN_DIR / "README.md"
        content = readme.read_text()

        assert "database/" in content, "README should show database in structure"


class TestBackendDevIntegration:
    """Test that backend-dev agent documentation integrates with database component."""

    def test_backend_dev_references_database_component(self):
        """backend-dev.md should reference the database component."""
        agent_md = PLUGIN_DIR / "agents" / "backend-dev.md"
        content = agent_md.read_text()

        assert "components/database" in content, "backend-dev should reference database component"
        assert "migrations/" in content, "backend-dev should mention migrations"
        assert "seeds/" in content, "backend-dev should mention seeds"

    def test_backend_dev_references_postgresql_skill(self):
        """backend-dev.md should reference postgresql skill for patterns."""
        agent_md = PLUGIN_DIR / "agents" / "backend-dev.md"
        content = agent_md.read_text()

        assert "postgresql" in content.lower(), "backend-dev should reference postgresql skill"


class TestDevopsIntegration:
    """Test that devops agent documentation integrates with database component."""

    def test_devops_references_database_component(self):
        """devops.md should reference database deployment patterns."""
        agent_md = PLUGIN_DIR / "agents" / "devops.md"
        content = agent_md.read_text()

        assert "database" in content.lower(), "devops should mention database"
        assert "components/database" in content, "devops should reference database component path"

    def test_devops_mentions_database_deployment(self):
        """devops.md should mention database deployment strategies."""
        agent_md = PLUGIN_DIR / "agents" / "devops.md"
        content = agent_md.read_text()

        # Should mention at least one deployment pattern
        has_deployment_pattern = any([
            "StatefulSet" in content,
            "migrations" in content.lower(),
            "PostgreSQL" in content,
        ])
        assert has_deployment_pattern, "devops should mention database deployment patterns"
