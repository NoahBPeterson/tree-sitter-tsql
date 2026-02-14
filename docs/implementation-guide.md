# tree-sitter-tsql Implementation Guide

> Comprehensive comparison of the tree-sitter-tsql grammar against the
> [ANTLR4 T-SQL reference grammar](https://github.com/antlr/grammars-v4/tree/master/sql/tsql).
>
> **Reference files:**
> - `TSqlParser.g4` (~6306 lines)
> - `TSqlLexer.g4` (~1292 lines)

---

## Table of Contents

1. [Status Legend](#1-status-legend)
2. [Top-Level Structure](#2-top-level-structure)
3. [sql_clauses](#3-sql_clauses)
4. [DML Clause](#4-dml-clause)
5. [SELECT Statement](#5-select-statement)
6. [Table Sources / FROM / JOINs](#6-table-sources--from--joins)
7. [Expression](#7-expression)
8. [Search Condition (WHERE/HAVING/ON)](#8-search-condition--wherehavingon)
9. [EXECUTE Statement](#9-execute-statement)
10. [Function Calls](#10-function-calls)
11. [Data Types](#11-data-types)
12. [Identifiers and Keywords](#12-identifiers-and-keywords)
13. [Constants / Literals](#13-constants--literals)
14. [Control Flow (cfl_statement)](#14-control-flow--cfl_statement)
15. [DDL Clause](#15-ddl-clause)
16. [another_statement](#16-another_statement)
17. [Remaining Major Subsystems](#17-remaining-major-subsystems)
18. [Lexer Token Reference](#18-lexer-token-reference)
19. [Implementation Priority Recommendation](#19-implementation-priority-recommendation)
20. [Summary Table](#20-summary-table)

---

## 1. Status Legend

Matches the roadmap SVG color coding:

| Color      | Meaning            | Description                                    |
|------------|--------------------|------------------------------------------------|
| lightgreen | SubGraphComplete   | Fully implemented with test corpus             |
| orange     | Tested             | Has tests but subgraph not fully complete      |
| red        | Incomplete         | Started but not done                           |
| gray       | Todo               | Not started                                    |

---

## 2. Top-Level Structure

### ANTLR4 Reference
- `tsql_file` — Parser L35
- `batch` — Parser L40
- `batch_level_statement` — Parser L46
- `go_statement` — (inline in batch)

### Implemented (grammar.js L54-68)

```
tsql_file → repeat(batch) | execute_body_batch + go_statement*
batch     → go_statement | execute_body_batch? + (go_statement | sql_clauses+) + go_statement*
go_statement → GO [count]
```

**Test coverage:** `batch.txt` (3 tests), `go.txt` (2 tests)

### Missing

| Rule                    | ANTLR4 Line | Description                                                |
|-------------------------|-------------|------------------------------------------------------------|
| `batch_level_statement` | Parser L46  | All CREATE OR ALTER / CREATE / DROP top-level DDL batches  |

`batch_level_statement` alternatives (Parser L46-L51):
- `create_or_alter_function` (Parser L2433)
- `create_or_alter_procedure` (Parser L2387)
- `create_or_alter_trigger` (Parser L2400)
- `create_view` (Parser L2570)

---

## 3. sql_clauses

### ANTLR4 Reference — Parser L53-L61

```
sql_clauses
    : dml_clause SEMI?
    | cfl_statement SEMI?
    | another_statement SEMI?
    | ddl_clause SEMI?
    | dbcc_clause SEMI?
    | backup_statement SEMI?
    | SEMI
    ;
```

### Implemented (grammar.js L126-L130)

Only two alternatives:
- `dml_clause` (select only)
- `another_statement` (execute only)

### Missing

| Alternative        | ANTLR4 Line | What It Covers                              |
|--------------------|-------------|---------------------------------------------|
| `cfl_statement`    | Parser L250 | IF, WHILE, BEGIN..END, TRY..CATCH, etc.     |
| `ddl_clause`       | Parser L73  | All CREATE/ALTER/DROP statements (~165 alts) |
| `dbcc_clause`      | Parser L3635| DBCC CHECKDB, SHRINKLOG, etc. (~15 alts)    |
| `backup_statement` | Parser L241 | BACKUP DATABASE/LOG/CERT/KEY                |
| Bare `;`           | Parser L61  | Empty statement                              |

---

## 4. DML Clause

### ANTLR4 Reference — Parser L64-L70

```
dml_clause
    : merge_statement
    | delete_statement
    | insert_statement
    | select_statement_standalone
    | update_statement
    ;
```

### Implemented (grammar.js L199-L202)

Only `select_statement_standalone`.

### Missing

| Statement                    | ANTLR4 Line | Key Sub-Rules                                                     |
|------------------------------|-------------|-------------------------------------------------------------------|
| `insert_statement`           | Parser L2161| `insert_statement_value` (L2168): VALUES, SELECT, EXEC, DEFAULT   |
| `update_statement`           | Parser L2195| SET clause, FROM, WHERE, TOP, OUTPUT, WITH CTE                    |
| `delete_statement`           | Parser L2148| `delete_statement_from` (L2154), WHERE, TOP, OUTPUT               |
| `merge_statement`            | Parser L2127| `when_matches` (L2132), WHEN MATCHED/NOT MATCHED (L2138/L2143)    |

**Implementation notes for INSERT:**
```
-- Basic INSERT
INSERT INTO table (col1, col2) VALUES (val1, val2);
-- INSERT...SELECT
INSERT INTO table SELECT * FROM other_table;
-- INSERT...EXEC
INSERT INTO table EXEC stored_procedure;
-- INSERT...DEFAULT VALUES
INSERT INTO table DEFAULT VALUES;
```

**Implementation notes for UPDATE:**
```
-- Basic UPDATE
UPDATE table SET col = val WHERE condition;
-- UPDATE with FROM/JOIN
UPDATE t SET t.col = s.col FROM target t JOIN source s ON t.id = s.id;
-- UPDATE TOP
UPDATE TOP (10) table SET col = val;
```

**Implementation notes for DELETE:**
```
-- Basic DELETE
DELETE FROM table WHERE condition;
-- DELETE with JOIN
DELETE t FROM target t JOIN source s ON t.id = s.id WHERE s.col = val;
-- DELETE TOP
DELETE TOP (10) FROM table;
```

**Implementation notes for MERGE:**
```
MERGE INTO target AS t
USING source AS s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.col = s.col
WHEN NOT MATCHED THEN INSERT (col) VALUES (s.col)
WHEN NOT MATCHED BY SOURCE THEN DELETE;
```

---

## 5. SELECT Statement

### ANTLR4 Reference
- `select_statement_standalone` — Parser L2182
- `select_statement` — Parser L2186
- `query_expression` — Parser L3997
- `query_specification` — Parser L4010
- `with_expression` (CTEs) — Parser L3955
- `select_order_by_clause` — Parser L4046
- `top_clause` — Parser L4026
- `for_clause` — Parser L4055
- `option_clause` — Parser L4089
- `sql_union` — Parser L4002

### Implemented (grammar.js L204-L252)

```
select_statement_standalone → select_statement (no CTE)
select_statement            → query_expression + optional ;
query_expression            → query_specification (no UNION)
query_specification         → SELECT select_list [FROM table_sources] [GROUP BY]
```

Also implemented:
- `select_list` / `select_list_elem` (grammar.js L231-L240) — `*`, `udt_elem`, `@var OP= expr`, `expression_elem`
- `expression_elem` (grammar.js L284-L287) — `alias = expr` | `expr [AS alias]`
- `as_column_alias` / `column_alias` (grammar.js L290-L297)
- `groupby` / `group_by_item` (grammar.js L243-L252)

**Test coverage:** `select.txt`, `select_list_elem.txt`, `expression_elem.txt`, `as_column_alias.txt`, `column_alias.txt`, `groupby.txt`, `assignment_operator.txt`

### Missing

| Feature                   | ANTLR4 Line    | Description                                           |
|---------------------------|----------------|-------------------------------------------------------|
| `with_expression` (CTEs)  | Parser L3955   | `WITH cte AS (SELECT ...) SELECT ...`                 |
| `common_table_expression` | Parser L3959   | Individual CTE definition with optional column list   |
| `select_order_by_clause`  | Parser L4046   | `ORDER BY col [ASC/DESC] [OFFSET n ROWS FETCH NEXT]`  |
| `top_clause`              | Parser L4026   | `TOP (n) [PERCENT] [WITH TIES]`                       |
| `top_percent`             | Parser L4030   | `TOP (expr) PERCENT`                                  |
| `top_count`               | Parser L4035   | `TOP (expr)` or `TOP expr`                            |
| `sql_union`               | Parser L4002   | `UNION [ALL]`, `EXCEPT`, `INTERSECT`                  |
| `for_clause`              | Parser L4055   | `FOR XML PATH/AUTO/RAW/EXPLICIT`, `FOR JSON PATH/AUTO`|
| `option_clause`           | Parser L4089   | `OPTION (RECOMPILE)`, `OPTION (MAXRECURSION n)`, etc. |
| `ALL` / `DISTINCT`        | Parser L4011   | `SELECT DISTINCT col` (at SELECT level)               |
| `INTO` clause             | Parser L4015   | `SELECT ... INTO #temp FROM ...`                      |
| `WHERE` clause            | Parser L4016   | `WHERE search_condition`                               |
| `HAVING` clause           | Parser L4022   | `HAVING search_condition`                              |
| Parenthesized `query_expression` | Parser L3999 | `(query_expression)` for complex UNIONs          |
| `GROUP BY ROLLUP/CUBE`    | Parser L4018   | `ROLLUP(col)`, `CUBE(col)`, `GROUPING SETS(...)`      |

**Implementation notes for query_specification (Parser L4010-L4023):**
```antlr
query_specification
    : SELECT (ALL | DISTINCT)? top_clause?
      select_list
      (INTO table_name)?
      (FROM table_sources)?
      (WHERE search_condition)?
      (GROUP BY (ALL? expression (COMMA expression)*
               | GROUPING SETS LR_BRACKET grouping_sets_item (COMMA grouping_sets_item)* RR_BRACKET)
      )?
      (HAVING search_condition)?
    ;
```

**Implementation notes for with_expression (Parser L3955-L3970):**
```antlr
with_expression
    : WITH xmlnamespaces_clause? common_table_expression (COMMA common_table_expression)*
    ;
common_table_expression
    : expression_name=id_ (LR_BRACKET columns+=column_name_list RR_BRACKET)?
      AS LR_BRACKET cte_query=select_statement RR_BRACKET
    ;
```

**Implementation notes for select_order_by_clause (Parser L4046-L4053):**
```antlr
select_order_by_clause
    : ORDER BY order_by_expression (COMMA order_by_expression)*
      (OFFSET offset_exp=expression offset_rows=(ROW | ROWS)
       (FETCH (FIRST | NEXT) fetch_exp=expression fetch_rows=(ROW | ROWS) ONLY)?
      )?
    ;
```

---

## 6. Table Sources / FROM / JOINs

### ANTLR4 Reference
- `table_sources` — Parser L4150
- `table_source` — Parser L4161
- `table_source_item` — Parser L4165
- `join_part` — Parser L4224
- `join_on` — Parser L4233
- `cross_join` — Parser L4239
- `apply_` — Parser L4243
- `pivot` / `unpivot` — Parser L4247/L4251

### Implemented (grammar.js L299-L333)

```
table_sources    → table_source (single only)
table_source     → table_source_item (no join_part)
table_source_item → full_table_name only
full_table_name  → [server.][database.][schema.]table
```

### Missing

| Feature                | ANTLR4 Line | Description                                        |
|------------------------|-------------|----------------------------------------------------|
| Multiple table sources | Parser L4152| Comma-separated tables (implicit CROSS JOIN)       |
| `join_part`            | Parser L4224| All JOIN syntax appended to table_source           |
| `join_on`              | Parser L4233| `[LEFT/RIGHT/FULL] [OUTER] JOIN ... ON condition`  |
| `cross_join`           | Parser L4239| `CROSS JOIN table_source`                          |
| `apply_`               | Parser L4243| `CROSS APPLY` / `OUTER APPLY`                     |
| `pivot`                | Parser L4247| `PIVOT (agg FOR col IN (vals)) AS alias`           |
| `unpivot`              | Parser L4251| `UNPIVOT (col FOR col IN (cols)) AS alias`         |
| Table aliases          | Parser L4171| `FROM table AS alias` / `FROM table alias`         |
| Table hints            | Parser L4173| `WITH (NOLOCK)`, `(READUNCOMMITTED)`, etc.         |
| Derived tables         | Parser L4172| `FROM (SELECT ...) AS alias`                       |
| `rowset_function`      | Parser L4167| `OPENROWSET`, `OPENQUERY`, `OPENDATASOURCE`        |
| `change_table`         | Parser L4177| `CHANGETABLE(CHANGES ...)`, `CHANGETABLE(VERSION)`  |
| `nodes_method`         | Parser L4180| XML `.nodes()` in FROM clause                       |
| Table-valued functions | Parser L4175| `FROM dbo.fn_table(@param)` / `LOCAL_ID`            |
| `TABLESAMPLE`          | Parser L4186| `TABLESAMPLE (n PERCENT/ROWS)`                      |

**Implementation notes for join_part (Parser L4224-L4256):**
```antlr
join_part
    : join_on | cross_join | apply_ | pivot | unpivot
    ;
join_on
    : (inner=INNER? | join_type=(LEFT | RIGHT | FULL) OUTER?)
      (join_hint=(LOOP | HASH | MERGE | REMOTE))?
      JOIN table_source ON search_condition
    ;
cross_join
    : CROSS JOIN table_source_item
    ;
apply_
    : (CROSS | OUTER) APPLY table_source_item
    ;
```

**Implementation notes for table_source_item (Parser L4165-L4183):**
```antlr
table_source_item
    : full_table_name             as_table_alias?
    | full_table_name             as_table_alias? with_table_hints?
    | rowset_function             as_table_alias?
    | derived_table               as_table_alias?
    | change_table                as_table_alias?
    | function_call               as_table_alias?
    | loc_id=LOCAL_ID             as_table_alias?
    | nodes_method                as_table_alias?
    | loc_id_call=LOCAL_ID DOT loc_fcall=function_call as_table_alias?
    | open_xml
    | open_json
    | COLON COLON function_call   as_table_alias?
    ;
```

---

## 7. Expression

### ANTLR4 Reference — Parser L3902-L3917

```antlr
expression
    : primitive_expression                                             // L3903
    | function_call                                                    // L3904
    | expression DOT (value_call | query_call | exist_call | modify_call) // L3905
    | expression DOT hierarchyid_call                                  // L3906
    | expression COLLATE id_                                           // L3907
    | case_expression                                                  // L3908
    | full_column_name                                                 // L3909
    | bracket_expression                                               // L3910
    | unary_operator_expression                                        // L3911
    | expression op=(STAR | DIVIDE | MODULE) expression                // L3912
    | expression op=(PLUS | MINUS | BIT_AND | BIT_XOR | BIT_OR | DOUBLE_BAR) expression // L3913
    | expression AT_KEYWORD TIME ZONE expression                       // L3914
    | over_clause                                                      // L3915
    | DOLLAR_ACTION                                                    // L3916
    ;
```

### Implemented (grammar.js L341-L346)

Only 3 alternatives:
```
expression → primitive_expression | full_column_name | function_call
```

### Missing

| Feature                       | ANTLR4 Line | Description                                     |
|-------------------------------|-------------|-------------------------------------------------|
| `case_expression`             | Parser L3935| `CASE WHEN cond THEN val ... ELSE val END`      |
| `bracket_expression`          | Parser L3945| `(expression)` and `(subquery)`                 |
| `unary_operator_expression`   | Parser L3940| `~expr`, `-expr`, `+expr`                       |
| Multiplicative operators      | Parser L3912| `expr * expr`, `expr / expr`, `expr % expr`     |
| Additive/bitwise operators    | Parser L3913| `+ - & ^ \| \|\|`                                |
| `COLLATE` on expression       | Parser L3907| `expression COLLATE collation_name`             |
| `AT TIME ZONE`                | Parser L3914| `expression AT TIME ZONE 'zone_name'`           |
| XML method calls              | Parser L3905| `.value()`, `.query()`, `.exist()`, `.modify()` |
| `.hierarchyid_call`           | Parser L3906| `expression.hierarchyid_method()`               |
| `DOLLAR_ACTION`               | Parser L3916| `$action` (used in MERGE)                       |
| Multi-part `full_column_name` | Parser L5155| `table.column`, `schema.table.column`           |

**Implementation notes for case_expression (Parser L3935-L3938):**
```antlr
case_expression
    : CASE caseExpr=expression switch_section+ (ELSE elseExpr=expression)? END
    | CASE switch_search_condition_section+ (ELSE elseExpr=expression)? END
    ;
switch_section : WHEN expression THEN expression ;
switch_search_condition_section : WHEN search_condition THEN expression ;
```

**Implementation notes for bracket_expression (Parser L3945-L3948):**
```antlr
bracket_expression
    : LR_BRACKET expression RR_BRACKET
    | LR_BRACKET subquery RR_BRACKET
    ;
subquery : select_statement ;
```

**Implementation notes for full_column_name (Parser L5155-L5160):**
```antlr
full_column_name
    : ((DELETED | INSERTED | table_name) DOT)? id_
    | (schema_name=id_ DOT)? table_name DOT column_name=id_
    ;
```

---

## 8. Search Condition  (WHERE/HAVING/ON)

### ANTLR4 Reference
- `search_condition` — Parser L3977
- `predicate` — Parser L3983

### Implemented

**Nothing.** No `search_condition` or `predicate` rule exists.

### Missing (entire subsystem)

| Rule               | ANTLR4 Line | Description                                       |
|--------------------|-------------|---------------------------------------------------|
| `search_condition` | Parser L3977| `NOT? predicate (AND/OR search_condition)*`        |
| `predicate`        | Parser L3983| All comparison/logic predicates (see below)        |

**Predicate alternatives (Parser L3983-L3993):**

| Predicate              | ANTLR4 Line | Syntax                                          |
|------------------------|-------------|-------------------------------------------------|
| EXISTS                 | Parser L3984| `EXISTS (subquery)`                             |
| `freetext_predicate`   | Parser L3985| `CONTAINS(col, 'text')`, `FREETEXT(col, 'text')`|
| Comparison             | Parser L3986| `expr {= <> != < > <= >= !< !>} expr`           |
| Old-style outer join   | Parser L3987| `expr *= expr` (deprecated)                     |
| ALL/SOME/ANY           | Parser L3988| `expr op ALL/SOME/ANY (subquery)`               |
| BETWEEN                | Parser L3989| `expr [NOT] BETWEEN expr AND expr`              |
| IN                     | Parser L3990| `expr [NOT] IN (list \| subquery)`               |
| LIKE                   | Parser L3991| `expr [NOT] LIKE pattern [ESCAPE char]`         |
| IS NULL                | Parser L3992| `expr IS [NOT] NULL`                            |

**Implementation notes (Parser L3977-L3993):**
```antlr
search_condition
    : NOT? predicate (AND search_condition | OR search_condition)*
    ;
predicate
    : EXISTS LR_BRACKET subquery RR_BRACKET
    | freetext_predicate
    | expression comparison_operator expression
    | expression comparison_operator (ALL | SOME | ANY) LR_BRACKET subquery RR_BRACKET
    | expression NOT? BETWEEN expression AND expression
    | expression NOT? IN LR_BRACKET (subquery | expression_list_) RR_BRACKET
    | expression NOT? LIKE expression (ESCAPE expression)?
    | expression IS null_notnull
    ;
comparison_operator : EQUAL | GREATER | LESS | ... ;  // Parser L3970
```

---

## 9. EXECUTE Statement

### ANTLR4 Reference
- `execute_statement` — Parser L3141
- `execute_body` — Parser L3150
- `execute_body_batch` — Parser L3145
- `execute_statement_arg` — Parser L3158
- `execute_var_string` — Parser L3175

### Implemented (grammar.js L138-L197) — ~93% complete

Full implementation of:
- `execute_statement` (grammar.js L140) — `EXEC[UTE] execute_body`
- `execute_body` (grammar.js L145-L156) — procedure call with return status, args, WITH options; string execution with AS LOGIN/USER, AT linked_server
- `execute_body_batch` (grammar.js L70-L72) — top-level batch procedure
- `execute_statement_arg` (grammar.js L90-L93) — named/unnamed params
- `execute_statement_arg_named` / `_unnamed` (grammar.js L96-L101)
- `execute_parameter` (grammar.js L104-L110) — constant, @local OUTPUT, id, DEFAULT, NULL
- `execute_var_string` (grammar.js L180-L183) — @var + string concatenation
- `execute_option` (grammar.js L160-L165) — RECOMPILE, RESULT SETS NONE/UNDEFINED

**Test coverage:** 15+ tests across `execute_body.txt`, `execute_option.txt`, `execute_parameter.txt`, `execute_statement_arg.txt`, `execute_var_string.txt`, `another_statement.txt`

### Missing

| Feature                   | ANTLR4 Line | Description                                    |
|---------------------------|-------------|------------------------------------------------|
| RESULT SETS definition    | Parser L3168| Full column definition list for RESULT SETS    |
| AT DATA_SOURCE            | Parser L3155| SQL Server 2019+ external data source support  |

---

## 10. Function Calls

### ANTLR4 Reference — Parser L4287-L4296

```antlr
function_call
    : ranking_windowed_function     // L4288 — COMPLETE
    | aggregate_windowed_function   // L4289 — COMPLETE
    | analytic_windowed_function    // L4290 — COMPLETE
    | built_in_functions            // L4291 — PARTIAL (~32 of ~200+)
    | scalar_function_name(...)     // L4292 — COMPLETE
    | freetext_function             // L4293 — NOT STARTED
    | partition_function            // L4294 — COMPLETE
    | hierarchyid_static_method     // L4295 — COMPLETE
    ;
```

### Implemented (grammar.js L349-L371)

All categories present, plus extras: `odbc_scalar_functions`, `bit_manipulation_functions`, `collation_functions`, `configuration_functions`, `conversion_functions`.

---

### 10a. Ranking Windowed Functions — COMPLETE

**ANTLR4:** Parser L5004
**Implemented:** grammar.js L447-L451

| Function     | Status |
|-------------|--------|
| RANK()      | Done   |
| DENSE_RANK()| Done   |
| ROW_NUMBER()| Done   |
| NTILE(n)    | Done   |

**Tests:** `ranking_windowed_function.txt` (4 tests)

---

### 10b. Aggregate Functions — COMPLETE

**ANTLR4:** Parser L5010
**Implemented:** `grammar/functions/aggregate_functions.js`

| Function                  | Status |
|--------------------------|--------|
| AVG/MAX/MIN/SUM          | Done   |
| STDEV/STDEVP/VAR/VARP   | Done   |
| COUNT/COUNT_BIG          | Done   |
| CHECKSUM_AGG             | Done   |
| APPROX_COUNT_DISTINCT    | Done   |
| STRING_AGG               | Done   |
| APPROX_PERCENTILE_CONT   | Done   |
| APPROX_PERCENTILE_DISC   | Done   |
| GROUPING/GROUPING_ID     | Done   |

**Tests:** `aggregate_functions.txt` (18 tests), `all_distinct_expression.txt` (2 tests)

---

### 10c. Analytic Windowed Functions — COMPLETE

**ANTLR4:** Parser L5019
**Implemented:** `grammar/functions/analytic_windowed_functions.js`

| Function                          | Status |
|----------------------------------|--------|
| FIRST_VALUE/LAST_VALUE           | Done   |
| LAG/LEAD (with offset/default)   | Done   |
| IGNORE NULLS / RESPECT NULLS    | Done   |
| CUME_DIST/PERCENT_RANK          | Done   |
| PERCENTILE_CONT/PERCENTILE_DISC | Done   |

**Tests:** `analytic_windowed_function.txt` (10 tests)

---

### 10d. OVER Clause / Window Specification — COMPLETE

**ANTLR4:** `over_clause` Parser L5033, `row_or_range_clause` Parser L5037, `window_frame_extent` Parser L5041
**Implemented:** grammar.js L460-L525

| Component             | Status |
|----------------------|--------|
| PARTITION BY         | Done   |
| ORDER BY ASC/DESC   | Done   |
| COLLATE in ORDER BY  | Done   |
| ROWS / RANGE         | Done   |
| UNBOUNDED PRECEDING  | Done   |
| n PRECEDING          | Done   |
| CURRENT ROW          | Done   |
| n FOLLOWING          | Done   |
| UNBOUNDED FOLLOWING  | Done   |
| BETWEEN ... AND ...  | Done   |

**Tests:** `over_clause.txt` (4), `order_by_clause.txt` (3), `order_by_expression.txt` (3), `row_or_range_clause.txt` (2), `window_frame_extent.txt` (2), `window_frame_bound.txt` (1), `window_frame_following.txt` (2), `window_frame_preceding.txt` (3)

---

### 10e. Built-in Functions — PARTIAL

**ANTLR4:** Parser L4338-L4783 (~445 lines, ~200+ functions)
**Implemented:** `grammar/builtins.js` (32 metadata functions)

#### Implemented (32 functions)

All are **metadata/property** functions (ANTLR4 Parser ~L4341-L4420):

APP_NAME, APPLOCK_MODE, APPLOCK_TEST, ASSEMBLYPROPERTY, COL_LENGTH, COL_NAME, COLUMNPROPERTY, DATABASEPROPERTYEX, DB_ID, DB_NAME, FILE_ID, FILE_IDEX, FILE_NAME, FILEGROUP_ID, FILEGROUP_NAME, FILEGROUPPROPERTY, FILEPROPERTY, FILEPROPERTYEX, FULLTEXTCATALOGPROPERTY, FULLTEXTSERVICEPROPERTY, INDEX_COL, INDEXKEY_PROPERTY, INDEXPROPERTY, NEXT VALUE FOR, OBJECT_DEFINITION, OBJECT_ID, OBJECT_NAME, OBJECT_SCHEMA_NAME, OBJECTPROPERTY, OBJECTPROPERTYEX, ORIGINAL_DB_NAME, PARSENAME

**Tests:** `built_in_functions.txt` (30+ tests)

#### Missing — by category with ANTLR4 line ranges

**Metadata functions still missing (Parser ~L4410-L4420):**

| Function         | ANTLR4 Line (approx) |
|-----------------|----------------------|
| SCHEMA_ID       | Parser L4411         |
| SCHEMA_NAME     | Parser L4412         |
| SCOPE_IDENTITY  | Parser L4413         |
| SERVERPROPERTY  | Parser L4414         |
| STATS_DATE      | Parser L4415         |
| TYPE_ID         | Parser L4416         |
| TYPE_NAME       | Parser L4417         |
| TYPEPROPERTY    | Parser L4418         |

**String functions (Parser ~L4422-L4491) — 0 of ~30:**

| Function       | ANTLR4 Line (approx) |
|---------------|----------------------|
| ASCII         | ~L4423               |
| CHAR          | ~L4425               |
| CHARINDEX     | ~L4427               |
| CONCAT        | ~L4429               |
| CONCAT_WS     | ~L4431               |
| DIFFERENCE    | ~L4433               |
| FORMAT        | ~L4435               |
| LEFT          | ~L4437               |
| LEN           | ~L4439               |
| LOWER         | ~L4441               |
| LTRIM         | ~L4443               |
| NCHAR         | ~L4445               |
| PATINDEX      | ~L4447               |
| QUOTENAME     | ~L4449               |
| REPLACE       | ~L4451               |
| REPLICATE     | ~L4453               |
| REVERSE       | ~L4455               |
| RIGHT         | ~L4457               |
| RTRIM         | ~L4459               |
| SOUNDEX       | ~L4461               |
| SPACE         | ~L4463               |
| STR           | ~L4465               |
| STRING_ESCAPE | ~L4469               |
| STUFF         | ~L4471               |
| SUBSTRING     | ~L4473               |
| TRANSLATE     | ~L4477               |
| TRIM          | ~L4479               |
| UNICODE       | ~L4483               |
| UPPER         | ~L4485               |

**Date/Time functions (Parser ~L4583-L4649) — 0 of ~29:**

| Function                | ANTLR4 Line (approx) |
|------------------------|----------------------|
| CURRENT_DATE           | ~L4584               |
| CURRENT_TIMESTAMP      | ~L4586               |
| CURRENT_TIMEZONE       | ~L4588               |
| CURRENT_TIMEZONE_ID    | ~L4590               |
| DATE_BUCKET            | ~L4592               |
| DATEADD                | ~L4594               |
| DATEDIFF               | ~L4596               |
| DATEDIFF_BIG           | ~L4598               |
| DATEFROMPARTS          | ~L4600               |
| DATENAME               | ~L4602               |
| DATEPART               | ~L4604               |
| DATETIME2FROMPARTS     | ~L4608               |
| DATETIMEFROMPARTS       | ~L4610               |
| DATETIMEOFFSETFROMPARTS | ~L4612               |
| DATETRUNC              | ~L4614               |
| DAY                    | ~L4616               |
| EOMONTH                | ~L4618               |
| GETDATE                | ~L4620               |
| GETUTCDATE             | ~L4622               |
| ISDATE                 | ~L4624               |
| MONTH                  | ~L4632               |
| SMALLDATETIMEFROMPARTS | ~L4636               |
| SWITCHOFFSET           | ~L4638               |
| SYSDATETIME            | ~L4640               |
| SYSDATETIMEOFFSET      | ~L4641               |
| SYSUTCDATETIME         | ~L4642               |
| TIMEFROMPARTS          | ~L4644               |
| TODATETIMEOFFSET       | ~L4646               |
| YEAR                   | ~L4648               |

**Math functions (Parser ~L4678-L4722) — 0 of ~23:**

| Function | ANTLR4 Line (approx) |
|---------|----------------------|
| ABS     | ~L4679               |
| ACOS    | ~L4681               |
| ASIN    | ~L4683               |
| ATAN    | ~L4685               |
| ATN2    | ~L4687               |
| CEILING | ~L4689               |
| COS     | ~L4691               |
| COT     | ~L4693               |
| DEGREES | ~L4695               |
| EXP     | ~L4697               |
| FLOOR   | ~L4699               |
| LOG     | ~L4701               |
| LOG10   | ~L4703               |
| PI      | ~L4705               |
| POWER   | ~L4707               |
| RADIANS | ~L4709               |
| RAND    | ~L4711               |
| ROUND   | ~L4713               |
| SIGN    | ~L4715               |
| SIN     | ~L4717               |
| SQRT    | ~L4719               |
| SQUARE  | ~L4720               |
| TAN     | ~L4722               |

**System functions (Parser ~L4493-L4548) — 0 of ~27:**

| Function                            | ANTLR4 Line (approx) |
|------------------------------------|----------------------|
| BINARY_CHECKSUM                    | ~L4494               |
| CHECKSUM                           | ~L4496               |
| COMPRESS                           | ~L4498               |
| CONNECTIONPROPERTY                 | ~L4500               |
| CONTEXT_INFO                       | ~L4502               |
| CURRENT_REQUEST_ID                 | ~L4504               |
| CURRENT_TRANSACTION_ID             | ~L4506               |
| DECOMPRESS                         | ~L4508               |
| ERROR_LINE                         | ~L4510               |
| ERROR_MESSAGE                      | ~L4512               |
| ERROR_NUMBER                       | ~L4514               |
| ERROR_PROCEDURE                    | ~L4516               |
| ERROR_SEVERITY                     | ~L4518               |
| ERROR_STATE                        | ~L4520               |
| FORMATMESSAGE                      | ~L4522               |
| GET_FILESTREAM_TRANSACTION_CONTEXT | ~L4524               |
| GETANSINULL                        | ~L4526               |
| HOST_ID                            | ~L4528               |
| HOST_NAME                          | ~L4530               |
| ISNULL                             | ~L4532               |
| ISNUMERIC                          | ~L4534               |
| MIN_ACTIVE_ROWVERSION              | ~L4536               |
| NEWID                              | ~L4538               |
| NEWSEQUENTIALID                    | ~L4540               |
| ROWCOUNT_BIG                       | ~L4542               |
| SESSION_CONTEXT                    | ~L4544               |
| XACT_STATE                         | ~L4548               |

**JSON functions (Parser ~L4662-L4675) — 0 of 7:**

| Function          | ANTLR4 Line (approx) |
|------------------|----------------------|
| ISJSON           | ~L4663               |
| JSON_OBJECT      | ~L4665               |
| JSON_ARRAY       | ~L4667               |
| JSON_VALUE       | ~L4669               |
| JSON_QUERY       | ~L4671               |
| JSON_MODIFY      | ~L4673               |
| JSON_PATH_EXISTS | ~L4675               |

**Logical functions (Parser ~L4724-L4727) — 0 of 2:**

| Function | ANTLR4 Line (approx) |
|---------|----------------------|
| GREATEST | ~L4725               |
| LEAST    | ~L4727               |

**Security functions (Parser ~L4730-L4782) — 0 of ~24:**

| Function              | ANTLR4 Line (approx) |
|----------------------|----------------------|
| CERTENCODED          | ~L4731               |
| CERTPRIVATEKEY       | ~L4733               |
| CURRENT_USER         | ~L4735               |
| DATABASE_PRINCIPAL_ID| ~L4737               |
| HAS_DBACCESS         | ~L4739               |
| HAS_PERMS_BY_NAME    | ~L4741               |
| IS_MEMBER            | ~L4743               |
| IS_ROLEMEMBER        | ~L4745               |
| IS_SRVROLEMEMBER     | ~L4747               |
| LOGINPROPERTY        | ~L4749               |
| ORIGINAL_LOGIN       | ~L4751               |
| PERMISSIONS          | ~L4753               |
| PWDENCRYPT           | ~L4757               |
| PWDCOMPARE           | ~L4759               |
| SESSION_USER         | ~L4761               |
| SESSIONPROPERTY      | ~L4763               |
| SUSER_ID             | ~L4765               |
| SUSER_NAME           | ~L4767               |
| SUSER_SID            | ~L4769               |
| SUSER_SNAME          | ~L4771               |
| SYSTEM_USER          | ~L4773               |
| USER                 | ~L4775               |
| USER_ID              | ~L4777               |
| USER_NAME            | ~L4779               |

**Cursor functions (Parser ~L4560-L4564) — 0 of 3:**

| Function      | ANTLR4 Line (approx) |
|--------------|----------------------|
| CURSOR_ROWS  | ~L4561               |
| FETCH_STATUS | ~L4563               |
| CURSOR_STATUS| ~L4564               |

**Conversion functions (Parser ~L4551-L4557) — partial (1 of 4):**

| Function  | ANTLR4 Line (approx) | Status  |
|----------|----------------------|---------|
| CAST     | ~L4552               | Done    |
| TRY_CAST | ~L4553               | Missing |
| CONVERT  | ~L4555               | Missing |
| COALESCE | ~L4557               | Missing |

**Data type functions (Parser ~L4570-L4580) — 0 of 6:**

| Function           | ANTLR4 Line (approx) |
|-------------------|----------------------|
| DATALENGTH        | ~L4571               |
| IDENT_CURRENT     | ~L4573               |
| IDENT_INCR        | ~L4575               |
| IDENT_SEED        | ~L4577               |
| IDENTITY          | ~L4579               |
| SQL_VARIANT_PROPERTY | ~L4580            |

**Other functions (Parser ~L4649-L4660):**

| Function  | ANTLR4 Line (approx) | Status  |
|----------|----------------------|---------|
| NULLIF   | ~L4651               | Missing |
| PARSE    | ~L4653               | Missing |
| TRY_PARSE| ~L4655               | Missing |
| IIF      | ~L4659               | Missing |

---

### 10f. Conversion Functions — PARTIAL (1 of 6)

**ANTLR4:** Parser ~L4551-L4557
**Implemented:** `grammar/functions/conversion_functions.js`

| Function    | Status  | Notes                                          |
|------------|---------|------------------------------------------------|
| CAST       | Done    | `CAST(expr AS data_type)`                      |
| CONVERT    | Missing | `CONVERT(data_type, expr [, style])` — token defined, not wired |
| PARSE      | Missing | `PARSE(string AS data_type [USING culture])` — token defined     |
| TRY_CAST   | Missing | `TRY_CAST(expr AS data_type)` — token defined                   |
| TRY_CONVERT| Missing | `TRY_CONVERT(data_type, expr [, style])` — token defined         |
| TRY_PARSE  | Missing | `TRY_PARSE(string AS data_type [USING culture])` — token defined |

**Implementation notes:** Tokens are already defined in `conversion_functions.js` L19-L24. Just need to add alternatives to the `conversion_functions` choice rule at L5-L7.

---

### 10g. Configuration Functions — COMPLETE

**Implemented:** `grammar/functions/configuration_functions.js`

All 15 `@@` system variables: @@DATEFIRST, @@DBTS, @@LANGID, @@LANGUAGE, @@LOCK_TIMEOUT, @@MAX_CONNECTIONS, @@MAX_PRECISION, @@NESTLEVEL, @@OPTIONS, @@REMSERVER, @@SERVERNAME, @@SERVICENAME, @@SPID, @@TEXTSIZE, @@VERSION

**Tests:** `configuration_functions.txt` (15 tests)

---

### 10h. Bit Manipulation Functions — COMPLETE

**Implemented:** `grammar/functions/bit_manipulation_functions.js`

LEFT_SHIFT (function + `<<` operator), RIGHT_SHIFT (function + `>>` operator), BIT_COUNT, GET_BIT, SET_BIT (2 and 3 arg forms)

**Tests:** `bit_manipulation_functions.txt` (8 tests)

---

### 10i. Collation Functions — COMPLETE

**Implemented:** `grammar/functions/collation_functions.js`

COLLATIONPROPERTY, TERTIARY_WEIGHTS

**Tests:** `collation_functions.txt` (2 tests)

---

### 10j. ODBC Scalar Functions — PARTIAL

**Implemented:** `grammar/functions/odbc_scalar_functions.js`

17 functions in `{fn ...}` syntax: BIT_LENGTH, CONCAT, OCTET_LENGTH, TRUNCATE, CURRENT_DATE, CURDATE, CURRENT_TIME, CURTIME, DAYNAME, DAYOFMONTH, DAYOFWEEK, HOUR, MINUTE, SECOND, MONTHNAME, QUARTER, WEEK

**Tests:** `odbc_scalar_functions.txt` (18 tests)

**Missing ODBC functions:** Many string functions (ASCII, CHAR, INSERT, LCASE, LENGTH, LOCATE, LTRIM, REPEAT, RIGHT, RTRIM, SPACE, SUBSTRING, UCASE), numeric functions (ABS, ACOS, ASIN, ATAN, ATAN2, CEILING, COS, COT, DEGREES, EXP, FLOOR, LOG, LOG10, MOD, PI, POWER, RADIANS, RAND, ROUND, SIGN, SIN, SQRT, TAN), date functions (DAYOFYEAR, EXTRACT, NOW, TIMESTAMPADD, TIMESTAMPDIFF)

---

### 10k. HierarchyID Methods — COMPLETE

**Implemented:** grammar.js L384-L416

Static: `HIERARCHYID::GetRoot()`, `HIERARCHYID::Parse(input)`
Instance: `GetLevel()`, `ToString()`, `GetAncestor(n)`, `IsDescendantOf(other)`, `GetReparentedValue(old, new)`, `GetDescendant(child1, child2)`

**Tests:** `hierarchyid_static_method.txt` (8 tests)

---

### 10l. Partition Functions — COMPLETE

**Implemented:** grammar.js L422-L424

`[$database.]$PARTITION.func_name(expression)`

**Tests:** `partition_function.txt` (2 tests), `dollar_partition.txt` (2 tests)

---

### 10m. Scalar Function Calls — COMPLETE

**Implemented:** grammar.js L429-L438

`[database.][schema.]function(args)`, plus `RIGHT(...)`, `LEFT(...)`, `BINARY_CHECKSUM(...)`, `CHECKSUM(...)`

**Tests:** `scalar_function.txt` (5 tests)

---

### 10n. Freetext Functions — NOT STARTED

**ANTLR4:** Parser L4302-L4316

| Function                          | ANTLR4 Line |
|----------------------------------|-------------|
| CONTAINSTABLE                    | L4303       |
| FREETEXTTABLE                    | L4308       |
| SEMANTICSIMILARITYTABLE          | L4310       |
| SEMANTICKEYPHRASETABLE           | L4312       |
| SEMANTICSIMILARITYDETAILSTABLE   | L4314       |
| CONTAINS (predicate)             | L4317       |
| FREETEXT (predicate)             | L4320       |

---

## 11. Data Types

### ANTLR4 Reference — Parser L5260

### Implemented (`grammar/data_types.js`)

| Category              | Types Implemented                                          |
|----------------------|-----------------------------------------------------------|
| Exact Numerics       | TINYINT, SMALLINT, INT, BIGINT, BIT, DECIMAL(p,s), NUMERIC(p,s), MONEY, SMALLMONEY |
| Approximate Numerics | FLOAT(n), REAL(n)                                         |
| Character Strings    | CHAR(n), VARCHAR(n\|MAX), TEXT                             |
| Unicode Strings      | NCHAR(n), NVARCHAR(n\|MAX), NTEXT                         |
| Binary Strings       | BINARY(n), VARBINARY(n\|MAX), IMAGE                       |
| Date/Time            | DATE, TIME(p), DATETIME2(p), DATETIMEOFFSET(p), DATETIME, SMALLDATETIME |

**Tests:** `conversion_functions.txt` (42 tests covering all data types via CAST), `data_type.txt`

### Missing (`other_data_types` — marked TODO)

| Type                | Description                                 |
|--------------------|---------------------------------------------|
| CURSOR             | Cursor data type                            |
| HIERARCHYID        | Hierarchical data type                      |
| SQL_VARIANT        | Can store various SQL Server data types     |
| TABLE              | Table-valued parameters                     |
| XML                | XML data with optional schema collection    |
| GEOGRAPHY          | Spatial geography type                      |
| GEOMETRY           | Spatial geometry type                       |
| ROWVERSION         | Auto-generated binary numbers               |
| TIMESTAMP          | Synonym for ROWVERSION                      |
| UNIQUEIDENTIFIER   | 16-byte GUID                                |
| SYSNAME            | System name type (NVARCHAR(128))            |
| User-defined types | Custom type names                           |
| DOUBLE PRECISION   | Synonym for FLOAT                           |
| IDENTITY(seed,incr)| Identity specification                      |

---

## 12. Identifiers and Keywords

### ANTLR4 Reference
- `id_` — Parser L6261
- `keyword` — Parser L5287-L6258 (~971 lines)
- Lexer identifier tokens — Lexer L1218-L1225

### Implemented (grammar.js L570-L581)

```
id_ → ID | SQUARE_BRACKET_ID | keyword
keyword → GO   (only one keyword!)
```

Lexer tokens (grammar.js L22-L24):
```
ID               = /[A-Za-z_#][A-Za-z_#$@0-9]+/
SQUARE_BRACKET_ID = /\[[A-Za-z_#]+\]/
LOCAL_ID          = /@[A-Za-z_$@#0-9]+/
```

### Missing

| Feature            | ANTLR4 Line   | Description                                      |
|-------------------|----------------|--------------------------------------------------|
| `DOUBLE_QUOTE_ID` | Lexer L1218    | `"identifier"` delimited identifiers             |
| `DOUBLE_QUOTE_BLANK` | Lexer L1219 | Empty `""` identifier                            |
| `TEMP_ID`         | Lexer L1223    | `#temp` / `##global_temp` table names            |
| `keyword` expansion| Parser L5287  | ~600+ keywords that can serve as identifiers     |
| Single-char IDs   | Lexer L1225    | Current regex requires 2+ chars (`[A-Za-z_#][A-Za-z_#$@0-9]+`). Should be `+` → `*` to allow single-char identifiers like `x` |

**Note on keyword rule:** The ANTLR4 `keyword` rule (Parser L5287-L6258) lists every T-SQL keyword that can also be used as an identifier. This is critical for parsing real-world T-SQL where column/table names often coincide with keywords. The current implementation only allows `GO` as a keyword-identifier.

---

## 13. Constants / Literals

### ANTLR4 Reference
- `constant` — Parser L5270
- Lexer tokens — Lexer L1224-L1231

### Implemented (grammar.js L118-L122, L528-L563)

| Literal Type     | Status | grammar.js Line |
|-----------------|--------|-----------------|
| String (`'...'`, `N'...'`) | Done | L185-L194 (string_lit), L27 (STRING) |
| Binary (`0x...`) | Done | L546 |
| Decimal (integer) | Done | L563 |
| Float (dec.dec)  | Done | L562 |
| Real (scientific) | Done | L556-L560 |
| Money (`$3.00`)  | Done | L549 |
| Parameter (`?`)  | Done | L552 |

**Tests:** `primitive_constant.txt` (7 tests), `primitive_expression.txt` (4 tests), `parameter.txt` (1 test)

### Missing

| Feature         | Description                                |
|----------------|---------------------------------------------|
| Negative constants | `constant` rule allows `-` prefix (Parser L5273). Current `constant` rule (grammar.js L118-L122) is only used in `execute_parameter`, with limited `-` support |
| `DOLLAR_ACTION` | `$action` token for MERGE statements        |

---

## 14. Control Flow  (cfl_statement)

### ANTLR4 Reference — Parser L250-L262

**Entirely missing.** None of these are implemented.

| Statement             | ANTLR4 Line | Syntax                                       |
|----------------------|-------------|----------------------------------------------|
| `block_statement`    | Parser L251 | `BEGIN sql_clauses* END`                     |
| `break_statement`    | Parser L252 | `BREAK`                                      |
| `continue_statement` | Parser L253 | `CONTINUE`                                   |
| `goto_statement`     | Parser L254 | `GOTO label`                                 |
| `if_statement`       | Parser L255 | `IF condition sql_clause [ELSE sql_clause]`  |
| `print_statement`    | Parser L256 | `PRINT expression`                           |
| `raiseerror_statement`| Parser L257| `RAISERROR(msg, severity, state)`            |
| `return_statement`   | Parser L258 | `RETURN [expression]`                        |
| `throw_statement`    | Parser L259 | `THROW [number, message, state]`             |
| `try_catch_statement`| Parser L260 | `BEGIN TRY ... END TRY BEGIN CATCH ... END CATCH` |
| `waitfor_statement`  | Parser L261 | `WAITFOR DELAY 'time'` / `WAITFOR TIME 'time'` |
| `while_statement`    | Parser L262 | `WHILE condition sql_clause`                 |
| `label_statement`    | Parser L264 | `label_name:` (GOTO target)                  |

---

## 15. DDL Clause

### ANTLR4 Reference — Parser L73-L239 (~165 alternatives)

**Entirely missing.** This is the largest single gap.

Key DDL categories and their ANTLR4 locations:

| Category           | ANTLR4 Lines     | Count | Key Rules                                    |
|-------------------|-------------------|-------|----------------------------------------------|
| ALTER statements  | Parser L74-L121   | ~48   | ALTER TABLE, DATABASE, INDEX, etc.           |
| CREATE statements | Parser L122-L171  | ~50   | CREATE TABLE, INDEX, VIEW, etc.              |
| DROP statements   | Parser L172-L225  | ~54   | DROP TABLE, INDEX, VIEW, etc.                |
| Other DDL         | Parser L226-L239  | ~8    | DISABLE/ENABLE TRIGGER, LOCK TABLE, TRUNCATE, UPDATE STATISTICS |

**Highest-priority DDL for implementation:**

| Rule                       | ANTLR4 Line | Description                                  |
|---------------------------|-------------|----------------------------------------------|
| `create_table`            | Parser L1479| `CREATE TABLE name (col_def, constraints)`   |
| `alter_table`             | Parser L573 | `ALTER TABLE ... ADD/DROP/ALTER COLUMN`       |
| `drop_table`              | Parser L2107| `DROP TABLE [IF EXISTS] name`                |
| `create_index`            | Parser L1284| `CREATE [UNIQUE] [CLUSTERED] INDEX`          |
| `drop_index`              | Parser L2076| `DROP INDEX name ON table`                   |
| `create_or_alter_procedure`| Parser L2387| `CREATE [OR ALTER] PROC name AS ...`         |
| `create_or_alter_function` | Parser L2433| `CREATE [OR ALTER] FUNCTION name RETURNS ...` |
| `create_or_alter_trigger`  | Parser L2400| `CREATE [OR ALTER] TRIGGER name ON table ...` |
| `create_view`              | Parser L2570| `CREATE VIEW name AS SELECT ...`             |

---

## 16. another_statement

### ANTLR4 Reference — Parser L350-L368

### Implemented (grammar.js L132-L136)

Only `execute_statement`.

### Missing

| Statement                 | ANTLR4 Line | Description                                   |
|--------------------------|-------------|-----------------------------------------------|
| `cursor_statement`       | Parser L356 | OPEN/CLOSE/FETCH/DEALLOCATE/DECLARE CURSOR    |
| `declare_statement`      | Parser L357 | `DECLARE @var type`, `DECLARE @var TABLE(...)`|
| `set_statement`          | Parser L363 | `SET @var = expr`, `SET ANSI_NULLS ON`, etc.  |
| `transaction_statement`  | Parser L366 | BEGIN TRAN, COMMIT, ROLLBACK, SAVE TRAN       |
| `use_statement`          | Parser L367 | `USE database_name`                           |
| `kill_statement`         | Parser L359 | `KILL session_id`                             |
| `security_statement`     | Parser L362 | GRANT, DENY, REVOKE                           |
| `conversation_statement` | Parser L353 | Service Broker conversations                  |
| `message_statement`      | Parser L360 | Service Broker messages                       |
| `reconfigure_statement`  | Parser L361 | `RECONFIGURE [WITH OVERRIDE]`                 |
| `shutdown_statement`     | Parser L365 | `SHUTDOWN [WITH NOWAIT]`                      |
| `checkpoint_statement`   | Parser L352 | `CHECKPOINT [duration]`                       |
| `setuser_statement`      | Parser L364 | `SETUSER ['user']`                            |
| `alter_queue`            | Parser L351 | `ALTER QUEUE`                                 |
| `create_contract`        | Parser L354 | `CREATE CONTRACT`                             |
| `create_queue`           | Parser L355 | `CREATE QUEUE`                                |

**Highest-priority for implementation:**

1. `declare_statement` (Parser L2981) — needed for any procedural T-SQL
2. `set_statement` (Parser L3398) — needed for variable assignment and SET options
3. `transaction_statement` (Parser L3409) — BEGIN TRAN/COMMIT/ROLLBACK
4. `cursor_statement` (Parser L2994) — DECLARE/OPEN/FETCH/CLOSE/DEALLOCATE CURSOR
5. `use_statement` (Parser L367) — simple `USE database`

---

## 17. Remaining Major Subsystems

### DBCC — Parser L3635-L3652

**Not started.** 15 DBCC command variants:
CHECKALLOC, CHECKCATALOG, CHECKCONSTRAINTS, CHECKDB, CHECKFILEGROUP, CHECKTABLE, CLEANTABLE, CLONEDATABASE, DBREINDEX, DLL_FREE, DROPCLEANBUFFERS, PDW_SHOWSPACEUSED, PROCCACHE, SHOWCONTIG, SHRINKLOG

### Backup/Restore — Parser L241, L3008-L3117

**Not started.**
- `backup_database` (Parser L3008)
- `backup_log` (Parser L3054)
- `backup_certificate` (Parser L3101)
- `backup_master_key` (Parser L3112)
- `backup_service_master_key` (Parser L3117)
- Restore statements (not in another_statement but referenced)

### XML Methods — Parser L3905

**Not started.** Expression methods for XML typed columns:
- `.value(xpath, type)` — extract scalar value
- `.query(xpath)` — return XML fragment
- `.exist(xpath)` — check existence (returns 0/1)
- `.modify(xml_dml)` — modify XML in place
- `.nodes(xpath)` — shred XML into rows (used in FROM clause)

---

## 18. Lexer Token Reference

Key sections of TSqlLexer.g4 for implementing new features:

### Identifiers
| Token              | Lexer Line | Pattern                        |
|-------------------|------------|--------------------------------|
| `ID`              | L1225      | `[A-Z_#][A-Z_#$@0-9]*`        |
| `SQUARE_BRACKET_ID`| L1221     | `[...] delimited`              |
| `DOUBLE_QUOTE_ID` | L1218      | `"..." delimited`              |
| `TEMP_ID`         | L1223      | `#identifier`                  |
| `LOCAL_ID`        | L1222      | `@identifier`                  |

### Literals
| Token     | Lexer Line | Pattern                              |
|----------|------------|--------------------------------------|
| `STRING` | L1226      | `N?'([^']|'')*'`                     |
| `BINARY` | L1229      | `0x[0-9A-F]*`                        |
| `DECIMAL`| L1224      | `[0-9]+`                             |
| `FLOAT`  | L1230      | `DEC_DOT_DEC`                        |
| `REAL`   | L1231      | `(DECIMAL|DEC_DOT_DEC) E [+-]? digits`|

### Operators
| Token         | Lexer Line | Symbol |
|--------------|------------|--------|
| `EQUAL`      | L1233      | `=`    |
| `GREATER`    | L1235      | `>`    |
| `LESS`       | L1236      | `<`    |
| `EXCLAMATION`| L1237      | `!`    |
| `PLUS_ASSIGN`| L1239      | `+=`   |
| `MINUS_ASSIGN`| L1240     | `-=`   |
| `MULT_ASSIGN`| L1241      | `*=`   |
| `DIV_ASSIGN` | L1242      | `/=`   |
| `MOD_ASSIGN` | L1243      | `%=`   |
| `AND_ASSIGN` | L1244      | `&=`   |
| `XOR_ASSIGN` | L1245      | `^=`   |
| `OR_ASSIGN`  | L1246      | `|=`   |
| `DOUBLE_BAR` | L1248      | `\|\|` |
| `STAR`       | L1260      | `*`    |
| `DIVIDE`     | L1261      | `/`    |
| `MODULE`     | L1262      | `%`    |
| `PLUS`       | L1263      | `+`    |
| `MINUS`      | L1264      | `-`    |
| `BIT_NOT`    | L1265      | `~`    |
| `BIT_OR`     | L1266      | `\|`   |
| `BIT_AND`    | L1267      | `&`    |
| `BIT_XOR`    | L1268      | `^`    |

### Punctuation
| Token          | Lexer Line | Symbol |
|---------------|------------|--------|
| `SEMI`        | L1257      | `;`    |
| `COMMA`       | L1256      | `,`    |
| `DOT`         | L1249      | `.`    |
| `DOUBLE_COLON`| L1259      | `::`   |
| `COLON`       | L1258      | `:`    |
| `LR_BRACKET`  | L1254      | `(`    |
| `RR_BRACKET`  | L1255      | `)`    |
| `AT`          | L1251      | `@`    |
| `SHARP`       | L1252      | `#`    |
| `DOLLAR`      | L1253      | `$`    |
| `PLACEHOLDER` | L1270      | `?`    |

### Keywords
| Range          | Lexer Lines   | Content                              |
|---------------|---------------|--------------------------------------|
| Main keywords | L40-L1119     | ABORT through ZONE (~1080 keywords)  |
| Math funcs    | L1121-L1142   | ABS through TAN                      |
| Date funcs    | L1144-L1164   | CURRENT_TIMEZONE through YEAR        |
| Date parts    | L1166-L1177   | QUARTER through WEEKDAY              |
| Date abbrevs  | L1179-L1193   | YEAR_ABBR through WEEKDAY_ABBR       |

### Comments
| Token          | Lexer Line | Pattern                    |
|---------------|------------|----------------------------|
| `COMMENT`     | L1214      | `/* ... */` (nestable)     |
| `LINE_COMMENT`| L1215      | `-- ... \n`                |
| `SPACE`       | L1212      | `[ \t\r\n]+` (skipped)    |

---

## 19. Implementation Priority Recommendation

Based on impact and dependency analysis, here is a recommended implementation order:

### Phase 1 — Core Language (High Impact, Unlocks Most SQL)
| Priority | Feature                    | ANTLR4 Line         | Depends On          | Impact |
|----------|---------------------------|---------------------|---------------------|--------|
| 1        | `search_condition` / `predicate` | Parser L3977-L3993 | expression operators | Unlocks WHERE, HAVING, JOIN ON, IF |
| 2        | Expression operators       | Parser L3912-L3913  | —                   | `+`, `-`, `*`, `/`, `%`, `&`, `^`, `\|` |
| 3        | `bracket_expression`       | Parser L3945        | —                   | `(expr)` and `(subquery)`         |
| 4        | `case_expression`          | Parser L3935        | search_condition    | CASE WHEN ... THEN ... END        |
| 5        | `unary_operator_expression`| Parser L3940        | —                   | `-expr`, `+expr`, `~expr`         |
| 6        | Multi-part `full_column_name`| Parser L5155      | —                   | `table.column`                    |
| 7        | WHERE clause               | Parser L4016        | search_condition    | `WHERE condition`                 |
| 8        | HAVING clause              | Parser L4022        | search_condition    | `HAVING condition`                |
| 9        | `keyword` expansion        | Parser L5287-L6258  | —                   | Allow keywords as identifiers     |

### Phase 2 — SELECT Completeness
| Priority | Feature              | ANTLR4 Line   | Depends On       |
|----------|---------------------|---------------|------------------|
| 10       | JOIN syntax          | Parser L4224  | search_condition |
| 11       | Table aliases        | Parser L4171  | —                |
| 12       | `with_expression`    | Parser L3955  | select_statement |
| 13       | `sql_union`          | Parser L4002  | query_expression |
| 14       | `select_order_by_clause` | Parser L4046 | —            |
| 15       | `top_clause`         | Parser L4026  | —                |
| 16       | `ALL`/`DISTINCT`     | Parser L4011  | —                |
| 17       | Derived tables       | Parser L4172  | table_source_item|
| 18       | `for_clause`         | Parser L4055  | —                |
| 19       | `option_clause`      | Parser L4089  | —                |

### Phase 3 — DML
| Priority | Feature            | ANTLR4 Line   | Depends On                |
|----------|--------------------|---------------|---------------------------|
| 20       | `insert_statement`  | Parser L2161  | expression, table_name    |
| 21       | `update_statement`  | Parser L2195  | search_condition, JOINs   |
| 22       | `delete_statement`  | Parser L2148  | search_condition, JOINs   |
| 23       | `merge_statement`   | Parser L2127  | search_condition, JOINs   |

### Phase 4 — Procedural / Control Flow
| Priority | Feature              | ANTLR4 Line   | Depends On       |
|----------|---------------------|---------------|------------------|
| 24       | `declare_statement`  | Parser L2981  | data_type        |
| 25       | `set_statement`      | Parser L3398  | expression       |
| 26       | `block_statement`    | Parser L251   | sql_clauses      |
| 27       | `if_statement`       | Parser L255   | search_condition |
| 28       | `while_statement`    | Parser L262   | search_condition |
| 29       | `return_statement`   | Parser L258   | expression       |
| 30       | `try_catch_statement`| Parser L260   | block_statement  |
| 31       | `transaction_statement`| Parser L3409| —                |
| 32       | `print_statement`    | Parser L256   | expression       |
| 33       | `throw_statement`    | Parser L259   | —                |

### Phase 5 — Built-in Functions (can be parallelized)
| Priority | Category         | ANTLR4 Lines     | Count |
|----------|-----------------|-------------------|-------|
| 34       | Conversion funcs | Parser L4551-L4557| 5 remaining |
| 35       | String funcs     | Parser L4422-L4491| ~30   |
| 36       | Date/Time funcs  | Parser L4583-L4649| ~29   |
| 37       | Math funcs       | Parser L4678-L4722| ~23   |
| 38       | System funcs     | Parser L4493-L4548| ~27   |
| 39       | JSON funcs       | Parser L4662-L4675| 7     |
| 40       | Security funcs   | Parser L4730-L4782| ~24   |

### Phase 6 — DDL
| Priority | Feature                 | ANTLR4 Line   |
|----------|------------------------|---------------|
| 41       | `create_table`          | Parser L1479  |
| 42       | `alter_table`           | Parser L573   |
| 43       | `drop_table`            | Parser L2107  |
| 44       | `create_index`          | Parser L1284  |
| 45       | `create_or_alter_procedure` | Parser L2387 |
| 46       | `create_or_alter_function`  | Parser L2433 |
| 47       | `create_view`           | Parser L2570  |
| 48       | `create_or_alter_trigger`   | Parser L2400 |

### Phase 7 — Everything Else
| Priority | Feature          | ANTLR4 Line   |
|----------|-----------------|---------------|
| 49       | Remaining data types | Parser L5260 |
| 50       | `cursor_statement`   | Parser L2994 |
| 51       | `use_statement`      | Parser L367  |
| 52       | `dbcc_clause`        | Parser L3635 |
| 53       | `backup_statement`   | Parser L241  |
| 54       | `freetext_function`  | Parser L4302 |
| 55       | XML methods          | Parser L3905 |

---

## 20. Summary Table

| Category                | ANTLR4 Rules | Implemented | % Done | Phase |
|------------------------|-------------|-------------|--------|-------|
| Batch / GO / Top-level | ~10         | ~6          | 60%    | —     |
| EXECUTE statement      | ~15         | ~14         | 93%    | —     |
| Ranking functions      | 4           | 4           | 100%   | —     |
| Aggregate functions    | ~17         | ~17         | 100%   | —     |
| Analytic functions     | ~8          | ~8          | 100%   | —     |
| OVER / Window spec     | ~10         | ~10         | 100%   | —     |
| Configuration funcs    | ~15         | ~15         | 100%   | —     |
| Bit manipulation       | ~5          | ~5          | 100%   | —     |
| Collation functions    | 2           | 2           | 100%   | —     |
| HierarchyID methods    | ~8          | ~8          | 100%   | —     |
| Partition functions    | 2           | 2           | 100%   | —     |
| Scalar function calls  | 4           | 4           | 100%   | —     |
| Data types             | ~40+        | ~26         | 65%    | 7     |
| ODBC scalar functions  | ~50+        | ~17         | 34%    | —     |
| Expressions            | ~15         | 3           | 20%    | 1     |
| SELECT statement       | ~30         | ~15         | 50%    | 2     |
| Built-in functions     | ~200+       | ~32         | 16%    | 5     |
| Conversion functions   | 6           | 1           | 17%    | 5     |
| Search condition       | ~15         | 0           | 0%     | 1     |
| JOIN syntax            | ~10         | 0           | 0%     | 2     |
| Table sources          | ~15         | ~3          | 20%    | 2     |
| DML (INSERT/UPDATE/DELETE/MERGE) | ~50+ | 0      | 0%     | 3     |
| Control flow           | ~15         | 0           | 0%     | 4     |
| DECLARE / SET          | ~10         | 0           | 0%     | 4     |
| Transaction statements | ~5          | 0           | 0%     | 4     |
| DDL (CREATE/ALTER/DROP)| ~300+       | 0           | 0%     | 6     |
| DBCC                   | ~15         | 0           | 0%     | 7     |
| Backup/Restore         | ~10         | 0           | 0%     | 7     |
| Security (GRANT/DENY)  | ~10+        | 0           | 0%     | 7     |
| Cursor statements      | ~5          | 0           | 0%     | 7     |
| Freetext functions     | ~7          | 0           | 0%     | 7     |
| XML methods            | ~5          | 0           | 0%     | 7     |
