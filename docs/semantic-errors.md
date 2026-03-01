# Semantic Errors for LSP Diagnostics

These SQL patterns are **syntactically valid** (the tree-sitter parser accepts them without ERROR nodes)
but are **semantically invalid** — they will fail at runtime or produce unexpected results.

A future T-SQL LSP should flag these as warnings or errors during editing.

## Removed from Negative Tests (Oracle Accepts, Runtime Rejects)

These were previously negative parse tests but were removed because the Microsoft SqlScriptDOM
parser (our oracle) accepts them as syntactically valid. They should be caught by semantic analysis instead.

### 1. Trailing comma in CREATE TABLE column list

```sql
CREATE TABLE t (a INT,)
```

**Why it's wrong:** No column definition after the comma. SQL Server rejects at execution.
**LSP severity:** Error
**Detection:** Check for empty trailing element in `column_definition` list.

### 2. DROP INDEX without ON clause

```sql
DROP INDEX ix1
```

**Why it's wrong:** SQL Server requires `DROP INDEX ix1 ON table_name` to identify which table
the index belongs to. Without ON, execution fails with an ambiguity error.
**LSP severity:** Error
**Detection:** Check `drop_index` node for missing `ON` clause with table reference.

### 3. Bare COMMIT without TRANSACTION

```sql
COMMIT
```

**Why it's wrong:** It's not wrong — `COMMIT` is valid shorthand for `COMMIT TRANSACTION`.
This was overly strict in our parser. No LSP diagnostic needed.
**LSP severity:** None (valid SQL)
**Note:** Included here for completeness. Some style guides prefer explicit `COMMIT TRANSACTION`.
A linter (not error checker) could optionally flag this.

### 4. IIF() with no arguments

```sql
SELECT IIF()
```

**Why it's wrong:** IIF requires exactly 3 arguments: `IIF(condition, true_value, false_value)`.
Zero arguments will fail at runtime.
**LSP severity:** Error
**Detection:** Check `IIF` function call node for argument count != 3.

### 5. RANK() without OVER clause

```sql
SELECT RANK()
```

**Why it's wrong:** Window functions (RANK, ROW_NUMBER, DENSE_RANK, NTILE, etc.) require
an OVER clause. Without it, SQL Server returns: *"The function 'RANK' must have an OVER clause."*
**LSP severity:** Error
**Detection:** Check `ranking_windowed_function` or `analytic_windowed_functions` nodes.
If the function is called as a plain `function_call` without `over_clause`, flag it.

### 6. ROW_NUMBER() without OVER clause

```sql
SELECT ROW_NUMBER()
```

**Why it's wrong:** Same as RANK() above — ROW_NUMBER is a window function that requires OVER.
**LSP severity:** Error
**Detection:** Same as #5.

---

## Kept as Parser-Level Errors (Syntactically Invalid)

These remain as negative tests in the tree-sitter grammar. The parser correctly rejects them:

- `CREATE TABLE t (PRIMARY KEY)` — PK constraint with no column list
- `CREATE TABLE t (CONSTRAINT pk PRIMARY KEY)` — named PK with no column list
- `ALTER DATABASE db ADD FILE (NAME)` — filespec NAME with no value
- `SELECT CAST(1)` — CAST without AS clause
- `SELECT $` — bare dollar sign (not `$action` or `$PARTITION`)

---

## Future Semantic Checks (Not Yet Covered)

These are additional semantic validations an LSP should perform:

- **Argument count validation** for all built-in functions (not just IIF)
- **Window function OVER requirement** for all window functions (not just RANK/ROW_NUMBER)
- **MERGE without semicolon terminator** — works but Microsoft recommends `;` termination
- **EXECUTE with string literal** — `EXECUTE 'SELECT 1'` is rejected by the parser;
  use `EXECUTE(@sql)` or `sp_executesql` instead
- **IGNORE NULLS / RESPECT NULLS** — ANSI standard but not supported in SQL Server
- **GO with count** — `GO 5` is a SSMS/sqlcmd feature, not T-SQL syntax
- **`?` parameter markers** — ODBC/JDBC feature, not valid T-SQL
- **`SELECT DEFAULT`** — DEFAULT is only valid in INSERT VALUES context
