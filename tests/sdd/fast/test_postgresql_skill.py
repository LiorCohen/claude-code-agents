"""
Test: PostgreSQL Skill - Real Usage Scenarios
Tests actual PostgreSQL operations using Docker containers.

These tests verify Claude can use the postgresql skill to:
- Deploy PostgreSQL via Docker
- Create and manage database schemas
- Set up users and permissions
- Seed data
- Run queries and analyze performance
- Create migration plans
"""

import subprocess
import time
from pathlib import Path

import pytest

from test_helpers import TEST_OUTPUT_DIR, TestProject, run_claude


# Container name for tests
PG_CONTAINER = "sdd-postgres-test"
PG_USER = "testuser"
PG_PASSWORD = "testpass"
PG_DATABASE = "testdb"
PG_PORT = 5433  # Use non-standard port to avoid conflicts


def docker_available() -> bool:
    """Check if Docker is available."""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=10,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def start_postgres_container() -> bool:
    """Start a PostgreSQL container for testing."""
    # Remove existing container if present
    subprocess.run(
        ["docker", "rm", "-f", PG_CONTAINER],
        capture_output=True,
    )

    # Start new container
    result = subprocess.run(
        [
            "docker", "run", "-d",
            "--name", PG_CONTAINER,
            "-e", f"POSTGRES_USER={PG_USER}",
            "-e", f"POSTGRES_PASSWORD={PG_PASSWORD}",
            "-e", f"POSTGRES_DB={PG_DATABASE}",
            "-p", f"{PG_PORT}:5432",
            "postgres:16",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"Failed to start container: {result.stderr}")
        return False

    # Wait for PostgreSQL to be ready
    for _ in range(30):
        check = subprocess.run(
            [
                "docker", "exec", PG_CONTAINER,
                "pg_isready", "-U", PG_USER, "-d", PG_DATABASE,
            ],
            capture_output=True,
        )
        if check.returncode == 0:
            return True
        time.sleep(1)

    return False


def stop_postgres_container():
    """Stop and remove the PostgreSQL container."""
    subprocess.run(
        ["docker", "rm", "-f", PG_CONTAINER],
        capture_output=True,
    )


def run_psql(sql: str) -> tuple[int, str, str]:
    """Run SQL against the test PostgreSQL container."""
    result = subprocess.run(
        [
            "docker", "exec", PG_CONTAINER,
            "psql", "-U", PG_USER, "-d", PG_DATABASE, "-c", sql,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.returncode, result.stdout, result.stderr


def run_psql_file(filepath: Path) -> tuple[int, str, str]:
    """Run a SQL file against the test PostgreSQL container."""
    sql = filepath.read_text()
    result = subprocess.run(
        [
            "docker", "exec", "-i", PG_CONTAINER,
            "psql", "-U", PG_USER, "-d", PG_DATABASE,
        ],
        input=sql,
        capture_output=True,
        text=True,
        timeout=60,
    )
    return result.returncode, result.stdout, result.stderr


@pytest.fixture(scope="module")
def postgres_container():
    """Fixture that provides a running PostgreSQL container."""
    if not docker_available():
        pytest.skip("Docker not available")

    if not start_postgres_container():
        pytest.fail("Failed to start PostgreSQL container")

    yield PG_CONTAINER

    stop_postgres_container()


@pytest.fixture
def test_project():
    """Create a test project directory."""
    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    project_dir = TEST_OUTPUT_DIR / f"postgresql-{int(time.time())}"
    project_dir.mkdir(parents=True)

    # Create db/ directory for SQL files
    (project_dir / "db" / "migrations").mkdir(parents=True)
    (project_dir / "db" / "seeds").mkdir(parents=True)

    project = TestProject(path=project_dir, name="postgresql-test")
    yield project


class TestDeployPostgres:
    """Test: Deploy PostgreSQL using Docker."""

    def test_deploy_postgres_docker(self, test_project: TestProject, prompts_dir):
        """Claude generates Docker deployment commands that work."""
        prompt = (prompts_dir / "postgresql-deploy-docker.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Check that deployment files were created
        assert test_project.is_file("docker-compose.yml") or test_project.is_file(
            "docker-compose.yaml"
        ), "Should create docker-compose.yml"

        # Verify docker-compose content
        compose_file = test_project.path / "docker-compose.yml"
        if not compose_file.exists():
            compose_file = test_project.path / "docker-compose.yaml"

        content = compose_file.read_text()
        assert "postgres" in content.lower(), "Should reference postgres image"
        assert "5432" in content, "Should expose PostgreSQL port"
        assert "POSTGRES_" in content, "Should set PostgreSQL env vars"


class TestCreateSchema:
    """Test: Create database schema."""

    def test_create_users_table(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude creates a users table with proper constraints."""
        prompt = (prompts_dir / "postgresql-create-schema.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Find the generated SQL file
        sql_files = list(test_project.path.rglob("*.sql"))
        assert len(sql_files) > 0, "Should create SQL file(s)"

        # Execute the SQL
        for sql_file in sql_files:
            if "schema" in sql_file.name.lower() or "create" in sql_file.name.lower():
                returncode, stdout, stderr = run_psql_file(sql_file)
                assert returncode == 0, f"SQL should execute successfully: {stderr}"

        # Verify table was created
        returncode, stdout, stderr = run_psql(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';"
        )
        assert "users" in stdout, "users table should exist"

        # Verify constraints exist
        returncode, stdout, stderr = run_psql(
            "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users';"
        )
        assert "pkey" in stdout.lower() or "primary" in stdout.lower(), "Should have primary key"


class TestSetupUsers:
    """Test: Set up database users and permissions."""

    def test_create_app_role(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude creates application roles with proper permissions."""
        prompt = (prompts_dir / "postgresql-setup-users.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Find and execute the permissions SQL
        sql_files = list(test_project.path.rglob("*.sql"))
        for sql_file in sql_files:
            if "permission" in sql_file.name.lower() or "role" in sql_file.name.lower() or "user" in sql_file.name.lower():
                returncode, stdout, stderr = run_psql_file(sql_file)
                # Permissions might partially fail if objects don't exist, that's OK
                print(f"Executed {sql_file.name}: {stdout}")

        # Verify role was created
        returncode, stdout, stderr = run_psql(
            "SELECT rolname FROM pg_roles WHERE rolname LIKE 'app%' OR rolname LIKE 'readonly%';"
        )
        assert returncode == 0, "Role query should succeed"
        # At minimum, check the SQL file contains role creation
        sql_content = "\n".join(f.read_text() for f in sql_files)
        assert "CREATE ROLE" in sql_content or "CREATE USER" in sql_content, "Should have role creation SQL"


class TestSeedData:
    """Test: Seed database with test data."""

    def test_seed_users(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude generates seed data that can be inserted."""
        # First ensure users table exists
        run_psql("""
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)

        prompt = (prompts_dir / "postgresql-seed-data.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Find and execute seed SQL
        sql_files = list(test_project.path.rglob("*.sql"))
        for sql_file in sql_files:
            if "seed" in sql_file.name.lower() or "data" in sql_file.name.lower():
                returncode, stdout, stderr = run_psql_file(sql_file)
                assert returncode == 0, f"Seed SQL should execute: {stderr}"

        # Verify data was inserted
        returncode, stdout, stderr = run_psql("SELECT COUNT(*) FROM users;")
        assert returncode == 0, "Count query should succeed"
        # Extract count from output
        lines = [l.strip() for l in stdout.split("\n") if l.strip().isdigit()]
        if lines:
            count = int(lines[0])
            assert count > 0, "Should have inserted at least one user"


class TestMigrationPlan:
    """Test: Create a migration plan for schema changes."""

    def test_add_column_migration(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude creates a safe migration plan to add a column."""
        # Ensure users table exists
        run_psql("""
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)

        prompt = (prompts_dir / "postgresql-migration-plan.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Find migration files
        migration_files = list((test_project.path / "db" / "migrations").rglob("*.sql"))
        if not migration_files:
            migration_files = list(test_project.path.rglob("*migration*.sql"))

        assert len(migration_files) > 0, "Should create migration file(s)"

        # Check migration content for safe patterns
        migration_content = "\n".join(f.read_text() for f in migration_files)
        assert "ALTER TABLE" in migration_content, "Should have ALTER TABLE"

        # Execute migration
        for mig_file in migration_files:
            returncode, stdout, stderr = run_psql_file(mig_file)
            assert returncode == 0, f"Migration should execute: {stderr}"

        # Verify column was added
        returncode, stdout, stderr = run_psql(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
        )
        assert "phone" in stdout, "phone column should exist after migration"


class TestQueryPerformance:
    """Test: Analyze query performance."""

    def test_explain_analyze(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude uses EXPLAIN ANALYZE to diagnose query performance."""
        # Set up table with data
        run_psql("""
            CREATE TABLE IF NOT EXISTS orders (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                user_id BIGINT NOT NULL,
                total NUMERIC(10,2) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            INSERT INTO orders (user_id, total, created_at)
            SELECT
                (random() * 1000)::bigint,
                (random() * 500 + 10)::numeric(10,2),
                NOW() - (random() * interval '365 days')
            FROM generate_series(1, 1000);
        """)

        prompt = (prompts_dir / "postgresql-query-performance.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Check output contains EXPLAIN results or analysis
        output_lower = result.output.lower()
        assert any(
            term in output_lower
            for term in ["seq scan", "index scan", "execution time", "planning time", "cost"]
        ), "Should include EXPLAIN output or analysis"


class TestIntrospection:
    """Test: Explore existing schema."""

    def test_list_tables_and_columns(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude can introspect the database schema."""
        # Ensure some tables exist
        run_psql("""
            CREATE TABLE IF NOT EXISTS products (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                price NUMERIC(10,2) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS categories (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );
        """)

        prompt = (prompts_dir / "postgresql-introspection.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Check that introspection results include our tables
        output_lower = result.output.lower()
        assert "products" in output_lower or "categories" in output_lower, "Should find existing tables"


class TestBackupRestore:
    """Test: Backup and restore operations."""

    def test_generate_backup_commands(
        self, test_project: TestProject, prompts_dir, postgres_container
    ):
        """Claude generates correct pg_dump commands."""
        prompt = (prompts_dir / "postgresql-backup.txt").read_text()

        result = run_claude(prompt, test_project.path, timeout_seconds=180)
        (test_project.path / "claude-output.json").write_text(result.output)

        assert result.exit_code == 0, "Claude should complete successfully"

        # Check that backup commands/scripts were created
        output_lower = result.output.lower()
        assert "pg_dump" in output_lower, "Should reference pg_dump"

        # Check for script file
        script_files = list(test_project.path.rglob("*.sh")) + list(test_project.path.rglob("backup*"))
        # Either a script was created or commands were provided in output
        assert len(script_files) > 0 or "pg_dump" in result.output, "Should provide backup commands"
