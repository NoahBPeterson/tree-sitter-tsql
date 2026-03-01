#!/bin/bash
# Verify tree-sitter test cases against the SQL parser oracle.
# Extracts SQL from test corpus files and checks:
#   - Positive tests: oracle should parse successfully (exit 0)
#   - Negative tests: oracle should fail to parse (exit 1)
#
# Known intentional mismatches are listed in verify-ignore.json
# and reported separately (not counted as failures).
#
# Usage: ./tools/verify-tests.sh [test_file.txt ...]
# If no files given, processes all test/corpus/*.txt files.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORACLE="$SCRIPT_DIR/sql-parser-oracle/bin/Release/net10.0/sql-parser-oracle"
CORPUS_DIR="$SCRIPT_DIR/../test/corpus"
IGNORE_FILE="$SCRIPT_DIR/verify-ignore.json"

# Build if needed
if [ ! -f "$ORACLE" ]; then
    echo "Building oracle..."
    dotnet build -c Release "$SCRIPT_DIR/sql-parser-oracle/" >/dev/null 2>&1
fi

# Load ignore list using python3 for reliable JSON parsing
IGNORED_TESTS=""
if [ -f "$IGNORE_FILE" ]; then
    IGNORED_TESTS=$(python3 -c "
import json
with open('$IGNORE_FILE') as f:
    data = json.load(f)
for name in data.get('ignored', {}):
    print(name)
" 2>/dev/null)
fi

is_ignored() {
    local test_name="$1"
    echo "$IGNORED_TESTS" | grep -qFx "$test_name"
}

get_ignore_reason() {
    local test_name="$1"
    python3 -c "
import json, sys
with open('$IGNORE_FILE') as f:
    data = json.load(f)
entry = data.get('ignored', {}).get(sys.argv[1], {})
print(entry.get('reason', 'No reason given'))
" "$test_name" 2>/dev/null || echo "No reason given"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_IGNORED=0
TOTAL_TESTS=0

# Temp files for collecting results
MISMATCH_FILE=$(mktemp)
IGNORED_FILE=$(mktemp)
trap "rm -f $MISMATCH_FILE $IGNORED_FILE" EXIT

# Get list of files to process
if [ $# -gt 0 ]; then
    FILES="$@"
else
    FILES=$(ls "$CORPUS_DIR"/*.txt)
fi

for testfile in $FILES; do
    filename=$(basename "$testfile")
    is_negative=0
    if [ "$filename" = "negative_tests.txt" ]; then
        is_negative=1
    fi

    file_pass=0
    file_fail=0
    file_ignored=0

    state="looking_for_header"
    test_name=""
    sql_lines=""

    while IFS= read -r line || [ -n "$line" ]; do
        case "$state" in
            looking_for_header)
                if [[ "$line" =~ ^=====+ ]]; then
                    state="reading_header"
                    test_name=""
                fi
                ;;
            reading_header)
                if [[ "$line" =~ ^=====+ ]]; then
                    state="reading_sql"
                    sql_lines=""
                else
                    test_name="${test_name:+$test_name }$line"
                fi
                ;;
            reading_sql)
                if [[ "$line" =~ ^---+$ ]]; then
                    if [ -n "$sql_lines" ]; then
                        # Run oracle with compiled binary
                        echo "$sql_lines" | "$ORACLE" --quiet 2>/dev/null
                        oracle_exit=$?

                        if [ $is_negative -eq 1 ]; then
                            if [ $oracle_exit -ne 0 ]; then
                                file_pass=$((file_pass + 1))
                            elif is_ignored "$test_name"; then
                                file_ignored=$((file_ignored + 1))
                                reason=$(get_ignore_reason "$test_name")
                                echo "  ${test_name}" >> "$IGNORED_FILE"
                                echo "    Reason: ${reason}" >> "$IGNORED_FILE"
                            else
                                file_fail=$((file_fail + 1))
                                sql_first=$(echo "$sql_lines" | head -1)
                                echo "  ORACLE_PASS [${filename}] \"${test_name}\": negative test but oracle accepts it" >> "$MISMATCH_FILE"
                                echo "    SQL: $sql_first" >> "$MISMATCH_FILE"
                            fi
                        else
                            if [ $oracle_exit -eq 0 ]; then
                                file_pass=$((file_pass + 1))
                            else
                                file_fail=$((file_fail + 1))
                                sql_first=$(echo "$sql_lines" | head -1)
                                oracle_output=$(echo "$sql_lines" | "$ORACLE" --quiet 2>/dev/null)
                                echo "  ORACLE_FAIL [${filename}] \"${test_name}\": positive test but oracle rejects it" >> "$MISMATCH_FILE"
                                echo "    SQL: $sql_first" >> "$MISMATCH_FILE"
                                echo "    Error: $oracle_output" >> "$MISMATCH_FILE"
                            fi
                        fi
                    fi
                    state="reading_sexp"
                else
                    sql_lines="${sql_lines:+$sql_lines
}$line"
                fi
                ;;
            reading_sexp)
                if [[ "$line" =~ ^=====+ ]]; then
                    state="reading_header"
                    test_name=""
                fi
                ;;
        esac
    done < "$testfile"

    file_total=$((file_pass + file_fail + file_ignored))
    TOTAL_PASS=$((TOTAL_PASS + file_pass))
    TOTAL_FAIL=$((TOTAL_FAIL + file_fail))
    TOTAL_IGNORED=$((TOTAL_IGNORED + file_ignored))
    TOTAL_TESTS=$((TOTAL_TESTS + file_total))

    if [ $file_fail -gt 0 ]; then
        echo -e "  ${RED}FAIL${NC} ${filename}: ${file_pass}/${file_total} pass (${file_fail} mismatches, ${file_ignored} ignored)"
    elif [ $file_ignored -gt 0 ]; then
        echo -e "  ${YELLOW}WARN${NC} ${filename}: ${file_pass}/${file_total} pass (${file_ignored} ignored)"
    else
        echo -e "  ${GREEN}PASS${NC} ${filename}: ${file_pass}/${file_total} pass"
    fi
done

echo ""
echo "======================================"
echo "VERIFICATION SUMMARY"
echo "======================================"
echo -e "Total tests:  $TOTAL_TESTS"
echo -e "${GREEN}Pass${NC}:         $TOTAL_PASS"
echo -e "${YELLOW}Ignored${NC}:      $TOTAL_IGNORED"
echo -e "${RED}Fail${NC}:         $TOTAL_FAIL"
echo ""

if [ $TOTAL_IGNORED -gt 0 ]; then
    echo "======================================"
    echo "IGNORED (intentional strictness):"
    echo "======================================"
    cat "$IGNORED_FILE"
    echo ""
fi

if [ $TOTAL_FAIL -gt 0 ]; then
    echo "======================================"
    echo "MISMATCHES (unexpected — need fixing):"
    echo "======================================"
    cat "$MISMATCH_FILE"
    echo ""
fi

exit $([ $TOTAL_FAIL -eq 0 ] && echo 0 || echo 1)
