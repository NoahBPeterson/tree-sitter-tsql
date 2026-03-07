#!/bin/bash
# Verify disputed SQL syntax against real SQL Server instances via Docker.
#
# Spins up SQL Server containers for multiple versions, executes each test
# case with real tables/objects, and reports which versions accept/reject.
#
# Usage:
#   ./tools/verify-sqlserver.sh                    # Run all tests
#   ./tools/verify-sqlserver.sh --keep             # Don't stop containers after
#   ./tools/verify-sqlserver.sh --versions "2019 2022"  # Specific versions only
#   ./tools/verify-sqlserver.sh --test "test name"      # Run specific test
#
# Requires: Docker Desktop running (uses --platform linux/amd64 on ARM64)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_FILE="$SCRIPT_DIR/sqlserver-test-cases.json"
SA_PASSWORD='TreeS!tter2024#Strong'
CONTAINER_PREFIX="tsql-verify"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse args
KEEP_CONTAINERS=0
VERSIONS="2017 2019 2022"
TEST_FILTER=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --keep) KEEP_CONTAINERS=1; shift ;;
        --versions) VERSIONS="$2"; shift 2 ;;
        --test) TEST_FILTER="$2"; shift 2 ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# Map version to Docker image
get_image() {
    case "$1" in
        2017) echo "mcr.microsoft.com/mssql/server:2017-latest" ;;
        2019) echo "mcr.microsoft.com/mssql/server:2019-latest" ;;
        2022) echo "mcr.microsoft.com/mssql/server:2022-latest" ;;
        edge) echo "mcr.microsoft.com/azure-sql-edge:latest" ;;
        *) echo "Unknown version: $1" >&2; exit 1 ;;
    esac
}

get_port() {
    case "$1" in
        2017) echo 14330 ;;
        2019) echo 14331 ;;
        2022) echo 14332 ;;
        edge) echo 14333 ;;
    esac
}

get_compat() {
    case "$1" in
        2017) echo "140" ;;
        2019) echo "150" ;;
        2022) echo "160" ;;
        edge) echo "150" ;;
    esac
}

# Start a SQL Server container
start_container() {
    local version="$1"
    local image=$(get_image "$version")
    local port=$(get_port "$version")
    local name="${CONTAINER_PREFIX}-${version}"

    # Check if already running
    if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
        echo -e "  ${GREEN}RUNNING${NC} $name (port $port)"
        return 0
    fi

    # Remove stopped container if exists
    docker rm -f "$name" 2>/dev/null || true

    echo -e "  ${CYAN}STARTING${NC} $name ($image, port $port)..."

    # Determine platform flag (needed for ARM64 Macs)
    local platform_flag=""
    if [[ "$(uname -m)" == "arm64" ]]; then
        platform_flag="--platform linux/amd64"
    fi

    docker run -d \
        $platform_flag \
        --name "$name" \
        -e "ACCEPT_EULA=Y" \
        -e "MSSQL_SA_PASSWORD=$SA_PASSWORD" \
        -p "${port}:1433" \
        "$image" >/dev/null 2>&1

    # Wait for SQL Server to be ready
    echo -n "  Waiting for SQL Server $version..."
    local retries=0
    local max_retries=60
    while [ $retries -lt $max_retries ]; do
        if docker exec "$name" /opt/mssql-tools*/bin/sqlcmd \
            -S localhost -U sa -P "$SA_PASSWORD" \
            -Q "SELECT 1" -b 2>/dev/null | grep -q "1"; then
            echo -e " ${GREEN}ready${NC}"
            return 0
        fi
        sleep 2
        retries=$((retries + 1))
        echo -n "."
    done
    echo -e " ${RED}TIMEOUT${NC}"
    return 1
}

# Execute SQL against a container, return exit code
exec_sql() {
    local version="$1"
    local sql="$2"
    local name="${CONTAINER_PREFIX}-${version}"

    # Find sqlcmd path (varies between versions)
    local sqlcmd_path
    sqlcmd_path=$(docker exec "$name" bash -c 'ls /opt/mssql-tools*/bin/sqlcmd 2>/dev/null | head -1')

    local output
    output=$(docker exec "$name" "$sqlcmd_path" \
        -S localhost -U sa -P "$SA_PASSWORD" \
        -Q "$sql" -b 2>&1) || true

    # Check for errors — sqlcmd -b returns non-zero on errors
    if echo "$output" | grep -qE "^Msg [0-9]+,"; then
        # Extract error message
        local err_msg
        err_msg=$(echo "$output" | grep "^Msg " | head -1)
        echo "$err_msg"
        return 1
    fi
    return 0
}

# Stop containers
stop_containers() {
    for version in $VERSIONS; do
        local name="${CONTAINER_PREFIX}-${version}"
        if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
            echo "  Stopping $name..."
            docker stop "$name" >/dev/null 2>&1
            docker rm "$name" >/dev/null 2>&1
        fi
    done
}

# ============================================================
# Main
# ============================================================

if [ ! -f "$TESTS_FILE" ]; then
    echo "Error: Test cases file not found: $TESTS_FILE"
    exit 1
fi

echo "======================================"
echo "SQL Server Docker Verification"
echo "======================================"
echo ""

# Start containers
echo "Starting SQL Server containers..."
for version in $VERSIONS; do
    start_container "$version" || {
        echo "Failed to start SQL Server $version"
        exit 1
    }
done
echo ""

# Load and run tests
echo "Running tests..."
echo ""

TOTAL=0
PASS_ALL=0
FAIL_SOME=0

# Parse test cases with python3
python3 -c "
import json, sys

with open('$TESTS_FILE') as f:
    data = json.load(f)

test_filter = '''$TEST_FILTER'''

for test in data.get('tests', []):
    name = test['name']
    if test_filter and test_filter not in name:
        continue
    setup = test.get('setup', '')
    sql = test['sql']
    teardown = test.get('teardown', '')
    expected = test.get('expected', 'accept')
    description = test.get('description', '')

    # Output as tab-separated for bash to parse
    # Escape newlines in SQL
    setup_esc = setup.replace('\n', '\\\\n')
    sql_esc = sql.replace('\n', '\\\\n')
    teardown_esc = teardown.replace('\n', '\\\\n')
    print(f'{name}\t{setup_esc}\t{sql_esc}\t{teardown_esc}\t{expected}\t{description}')
" | while IFS=$'\t' read -r name setup sql teardown expected description; do
    TOTAL=$((TOTAL + 1))

    # Print test name
    printf "  %-60s" "$name"

    results=""
    all_pass=1

    for version in $VERSIONS; do
        # Run setup
        if [ -n "$setup" ]; then
            setup_real=$(echo -e "$setup")
            exec_sql "$version" "$setup_real" >/dev/null 2>&1 || true
        fi

        # Run test SQL
        sql_real=$(echo -e "$sql")
        err_output=$(exec_sql "$version" "$sql_real" 2>&1)
        test_exit=$?

        # Run teardown
        if [ -n "$teardown" ]; then
            teardown_real=$(echo -e "$teardown")
            exec_sql "$version" "$teardown_real" >/dev/null 2>&1 || true
        fi

        if [ $test_exit -eq 0 ]; then
            results="${results} ${version}:${GREEN}PASS${NC}"
        else
            results="${results} ${version}:${RED}FAIL${NC}"
            all_pass=0
            # Show error on failure
            err_short=$(echo "$err_output" | head -1 | cut -c1-60)
        fi
    done

    echo -e "$results"

    if [ $all_pass -eq 0 ] && [ -n "${err_short:-}" ]; then
        echo "    Error: $err_short"
    fi
done

echo ""

# Cleanup
if [ $KEEP_CONTAINERS -eq 0 ]; then
    echo "Stopping containers..."
    stop_containers
else
    echo "Containers left running (--keep). Stop with:"
    echo "  docker stop ${CONTAINER_PREFIX}-{2017,2019,2022}"
fi
