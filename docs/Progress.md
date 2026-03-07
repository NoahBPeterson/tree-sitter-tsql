# tree-sitter-tsql Implementation Progress

> Exhaustive checklist tracking every feature from the ANTLR4 T-SQL reference grammar.
> See [implementation-guide.md](implementation-guide.md) for detailed notes and ANTLR4 line references.
>
> **Legend:** `[x]` = Done, `[ ]` = Not started, `[~]` = Partial

---

## Phase 1 — Core Language

### 1.1 Expression Operators (Parser L3902-L3917)

- [x] `primitive_expression` (Parser L3903, grammar.js L528-L533)
- [x] `function_call` (Parser L3904, grammar.js L349-L371)
- [x] `full_column_name` — single identifier only (Parser L3909, grammar.js L336-L338)
- [x] `full_column_name` — multi-part: `table.column`, `schema.table.column` (Parser L5155-L5160)
- [x] `full_column_name` — `DELETED.column`, `INSERTED.column` (Parser L5156)
- [x] `bracket_expression` — `(expression)` (Parser L3945)
- [x] `bracket_expression` — `(subquery)` (Parser L3946)
- [x] `unary_operator_expression` — `~expr`, `-expr`, `+expr` (Parser L3940)
- [x] Multiplicative operators — `expr * expr`, `expr / expr`, `expr % expr` (Parser L3912)
- [x] Additive operators — `expr + expr`, `expr - expr` (Parser L3913)
- [x] Bitwise operators — `expr & expr`, `expr ^ expr`, `expr | expr`, `expr || expr` (Parser L3913)
- [x] `case_expression` — simple CASE: `CASE expr WHEN val THEN result END` (Parser L3935)
- [x] `case_expression` — searched CASE: `CASE WHEN condition THEN result END` (Parser L3936)
- [x] `COLLATE` on expression — `expression COLLATE collation_name` (Parser L3907)
- [x] `AT TIME ZONE` — `expression AT TIME ZONE 'zone'` (Parser L3914)
- [x] XML `.value()` method (Parser L3905)
- [x] XML `.query()` method (Parser L3905)
- [x] XML `.exist()` method (Parser L3905)
- [x] XML `.modify()` method (Parser L3905)
- [x] `expression.hierarchyid_call` (Parser L3906)
- [x] `DOLLAR_ACTION` — `$action` for MERGE (Parser L3916)
- [~] `over_clause` as standalone expression (Parser L3915) — skipped: semantically invalid SQL (OVER must attach to aggregate/window function)

### 1.2 Search Condition / Predicates (Parser L3977-L3993)

- [x] `search_condition` — `NOT? predicate (AND|OR search_condition)*` (Parser L3977)
- [x] `comparison_operator` — `= <> != < > <= >= !< !>` (Parser L3970)
- [x] Comparison predicate — `expr comparison_operator expr` (Parser L3986)
- [x] `BETWEEN` predicate — `expr [NOT] BETWEEN expr AND expr` (Parser L3989)
- [x] `IN` predicate (list) — `expr [NOT] IN (val1, val2, ...)` (Parser L3990)
- [x] `IN` predicate (subquery) — `expr [NOT] IN (SELECT ...)` (Parser L3990)
- [x] `LIKE` predicate — `expr [NOT] LIKE pattern [ESCAPE char]` (Parser L3991)
- [x] `IS NULL` predicate — `expr IS [NOT] NULL` (Parser L3992)
- [x] `EXISTS` predicate — `EXISTS (subquery)` (Parser L3984)
- [x] `ALL`/`SOME`/`ANY` predicate — `expr op ALL|SOME|ANY (subquery)` (Parser L3988)
- [x] `freetext_predicate` — `CONTAINS(col, 'text')` (Parser L3985)
- [x] `freetext_predicate` — `FREETEXT(col, 'text')` (Parser L3985)

### 1.3 WHERE and HAVING Clauses

- [x] WHERE clause in `query_specification` (Parser L4016)
- [x] HAVING clause in `query_specification` (Parser L4022)

### 1.4 Keyword-as-Identifier Expansion (Parser L5287-L6258)

- [x] `keyword` rule — 35 curated keywords (trimmed from 130 for parser size optimization)
- [~] Expand `keyword` to include more T-SQL keywords (~35 done, remaining can be bracket-quoted; statement-starting keywords excluded to avoid state explosion; LARGE_STATE_COUNT scales linearly with keyword count)

### 1.5 Identifier Fixes (Lexer L1218-L1225)

- [x] `ID` — regular identifiers (grammar.js L22)
- [x] `SQUARE_BRACKET_ID` — `[delimited]` identifiers (grammar.js L23)
- [x] `LOCAL_ID` — `@variable` (grammar.js L24)
- [x] `DOUBLE_QUOTE_ID` — `"delimited"` identifiers (Lexer L1218)
- [x] `TEMP_ID` — `#temp` / `##global_temp` (Lexer L1223)
- [x] Fix `ID` regex to allow single-char identifiers (`+` should be `*`) (Lexer L1225)

---

## Phase 2 — SELECT Completeness

### 2.1 Query Specification Enhancements (Parser L4010-L4023)

- [x] Basic `SELECT select_list` (grammar.js L220-L227)
- [x] `FROM table_sources` (grammar.js L223)
- [x] `GROUP BY expression, ...` (grammar.js L243-L252)
- [x] `SELECT ALL` (Parser L4011)
- [x] `SELECT DISTINCT` (Parser L4011)
- [x] `top_clause` — `TOP (n)` (Parser L4026)
- [x] `top_percent` — `TOP (n) PERCENT` (Parser L4030)
- [x] `top_count` — `TOP n` without parens (Parser L4035)
- [x] `WITH TIES` (Parser L4027)
- [x] `INTO table_name` — `SELECT ... INTO #temp` (Parser L4015)
- [x] `GROUP BY ALL` (Parser L4018)
- [x] `GROUP BY ROLLUP(col, ...)` (Parser L4018)
- [x] `GROUP BY CUBE(col, ...)` (Parser L4018)
- [x] `GROUP BY GROUPING SETS(...)` (Parser L4019)
- [x] `grouping_sets_item` (Parser L4019)

### 2.2 SELECT Statement Wrappers (Parser L2182-L2186)

- [x] `select_statement_standalone` — without CTE (grammar.js L204-L207)
- [x] `select_statement` — `query_expression ;` (grammar.js L209-L213)
- [x] `query_expression` — single query_specification (grammar.js L215-L218)
- [x] `with_expression` (CTEs) — `WITH cte AS (SELECT ...) SELECT ...` (Parser L3955)
- [x] `common_table_expression` — `name [(cols)] AS (select)` (Parser L3959)
- [~] Recursive CTEs (Parser L3955) — syntax parses, no special handling
- [x] `select_order_by_clause` — `ORDER BY col [ASC|DESC]` (Parser L4046)
- [x] `OFFSET n ROWS` (Parser L4048)
- [x] `FETCH FIRST|NEXT n ROWS ONLY` (Parser L4049)
- [x] `for_clause` — `FOR BROWSE` (Parser L4055)
- [x] `for_clause` — `FOR XML RAW` (Parser L4058)
- [x] `for_clause` — `FOR XML AUTO` (Parser L4059)
- [x] `for_clause` — `FOR XML EXPLICIT` (Parser L4060)
- [x] `for_clause` — `FOR XML PATH` (Parser L4061)
- [x] `for_clause` — `FOR JSON AUTO` (Parser L4067)
- [x] `for_clause` — `FOR JSON PATH` (Parser L4068)
- [x] `option_clause` — `OPTION (query_hint, ...)` (Parser L4089)
- [x] `sql_union` — `UNION [ALL]` (Parser L4002)
- [x] `sql_union` — `EXCEPT` (Parser L4002)
- [x] `sql_union` — `INTERSECT` (Parser L4002)
- [x] Parenthesized `query_expression` — `(query_expression)` (Parser L3999) — hidden `_query_unit` rule: `choice(query_specification, '(' query_expression ')')`

### 2.3 Table Sources / FROM Clause (Parser L4150-L4256)

- [x] `table_sources` — single table_source (grammar.js L299-L301)
- [x] `table_source` — table_source_item only (grammar.js L305)
- [x] `table_source_item` — full_table_name only (grammar.js L307-L309)
- [x] `full_table_name` — 1-4 part names (grammar.js L325-L333)
- [x] Multiple `table_sources` — comma-separated (implicit cross join) (Parser L4152)
- [x] `as_table_alias` — `table AS alias` / `table alias` (Parser L4171)
- [x] `with_table_hints` — `WITH (NOLOCK)`, etc. (Parser L4173)
- [x] Derived tables — `(SELECT ...) AS alias` (Parser L4172)
- [x] Table-valued functions — `dbo.fn_table(@param)` (Parser L4175)
- [x] `LOCAL_ID` as table source — `@tablevar` (Parser L4176)
- [x] `rowset_function` — `OPENROWSET(...)` (Parser L4167)
- [x] `rowset_function` — `OPENQUERY(...)` (Parser L4167)
- [x] `rowset_function` — `OPENDATASOURCE(...)` (Parser L4167)
- [x] `change_table` — `CHANGETABLE(CHANGES ...)` (Parser L4177)
- [x] `change_table` — `CHANGETABLE(VERSION ...)` (Parser L4177)
- [x] `nodes_method` — XML `.nodes()` in FROM (Parser L4180)
- [x] `open_xml` (Parser L4182)
- [x] `open_json` (Parser L4183)
- [x] `TABLESAMPLE (n PERCENT|ROWS)` (Parser L4186)

### 2.4 JOIN Syntax (Parser L4224-L4256)

- [x] `join_part` rule — attach joins to table_source (Parser L4224)
- [x] `INNER JOIN ... ON condition` (Parser L4233)
- [x] `LEFT [OUTER] JOIN ... ON condition` (Parser L4234)
- [x] `RIGHT [OUTER] JOIN ... ON condition` (Parser L4234)
- [x] `FULL [OUTER] JOIN ... ON condition` (Parser L4234)
- [x] `CROSS JOIN` (Parser L4239)
- [x] `CROSS APPLY` (Parser L4243)
- [x] `OUTER APPLY` (Parser L4243)
- [x] Join hints — `LOOP`, `HASH`, `MERGE`, `REMOTE` (Parser L4235)
- [x] `PIVOT (agg FOR col IN (vals)) AS alias` (Parser L4247)
- [x] `UNPIVOT (col FOR col IN (cols)) AS alias` (Parser L4251)

### 2.5 Select List (Parser L4119-L4148)

- [x] `select_list` — comma-separated elements (grammar.js L231)
- [x] `select_list_elem` — asterisk `*` (grammar.js L235)
- [x] `select_list_elem` — `udt_elem` (grammar.js L236)
- [x] `select_list_elem` — `@var OP= expression` (grammar.js L237)
- [x] `select_list_elem` — `expression_elem` (grammar.js L238)
- [x] `expression_elem` — `alias = expression` (grammar.js L285)
- [x] `expression_elem` — `expression [AS alias]` (grammar.js L286)
- [x] `as_column_alias` / `column_alias` (grammar.js L290-L297)
- [x] `udt_elem` — dot and double-colon method calls (grammar.js L270-L276)
- [x] `udt_method_arguments` (grammar.js L279-L281)
- [x] `assignment_operator` — `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `^=`, `|=` (grammar.js L255-L264)
- [x] `table_name.* ` — qualified asterisk (Parser L4147)

---

## Phase 3 — DML Statements

### 3.1 INSERT Statement (Parser L2161-L2180)

- [x] `insert_statement` rule (Parser L2161)
- [x] `INSERT INTO table` with column list (Parser L2162)
- [x] `insert_statement_value` — `VALUES (expr, ...)` (Parser L2168)
- [x] `insert_statement_value` — `VALUES (expr, ...), (expr, ...)` (multi-row) (Parser L2169)
- [x] `insert_statement_value` — derived table / SELECT (Parser L2170)
- [x] `insert_statement_value` — `execute_statement` (Parser L2171)
- [x] `insert_statement_value` — `DEFAULT VALUES` (Parser L2172)
- [x] INSERT with `TOP` (Parser L2163)
- [x] INSERT with `OUTPUT` clause (Parser L2165)
- [x] INSERT with `WITH` (CTE) (Parser L2161)
- [x] `insert_target` — `INSERT INTO @variable` for table variables

### 3.2 UPDATE Statement (Parser L2195-L2220)

- [x] `update_statement` rule (Parser L2195)
- [x] `UPDATE table SET col = expr` (Parser L2196)
- [x] `update_elem` — `col = expression` (Parser L2197)
- [x] `update_elem` — `col assignment_operator expression` (Parser L2198)
- [x] `update_elem` — `@var = col = expression` (Parser L2199)
- [x] UPDATE with `FROM` clause (Parser L2202)
- [x] UPDATE with `WHERE` (Parser L2204)
- [x] UPDATE with `TOP` (Parser L2196)
- [x] UPDATE with `OUTPUT` clause (Parser L2203)
- [x] UPDATE with `WITH` (CTE) (Parser L2195)
- [x] UPDATE with table hints (Parser L2200)
- [x] UPDATE `CURRENT OF cursor` (Parser L2205)

### 3.3 DELETE Statement (Parser L2148-L2160)

- [x] `delete_statement` rule (Parser L2148)
- [x] `DELETE FROM table` (Parser L2149)
- [x] `delete_statement_from` — `FROM table_sources` (Parser L2154)
- [x] DELETE with `WHERE` (Parser L2155)
- [x] DELETE with `TOP` (Parser L2149)
- [x] DELETE with `OUTPUT` clause (Parser L2153)
- [x] DELETE with `WITH` (CTE) (Parser L2148)
- [x] DELETE `CURRENT OF cursor` (Parser L2156)

### 3.4 MERGE Statement (Parser L2127-L2146)

- [x] `merge_statement` rule (Parser L2127)
- [x] `MERGE INTO target USING source ON condition` (Parser L2128)
- [x] `when_matches` — `WHEN MATCHED THEN UPDATE SET ...` (Parser L2132)
- [x] `when_matches` — `WHEN MATCHED THEN DELETE` (Parser L2133)
- [x] `when_matches` — `WHEN NOT MATCHED THEN INSERT ...` (Parser L2134)
- [x] `when_matches` — `WHEN NOT MATCHED BY SOURCE THEN ...` (Parser L2135)
- [x] `merge_matched` (Parser L2138)
- [x] `merge_not_matched` (Parser L2143)
- [x] MERGE with `OUTPUT` clause (Parser L2131)
- [x] MERGE with `WITH` (CTE) (Parser L2127)
- [x] `$action` in MERGE OUTPUT (Parser L3916)

### 3.5 OUTPUT Clause (shared across DML)

- [x] `output_clause` — `OUTPUT inserted.col, deleted.col` (Parser L2228)
- [x] `output_dml_list_elem` (Parser L2235)
- [~] `output_column_name` (Parser L2241) — handled via expression
- [x] `OUTPUT INTO table` (Parser L2230)

---

## Phase 4 — Procedural / Control Flow

### 4.1 DECLARE Statement (Parser L2981-L2993)

- [x] `DECLARE @var data_type` (Parser L2982)
- [x] `DECLARE @var data_type = expression` (Parser L2983)
- [x] `DECLARE @var TABLE (col_def, ...)` (Parser L2984)
- [x] Multiple declarations — `DECLARE @a INT, @b VARCHAR(10)` (Parser L2985)
- [x] `DECLARE @var AS table_name` (Parser L2986)
- [x] `DECLARE @var CURSOR` (Parser L2987) — works via `cursor_dt_` data type
- [x] `DECLARE @xml_var XML` with XMLNAMESPACES (Parser L2988) — XMLNAMESPACES supported in `with_expression`

### 4.2 SET Statement (Parser L3398-L3408)

- [x] `SET @var = expression` (Parser L3399)
- [x] `SET @var assignment_operator expression` (`+=`, `-=`, etc.) (Parser L3400)
- [x] `SET @cursor = CURSOR FOR select_statement` (Parser L3401)
- [x] `set_special` — `SET ANSI_NULLS ON|OFF` (Parser L3402)
- [x] `set_special` — `SET ANSI_PADDING ON|OFF` (Parser L3402)
- [x] `set_special` — `SET ANSI_WARNINGS ON|OFF` (Parser L3402)
- [x] `set_special` — `SET ARITHABORT ON|OFF` (Parser L3402)
- [x] `set_special` — `SET CONCAT_NULL_YIELDS_NULL ON|OFF` (Parser L3402)
- [x] `set_special` — `SET NOCOUNT ON|OFF` (Parser L3402)
- [x] `set_special` — `SET QUOTED_IDENTIFIER ON|OFF` (Parser L3402)
- [x] `set_special` — `SET XACT_ABORT ON|OFF` (Parser L3402)
- [x] `set_special` — `SET TRANSACTION ISOLATION LEVEL ...` (Parser L3404)
- [x] `set_special` — `SET IDENTITY_INSERT table ON|OFF` (Parser L3405)
- [x] `set_special` — `SET ROWCOUNT expression` (Parser L3406)
- [x] `set_special` — `SET STATISTICS IO|TIME|XML|PROFILE ON|OFF` (Parser L3847)
- [x] `set_special` — `SET TEXTSIZE n` (Parser L3847)
- [x] `set_special` — other SET options: LANGUAGE, DATEFORMAT, DATEFIRST, LOCK_TIMEOUT, DEADLOCK_PRIORITY, CONTEXT_INFO, QUERY_GOVERNOR_COST_LIMIT (Parser L3402-L3408)

### 4.3 Control Flow — cfl_statement (Parser L250-L264)

- [x] `block_statement` — `BEGIN sql_clauses* END` (Parser L251)
- [x] `if_statement` — `IF search_condition sql_clause [ELSE sql_clause]` (Parser L255)
- [x] `while_statement` — `WHILE search_condition sql_clause` (Parser L262)
- [x] `return_statement` — `RETURN [expression]` (Parser L258)
- [x] `break_statement` — `BREAK` (Parser L252)
- [x] `continue_statement` — `CONTINUE` (Parser L253)
- [x] `try_catch_statement` — `BEGIN TRY ... END TRY BEGIN CATCH ... END CATCH` (Parser L260)
- [x] `throw_statement` — `THROW [number, message, state]` (Parser L259)
- [x] `print_statement` — `PRINT expression` (Parser L256)
- [x] `raiseerror_statement` — `RAISERROR(msg, severity, state [, args])` (Parser L257)
- [x] `goto_statement` — `GOTO label` (Parser L254)
- [x] `label_statement` — `label_name:` — GOTO target label definition (Parser L283)
- [x] `waitfor_statement` — `WAITFOR DELAY 'time'` (Parser L261)
- [x] `waitfor_statement` — `WAITFOR TIME 'time'` (Parser L261)

### 4.4 Transaction Statements (Parser L3409-L3430)

- [x] `BEGIN TRANSACTION [name]` (Parser L3410)
- [x] `BEGIN DISTRIBUTED TRANSACTION [name]` (Parser L3411)
- [x] `COMMIT TRANSACTION [name]` (Parser L3414)
- [x] `COMMIT WORK` (Parser L3416)
- [x] `ROLLBACK TRANSACTION [name]` (Parser L3420)
- [x] `ROLLBACK WORK` (Parser L3422)
- [x] `SAVE TRANSACTION name` (Parser L3426)

### 4.5 Cursor Statements (Parser L2994-L3007)

- [x] `DECLARE cursor_name CURSOR [options] FOR select_statement` (Parser L2994)
- [x] `OPEN cursor_name` (Parser L2998)
- [x] `FETCH [NEXT|PRIOR|FIRST|LAST|ABSOLUTE|RELATIVE] FROM cursor INTO @vars` (Parser L2999)
- [x] `CLOSE cursor_name` (Parser L3002)
- [x] `DEALLOCATE cursor_name` (Parser L3003)

### 4.6 USE Statement (Parser L367)

- [x] `USE database_name` (Parser L367)

---

## Phase 5 — Built-in Functions

### 5.1 Conversion Functions (Parser L4551-L4557)

- [x] `CAST(expression AS data_type)` (conversion_functions.js L6)
- [x] `CONVERT(data_type, expression [, style])` (conversion_functions.js)
- [x] `TRY_CAST(expression AS data_type)` (conversion_functions.js)
- [x] `TRY_CONVERT(data_type, expression [, style])` (conversion_functions.js)
- [x] `PARSE(string AS data_type [USING culture])` (conversion_functions.js)
- [x] `TRY_PARSE(string AS data_type [USING culture])` (conversion_functions.js)
- [x] `COALESCE(expression, expression, ...)` (grammar.js — coalesce_function)
- [x] `NULLIF(expression, expression)` (grammar.js — nullif_function)
- [x] `IIF(condition, true_val, false_val)` (grammar.js — iif_function)

### 5.2 Metadata Functions — remaining (Parser ~L4410-L4420)

- [x] APP_NAME through PARSENAME — 32 functions done (builtins.js)
- [x] `SCHEMA_ID([schema_name])` (Parser ~L4411)
- [x] `SCHEMA_NAME([schema_id])` (Parser ~L4412)
- [x] `SCOPE_IDENTITY()` (Parser ~L4413)
- [x] `SERVERPROPERTY(property)` (Parser ~L4414)
- [x] `STATS_DATE(object_id, stats_id)` (Parser ~L4415)
- [x] `TYPE_ID(type_name)` (Parser ~L4416)
- [x] `TYPE_NAME(type_id)` (Parser ~L4417)
- [x] `TYPEPROPERTY(type, property)` (Parser ~L4418)

### 5.3 String Functions (Parser ~L4422-L4491)

- [x] `ASCII(character_expression)` (~L4423)
- [x] `CHAR(integer_expression)` (~L4425)
- [x] `CHARINDEX(expression, expression [, start])` (~L4427)
- [x] `CONCAT(string1, string2 [, ...])` (~L4429)
- [x] `CONCAT_WS(separator, string1, string2 [, ...])` (~L4431)
- [x] `DIFFERENCE(string1, string2)` (~L4433)
- [x] `FORMAT(value, format [, culture])` (~L4435)
- [x] `LEFT(string, count)` (~L4437)
- [x] `LEN(string)` (~L4439)
- [x] `LOWER(string)` (~L4441)
- [x] `LTRIM(string)` (~L4443)
- [x] `NCHAR(integer)` (~L4445)
- [x] `PATINDEX(pattern, string)` (~L4447)
- [x] `QUOTENAME(string [, delimiter])` (~L4449)
- [x] `REPLACE(string, old, new)` (~L4451)
- [x] `REPLICATE(string, count)` (~L4453)
- [x] `REVERSE(string)` (~L4455)
- [x] `RIGHT(string, count)` (~L4457)
- [x] `RTRIM(string)` (~L4459)
- [x] `SOUNDEX(string)` (~L4461)
- [x] `SPACE(count)` (~L4463)
- [x] `STR(float [, length [, decimal]])` (~L4465)
- [x] `STRING_ESCAPE(text, type)` (~L4469)
- [x] `STUFF(string, start, length, replacement)` (~L4471)
- [x] `SUBSTRING(string, start, length)` (~L4473)
- [x] `TRANSLATE(string, from_chars, to_chars)` (~L4477)
- [x] `TRIM([chars FROM] string)` (~L4479)
- [x] `UNICODE(character)` (~L4483)
- [x] `UPPER(string)` (~L4485)

### 5.4 Date/Time Functions (Parser ~L4583-L4649)

- [x] `CURRENT_DATE` (~L4584)
- [x] `CURRENT_TIMESTAMP` (~L4586)
- [x] `CURRENT_TIMEZONE()` (~L4588)
- [x] `CURRENT_TIMEZONE_ID()` (~L4590)
- [x] `DATE_BUCKET(datepart, number, date [, origin])` (~L4592)
- [x] `DATEADD(datepart, number, date)` (~L4594)
- [x] `DATEDIFF(datepart, start, end)` (~L4596)
- [x] `DATEDIFF_BIG(datepart, start, end)` (~L4598)
- [x] `DATEFROMPARTS(year, month, day)` (~L4600)
- [x] `DATENAME(datepart, date)` (~L4602)
- [x] `DATEPART(datepart, date)` (~L4604)
- [x] `DATETIME2FROMPARTS(year, month, day, hour, minute, seconds, fractions, precision)` (~L4608)
- [x] `DATETIMEFROMPARTS(year, month, day, hour, minute, seconds, milliseconds)` (~L4610)
- [x] `DATETIMEOFFSETFROMPARTS(...)` (~L4612)
- [x] `DATETRUNC(datepart, date)` (~L4614)
- [x] `DAY(date)` (~L4616)
- [x] `EOMONTH(date [, months_to_add])` (~L4618)
- [x] `GETDATE()` (~L4620)
- [x] `GETUTCDATE()` (~L4622)
- [x] `ISDATE(expression)` (~L4624)
- [x] `MONTH(date)` (~L4632)
- [x] `SMALLDATETIMEFROMPARTS(year, month, day, hour, minute)` (~L4636)
- [x] `SWITCHOFFSET(datetimeoffset, timezone)` (~L4638)
- [x] `SYSDATETIME()` (~L4640)
- [x] `SYSDATETIMEOFFSET()` (~L4641)
- [x] `SYSUTCDATETIME()` (~L4642)
- [x] `TIMEFROMPARTS(hour, minute, seconds, fractions, precision)` (~L4644)
- [x] `TODATETIMEOFFSET(expression, timezone)` (~L4646)
- [x] `YEAR(date)` (~L4648)

### 5.5 Math Functions (Parser ~L4678-L4722)

- [x] `ABS(numeric)` (~L4679)
- [x] `ACOS(float)` (~L4681)
- [x] `ASIN(float)` (~L4683)
- [x] `ATAN(float)` (~L4685)
- [x] `ATN2(float, float)` (~L4687)
- [x] `CEILING(numeric)` (~L4689)
- [x] `COS(float)` (~L4691)
- [x] `COT(float)` (~L4693)
- [x] `DEGREES(numeric)` (~L4695)
- [x] `EXP(float)` (~L4697)
- [x] `FLOOR(numeric)` (~L4699)
- [x] `LOG(float [, base])` (~L4701)
- [x] `LOG10(float)` (~L4703)
- [x] `PI()` (~L4705)
- [x] `POWER(float, y)` (~L4707)
- [x] `RADIANS(numeric)` (~L4709)
- [x] `RAND([seed])` (~L4711)
- [x] `ROUND(numeric, length [, function])` (~L4713)
- [x] `SIGN(numeric)` (~L4715)
- [x] `SIN(float)` (~L4717)
- [x] `SQRT(float)` (~L4719)
- [x] `SQUARE(float)` (~L4720)
- [x] `TAN(float)` (~L4722)

### 5.6 System Functions (Parser ~L4493-L4548)

- [x] `BINARY_CHECKSUM(* | expression, ...)` (~L4494)
- [x] `CHECKSUM(* | expression, ...)` (~L4496)
- [x] `COMPRESS(expression)` (~L4498)
- [x] `CONNECTIONPROPERTY(property)` (~L4500)
- [x] `CONTEXT_INFO()` (~L4502)
- [x] `CURRENT_REQUEST_ID()` (~L4504)
- [x] `CURRENT_TRANSACTION_ID()` (~L4506)
- [x] `DECOMPRESS(expression)` (~L4508)
- [x] `ERROR_LINE()` (~L4510)
- [x] `ERROR_MESSAGE()` (~L4512)
- [x] `ERROR_NUMBER()` (~L4514)
- [x] `ERROR_PROCEDURE()` (~L4516)
- [x] `ERROR_SEVERITY()` (~L4518)
- [x] `ERROR_STATE()` (~L4520)
- [x] `FORMATMESSAGE(msg_number | msg_string, params)` (~L4522)
- [x] `GET_FILESTREAM_TRANSACTION_CONTEXT()` (~L4524)
- [x] `GETANSINULL([database])` (~L4526)
- [x] `HOST_ID()` (~L4528)
- [x] `HOST_NAME()` (~L4530)
- [x] `ISNULL(expression, replacement)` (~L4532)
- [x] `ISNUMERIC(expression)` (~L4534)
- [x] `MIN_ACTIVE_ROWVERSION()` (~L4536)
- [x] `NEWID()` (~L4538)
- [x] `NEWSEQUENTIALID()` (~L4540)
- [x] `ROWCOUNT_BIG()` (~L4542)
- [x] `SESSION_CONTEXT(N'key')` (~L4544)
- [x] `XACT_STATE()` (~L4548)

### 5.7 JSON Functions (Parser ~L4662-L4675)

- [x] `ISJSON(expression)` (~L4663)
- [x] `JSON_OBJECT(key:value, ...)` (~L4665)
- [x] `JSON_ARRAY(value, ...)` (~L4667)
- [x] `JSON_VALUE(expression, path)` (~L4669)
- [x] `JSON_QUERY(expression, path)` (~L4671)
- [x] `JSON_MODIFY(expression, path, new_value)` (~L4673)
- [x] `JSON_PATH_EXISTS(expression, path)` (~L4675)

### 5.8 Logical Functions (Parser ~L4724-L4727)

- [x] `CHOOSE(index, val1, val2, ...)` (LSP sql.tmLanguage.json:286)
- [x] `GREATEST(expression, expression, ...)` (~L4725)
- [x] `LEAST(expression, expression, ...)` (~L4727)

### 5.9 Security Functions (Parser ~L4730-L4782)

- [x] `CERTENCODED(cert_id)` (~L4731)
- [x] `CERTPRIVATEKEY(cert_id [, password])` (~L4733)
- [x] `CURRENT_USER` (~L4735)
- [x] `DATABASE_PRINCIPAL_ID([principal_name])` (~L4737)
- [x] `HAS_DBACCESS(database_name)` (~L4739)
- [x] `HAS_PERMS_BY_NAME(securable, class, permission)` (~L4741)
- [x] `IS_MEMBER(group_or_role)` (~L4743)
- [x] `IS_ROLEMEMBER(role [, principal])` (~L4745)
- [x] `IS_SRVROLEMEMBER(role [, login])` (~L4747)
- [x] `LOGINPROPERTY(login, property)` (~L4749)
- [x] `ORIGINAL_LOGIN()` (~L4751)
- [x] `PERMISSIONS([objectid [, column]])` (~L4753)
- [x] `PWDENCRYPT(password)` (~L4757)
- [x] `PWDCOMPARE(clear_text, hashed_password)` (~L4759)
- [x] `SESSION_USER` (~L4761)
- [x] `SESSIONPROPERTY(option)` (~L4763)
- [x] `SUSER_ID([login])` (~L4765)
- [x] `SUSER_NAME([server_user_id])` (~L4767)
- [x] `SUSER_SID([login])` (~L4769)
- [x] `SUSER_SNAME([server_user_sid])` (~L4771)
- [x] `SYSTEM_USER` (~L4773)
- [x] `USER` (~L4775)
- [x] `USER_ID([user])` (~L4777)
- [x] `USER_NAME([id])` (~L4779)

### 5.10 Cursor Functions (Parser ~L4560-L4564)

- [x] `@@CURSOR_ROWS` (~L4561)
- [x] `@@FETCH_STATUS` (~L4563)
- [x] `CURSOR_STATUS('local|global|variable', cursor_name_or_var)` (~L4564)

### 5.11 Data Type Functions (Parser ~L4570-L4580)

- [x] `DATALENGTH(expression)` (~L4571)
- [x] `IDENT_CURRENT(table_name)` (~L4573)
- [x] `IDENT_INCR(table_name)` (~L4575)
- [x] `IDENT_SEED(table_name)` (~L4577)
- [x] `IDENTITY(data_type [, seed, increment])` (~L4579)
- [x] `SQL_VARIANT_PROPERTY(expression, property)` (~L4580)

### 5.12 Cryptographic Functions (Parser ~L4567, LSP sql.tmLanguage.json:230)

- [x] `CERT_ID(cert_name)` (~L4567)
- [x] `HASHBYTES(algorithm, input)` (LSP:230)
- [x] `CRYPT_GEN_RANDOM(length [, seed])` (LSP:230)
- [x] `ENCRYPTBYKEY(key_guid, plaintext)` (LSP:230)
- [x] `DECRYPTBYKEY(ciphertext)` (LSP:230)
- [x] `ENCRYPTBYCERT(cert_id, plaintext)` (LSP:230)
- [x] `DECRYPTBYCERT(cert_id, ciphertext)` (LSP:230)
- [x] `ENCRYPTBYASYMKEY(key_id, plaintext)` (LSP:230)
- [x] `DECRYPTBYASYMKEY(key_id, ciphertext)` (LSP:230)
- [x] `ENCRYPTBYPASSPHRASE(passphrase, plaintext)` (LSP:230)
- [x] `DECRYPTBYPASSPHRASE(passphrase, ciphertext)` (LSP:230)
- [x] `SIGNBYASYMKEY(key_id, plaintext)` (LSP:230)
- [x] `SIGNBYCERT(cert_id, plaintext)` (LSP:230)
- [x] `VERIFYSIGNEDBYCERT(cert_id, signed_data, signature)` (LSP:230)
- [x] `VERIFYSIGNEDBYASYMKEY(key_id, signed_data, signature)` (LSP:230)
- [x] `KEY_ID(key_name)` (LSP:230)
- [x] `KEY_GUID(key_name)` (LSP:230)
- [x] `KEY_NAME(key_guid)` (LSP:230)
- [x] `ASYMKEY_ID(key_name)` (LSP:230)
- [x] `ASYMKEYPROPERTY(key_id, property)` (LSP:230)
- [x] `CERTPROPERTY(cert_id, property)` (LSP:230)
- [x] `SYMKEYPROPERTY(key_id, property)` (LSP:230)
- [x] `IS_OBJECTSIGNED(object_name, ...)` (LSP:230)
- [x] `DECRYPTBYKEYAUTOASYMKEY(...)` (LSP:230) — variadic, handled by scalar_function_name fallback
- [x] `DECRYPTBYKEYAUTOCERT(...)` (LSP:230) — variadic, handled by scalar_function_name fallback

### 5.13 Freetext Table Functions (Parser L4302-L4320)

- [x] `CONTAINSTABLE(table, column, search_condition)` (Parser L4303)
- [x] `FREETEXTTABLE(table, column, freetext_string)` (Parser L4308)
- [x] `SEMANTICSIMILARITYTABLE(table, column, expression)` (Parser L4310)
- [x] `SEMANTICKEYPHRASETABLE(table, column, expression)` (Parser L4312)
- [x] `SEMANTICSIMILARITYDETAILSTABLE(table, col1, expression, col2, expression)` (Parser L4314)

### 5.14 @@Global Variables — remaining (LSP sql.tmLanguage.json:270)

- [x] `@@ERROR` — last error number (LSP:270)
- [x] `@@ROWCOUNT` — rows affected by last statement (LSP:270)
- [x] `@@TRANCOUNT` — open transaction count (LSP:270)
- [x] `@@IDENTITY` — last inserted identity value (LSP:270)
- [x] `@@CONNECTIONS` — total login attempts (LSP:270)
- [x] `@@CPU_BUSY` — CPU active time (LSP:270)
- [x] `@@IDLE` — idle time (LSP:270)
- [x] `@@IO_BUSY` — I/O time (LSP:270)
- [x] `@@PROCID` — current stored procedure ID (LSP:270)
- [x] `@@PACKET_ERRORS` — network packet errors (LSP:270)
- [x] `@@PACK_RECEIVED` — network packets received (LSP:270)
- [x] `@@PACK_SENT` — network packets sent (LSP:270)
- [x] `@@TIMETICKS` — microseconds per tick (LSP:270)
- [x] `@@TOTAL_ERRORS` — total disk read/write errors (LSP:270)
- [x] `@@TOTAL_READ` — total disk reads (LSP:270)
- [x] `@@TOTAL_WRITE` — total disk writes (LSP:270)

### 5.15 Rowset / Table-Valued Functions — remaining (LSP sql.tmLanguage.json:318)

- [x] `STRING_SPLIT(string, separator [, enable_ordinal])` (LSP:318,334)
- [x] `GENERATE_SERIES(start, stop [, step])` (LSP:318)
- [ ] `PREDICT(MODEL = @model, DATA = ...)` (LSP:318 — ML Services, needs dedicated rule for `=` named params)

### 5.16 Vector Functions (LSP sql.tmLanguage.json:358 — SQL Server 2025)

- [x] `VECTOR_DISTANCE(metric, vector1, vector2)` (LSP:358)
- [x] `VECTOR_NORM(vector)` (LSP:358)
- [x] `VECTOR_NORMALIZE(vector)` (LSP:358)

### 5.17 Text/Image Functions — legacy (LSP sql.tmLanguage.json:350)

- [x] `TEXTPTR(column)` (LSP:350)
- [x] `TEXTVALID('table.column', text_pointer)` (LSP:350)

### 5.18 System Functions — remaining (LSP sql.tmLanguage.json:342)

- [x] `SESSION_ID()` (LSP:342)

---

## Phase 6 — DDL

### 6.1 CREATE TABLE (Parser L1479-L1570)

- [x] `CREATE TABLE name (column_definitions)` (Parser L1479)
- [x] Column definition — `col_name data_type [NULL|NOT NULL]` (Parser L1485)
- [x] Column definition — `DEFAULT expression` (Parser L1487)
- [x] Column definition — `IDENTITY [(seed, increment)]` (Parser L1488)
- [x] Column definition — `COLLATE collation_name` (Parser L1489)
- [x] Column definition — `CONSTRAINT name` (Parser L1490)
- [x] `PRIMARY KEY` constraint (Parser L1500)
- [x] `UNIQUE` constraint (Parser L1502)
- [x] `FOREIGN KEY ... REFERENCES table (col)` (Parser L1504)
- [x] `CHECK (expression)` constraint (Parser L1510)
- [x] `CLUSTERED` / `NONCLUSTERED` (Parser L1501)
- [x] `CREATE TABLE ... AS FileTable` (Parser L1520)
- [x] Table-level `PRIMARY KEY (col, ...)` (Parser L1530)
- [x] Table-level `UNIQUE (col, ...)` (Parser L1535)
- [x] Table-level `FOREIGN KEY (col) REFERENCES ...` (Parser L1540)
- [x] Table-level `CHECK (expression)` (Parser L1545)
- [x] `ON filegroup` (Parser L1560)
- [x] `TEXTIMAGE_ON filegroup` (Parser L1565)
- [x] Column computed definitions — `col AS expression [PERSISTED]` (Parser L1491)
- [ ] Temporal table — `WITH (SYSTEM_VERSIONING = ON)` (Parser L1570)

### 6.2 ALTER TABLE (Parser L573-L650)

- [x] `ALTER TABLE table ADD column_definition` (Parser L574)
- [x] `ALTER TABLE table ALTER COLUMN col data_type [NULL|NOT NULL]` (Parser L580)
- [x] `ALTER TABLE table DROP COLUMN col` (Parser L585)
- [x] `ALTER TABLE table ADD CONSTRAINT ...` (Parser L590)
- [x] `ALTER TABLE table DROP CONSTRAINT name` (Parser L595)
- [x] `ALTER TABLE table ENABLE|DISABLE TRIGGER` (Parser L600)
- [x] `ALTER TABLE table CHECK|NOCHECK CONSTRAINT` (Parser L605)
- [x] `ALTER TABLE table SWITCH PARTITION` (Parser L610)
- [x] `ALTER TABLE table REBUILD` (Parser L620)
- [x] `ALTER TABLE table SET (LOCK_ESCALATION = ...)` (Parser L625)

### 6.3 DROP Statements (Parser L2076-L2125)

- [x] `DROP TABLE [IF EXISTS] name` (Parser L2107)
- [x] `DROP VIEW [IF EXISTS] name` (Parser L2110)
- [x] `DROP PROCEDURE [IF EXISTS] name` (Parser L2090)
- [x] `DROP FUNCTION [IF EXISTS] name` (Parser L2085)
- [x] `DROP INDEX name ON table` (Parser L2076)
- [x] `DROP TRIGGER [IF EXISTS] name` (Parser L2113)
- [x] `DROP DATABASE [IF EXISTS] name` (Parser L2082)
- [x] `DROP SCHEMA name` (Parser L2098)
- [x] `DROP SEQUENCE name` (Parser L2101)
- [x] `DROP TYPE name` (Parser L2116)
- [x] `DROP USER name` (Parser L2119)
- [x] `DROP LOGIN name` (Parser L2088)
- [x] `DROP SYNONYM name` (Parser L2104)
- [x] `DROP STATISTICS name` (Parser L2095)
- [x] Other DROP statements (Parser L2076-L2125)

### 6.4 CREATE INDEX (Parser L1284-L1340)

- [x] `CREATE [UNIQUE] [CLUSTERED|NONCLUSTERED] INDEX name ON table (cols)` (Parser L1284)
- [x] `INCLUDE (col, ...)` (Parser L1290)
- [x] `WHERE filter_predicate` (filtered index) (Parser L1295)
- [x] `WITH (options)` — PAD_INDEX, FILLFACTOR, etc. (Parser L1300)
- [x] `ON filegroup` (Parser L1310)
- [x] `CREATE COLUMNSTORE INDEX` (Parser L1320)

### 6.5 CREATE/ALTER Procedure (Parser L2387-L2430)

- [x] `CREATE [OR ALTER] PROCEDURE name` (Parser L2387)
- [x] Parameter definitions — `@param data_type [= default] [OUTPUT]` (Parser L2390)
- [x] `WITH options` — RECOMPILE, ENCRYPTION, EXECUTE AS (Parser L2395)
- [x] `AS BEGIN ... END` / `AS sql_clauses` (Parser L2400)
- [x] `ALTER PROCEDURE name` (Parser L2387)

### 6.6 CREATE/ALTER Function (Parser L2433-L2470)

- [x] `CREATE [OR ALTER] FUNCTION name` (Parser L2433)
- [x] Parameter definitions (Parser L2435)
- [x] `RETURNS data_type` — scalar function (Parser L2440)
- [x] `RETURNS TABLE` — inline table-valued function (Parser L2445)
- [x] `RETURNS @table TABLE (col_defs)` — multi-statement table-valued (Parser L2450)
- [x] Function body — `BEGIN ... RETURN expression END` (Parser L2456)
- [x] `WITH options` — SCHEMABINDING, ENCRYPTION, etc. (Parser L2460)

### 6.7 CREATE VIEW (Parser L2570-L2590)

- [x] `CREATE [OR ALTER] VIEW name AS select_statement` (Parser L2570)
- [x] `WITH SCHEMABINDING` (Parser L2575)
- [x] `WITH ENCRYPTION` (Parser L2576)
- [x] `WITH VIEW_METADATA` (Parser L2577)
- [x] `WITH CHECK OPTION` (Parser L2585)
- [x] Column name list (Parser L2573)

### 6.8 CREATE/ALTER Trigger (Parser L2400-L2432)

- [x] `CREATE [OR ALTER] TRIGGER name ON table` (DML trigger) (Parser L2405)
- [x] `AFTER INSERT|UPDATE|DELETE` (Parser L2410)
- [x] `INSTEAD OF INSERT|UPDATE|DELETE` (Parser L2411)
- [x] `FOR INSERT|UPDATE|DELETE` (Parser L2412)
- [x] Trigger body — `AS sql_clauses` (Parser L2415)
- [x] DDL trigger — `ON DATABASE|ALL SERVER` (Parser L2422)
- [x] DDL trigger event types (Parser L2425)

### 6.9 Other DDL

- [x] `CREATE SCHEMA name [AUTHORIZATION owner]` (Parser L1440)
- [x] `CREATE TYPE name` (Parser L1460)
- [x] `CREATE SEQUENCE name` (Parser L1380)
- [x] `CREATE SYNONYM name FOR object` (Parser L1450)
- [x] `TRUNCATE TABLE name` (Parser L236)
- [x] `UPDATE STATISTICS table` (Parser L237)
- [x] `ENABLE TRIGGER name ON table` (Parser L231)
- [x] `DISABLE TRIGGER name ON table` (Parser L229)
- [x] `ALTER DATABASE name SET options` (Parser L700)
- [x] `ALTER INDEX name ON table REBUILD|REORGANIZE|DISABLE` (Parser L800)
- [x] `CREATE DATABASE name [ON PRIMARY filespec] [LOG ON filespec] [COLLATE] [WITH options]` (Parser L2218)
- [ ] `LOCK TABLE table IN SHARE|EXCLUSIVE MODE [WAIT n|NOWAIT]` (Parser L1135)

---

## Phase 7 — Everything Else

### 7.1 Remaining Data Types (Parser L5260)

- [x] Exact numerics — TINYINT, SMALLINT, INT, BIGINT, BIT, DECIMAL, NUMERIC, MONEY, SMALLMONEY
- [x] Approximate numerics — FLOAT, REAL
- [x] Character strings — CHAR, VARCHAR, TEXT
- [x] Unicode strings — NCHAR, NVARCHAR, NTEXT
- [x] Binary strings — BINARY, VARBINARY, IMAGE
- [x] Date/Time — DATE, TIME, DATETIME2, DATETIMEOFFSET, DATETIME, SMALLDATETIME
- [x] `CURSOR` type
- [x] `HIERARCHYID` type
- [x] `SQL_VARIANT` type
- [x] `TABLE` type (for table-valued parameters)
- [x] `XML [(schema_collection)]` type
- [x] `GEOGRAPHY` type
- [x] `GEOMETRY` type
- [x] `ROWVERSION` type
- [x] `TIMESTAMP` type
- [x] `UNIQUEIDENTIFIER` type
- [x] `SYSNAME` type
- [ ] User-defined types (reference by name)
- [x] `DOUBLE PRECISION` synonym
- [ ] `IDENTITY(seed, increment)` specification

### 7.2 DBCC Commands (Parser L3635-L3652)

- [x] `DBCC` generic rule — `DBCC command [(args)] [WITH options]` (covers all DBCC commands)

### 7.3 Backup/Restore (Parser L241, L3008-L3117)

- [x] `BACKUP DATABASE name TO DISK|TAPE|URL` (Parser L3008)
- [x] `BACKUP DATABASE ... WITH DIFFERENTIAL` (Parser L3020)
- [x] `BACKUP DATABASE ... WITH options` (COMPRESSION, INIT, etc.) (Parser L3030)
- [x] `BACKUP LOG name TO DISK|TAPE|URL` (Parser L3054)
- [x] `BACKUP LOG ... WITH NO_LOG|TRUNCATE_ONLY` (Parser L3060)
- [x] `BACKUP CERTIFICATE name TO FILE` (Parser L3101)
- [x] `BACKUP MASTER KEY TO FILE` (Parser L3112)
- [x] `BACKUP SERVICE MASTER KEY TO FILE` (Parser L3117)
- [x] `RESTORE DATABASE name FROM DISK|TAPE|URL` (restore statements)
- [x] `RESTORE LOG name FROM DISK|TAPE|URL`
- [x] `RESTORE ... WITH NORECOVERY|RECOVERY|STANDBY`

### 7.4 Security Statements (Parser L362)

- [x] `GRANT permission ON object TO principal` (Parser L362)
- [x] `DENY permission ON object TO principal`
- [x] `REVOKE permission ON object FROM principal`
- [x] `GRANT ... WITH GRANT OPTION`
- [x] `ADD MEMBER` / `DROP MEMBER` (role membership)
- [x] `CREATE LOGIN name WITH PASSWORD = 'pwd'`
- [x] `CREATE LOGIN name FROM WINDOWS`
- [x] `ALTER LOGIN name WITH PASSWORD | ENABLE | DISABLE`
- [x] `CREATE USER name FOR LOGIN | WITHOUT LOGIN`
- [x] `ALTER USER name WITH options`
- [x] `CREATE ROLE name [AUTHORIZATION owner]`
- [x] `ALTER ROLE name ADD|DROP MEMBER | WITH NAME =`
- [x] `DROP ROLE [IF EXISTS] name`
- [x] `CREATE SERVER ROLE name [AUTHORIZATION owner]`
- [x] `ALTER SERVER ROLE name ADD|DROP MEMBER`
- [x] `DROP SERVER ROLE name`
- [x] `EXECUTE AS CALLER|SELF|OWNER|'user_name'` — impersonation statement (Parser L3655)
- [x] `REVERT [WITH COOKIE = @var]` — revert impersonation (Parser L3191)
- [x] `OPEN SYMMETRIC KEY name DECRYPTION BY ...` — open key for use (Parser L3231)
- [x] `CLOSE SYMMETRIC KEY name` / `CLOSE ALL SYMMETRIC KEYS` / `CLOSE MASTER KEY` (Parser L3236)
- [x] `OPEN MASTER KEY DECRYPTION BY PASSWORD = 'pwd'` (Parser L3231)

### 7.5 XML Methods (Parser L3905)

- [x] `.value(xpath, data_type)` — extract scalar (Parser L3905)
- [x] `.query(xpath)` — return XML fragment (Parser L3905)
- [x] `.exist(xpath)` — check existence (Parser L3905)
- [x] `.modify(xml_dml)` — modify in place (Parser L3905)
- [x] `.nodes(xpath)` — shred to rows (Parser L4180)

### 7.6 ODBC Scalar Functions — remaining

- [x] 17 ODBC functions implemented (odbc_scalar_functions.js)
- [ ] ODBC string functions — ASCII, CHAR, INSERT, LCASE, LENGTH, LOCATE, LTRIM, REPEAT, RIGHT, RTRIM, SPACE, SUBSTRING, UCASE
- [ ] ODBC numeric functions — ABS, ACOS, ASIN, ATAN, ATAN2, CEILING, COS, COT, DEGREES, EXP, FLOOR, LOG, LOG10, MOD, PI, POWER, RADIANS, RAND, ROUND, SIGN, SIN, SQRT, TAN
- [ ] ODBC date functions — DAYOFYEAR, EXTRACT, NOW, TIMESTAMPADD, TIMESTAMPDIFF

### 7.7 another_statement — remaining (Parser L350-L368)

- [x] `execute_statement` (grammar.js L135)
- [x] `kill_statement` — `KILL session_id` (Parser L359)
- [x] `kill_statement` — `KILL QUERY NOTIFICATION SUBSCRIPTION ALL|id` (Parser L3131)
- [x] `kill_statement` — `KILL STATS JOB job_id` (Parser L3136)
- [x] `reconfigure_statement` — `RECONFIGURE [WITH OVERRIDE]` (Parser L361)
- [x] `shutdown_statement` — `SHUTDOWN [WITH NOWAIT]` (Parser L365)
- [x] `checkpoint_statement` — `CHECKPOINT [duration]` (Parser L352)
- [x] `setuser_statement` — `SETUSER ['user']` (Parser L364)
- [x] `conversation_statement` — Service Broker conversations (Parser L353)
- [x] `message_statement` — Service Broker messages (Parser L360)
- [x] `security_statement` — GRANT/DENY/REVOKE (Parser L362)
- [ ] `alter_queue` (Parser L351)
- [ ] `create_contract` (Parser L354)
- [ ] `create_queue` (Parser L355)

### 7.8 EXECUTE Statement — remaining

- [x] `execute_statement` — ~93% complete (grammar.js L138-L197)
- [x] `execute_body` — procedure call + string execution (grammar.js L145-L156)
- [x] `execute_option` — RECOMPILE, RESULT SETS NONE/UNDEFINED (grammar.js L160-L165)
- [ ] `RESULT SETS` with full definition (column definitions, AS TYPE, AS FOR XML) (Parser L3168)
- [ ] `AT DATA_SOURCE` option (SQL Server 2019+) (Parser L3155)

### 7.9 Constants / Literals — remaining

- [x] String literals, binary, decimal, float, real, money, parameter
- [x] Negative constant prefix — `constant` allows `-` (Parser L5273) — works via `unary_operator_expression`
- [x] `$action` token (Parser L3916)

### 7.10 Comments (Lexer L1214-L1215)

- [x] Block comments `/* ... */` (nestable) (Lexer L1214)
- [x] Single-line comments `-- ...` (Lexer L1215)

### 7.11 BULK INSERT (SqlScriptDOM `BulkInsertStatement.cs`)

> Very common for ETL/data loading. Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.BulkInsertStatement.cs`

- [x] `BULK INSERT table FROM 'file'` — basic bulk insert
- [x] `BULK INSERT ... WITH (FIELDTERMINATOR, ROWTERMINATOR, ...)` — with options
- [ ] `INSERT ... SELECT * FROM OPENROWSET(BULK ...)` — OPENROWSET BULK variant (ANTLR4 L4272)

### 7.12 Specialized Index Types (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.Create*IndexStatement.cs`

- [x] `CREATE COLUMNSTORE INDEX` (`CreateColumnStoreIndexStatement.cs`, also in 6.4)
- [ ] `CREATE NONCLUSTERED COLUMNSTORE INDEX` (`CreateColumnStoreIndexStatement.cs`)
- [ ] `CREATE XML INDEX name ON table(xml_col)` (`CreateXmlIndexStatement.cs`)
- [ ] `CREATE SELECTIVE XML INDEX` (`CreateSelectiveXmlIndexStatement.cs`)
- [ ] `CREATE SPATIAL INDEX name ON table(geo_col)` (`CreateSpatialIndexStatement.cs`)
- [ ] `CREATE VECTOR INDEX` (`CreateVectorIndexStatement.cs` — SQL Server 2025)
- [ ] `CREATE JSON INDEX` (`CreateJsonIndexStatement.cs` — SQL Server 2025)

### 7.13 Partitioning (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreatePartition*.cs`

- [ ] `CREATE PARTITION FUNCTION name(type) AS RANGE [LEFT|RIGHT] FOR VALUES (...)` (`CreatePartitionFunctionStatement.cs`)
- [ ] `CREATE PARTITION SCHEME name AS PARTITION func [ALL] TO (filegroups)` (`CreatePartitionSchemeStatement.cs`)
- [ ] `ALTER PARTITION FUNCTION name() SPLIT|MERGE RANGE (value)` (`AlterPartitionFunctionStatement.cs`)
- [ ] `ALTER PARTITION SCHEME name NEXT USED [filegroup]` (`AlterPartitionSchemeStatement.cs`)
- [x] `DROP PARTITION FUNCTION name` (`DropPartitionFunctionStatement.cs`)
- [x] `DROP PARTITION SCHEME name` (`DropPartitionSchemeStatement.cs`)

### 7.14 Full-Text Search DDL (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateFulltext*.cs`

- [ ] `CREATE FULLTEXT CATALOG name` (`CreateFulltextCatalogStatement.cs`)
- [ ] `CREATE FULLTEXT INDEX ON table(cols) KEY INDEX idx` (`CreateFulltextIndexStatement.cs`)
- [ ] `ALTER FULLTEXT INDEX ON table ADD|DROP (col)` (`AlterFulltextIndexStatement.cs`)
- [ ] `CREATE FULLTEXT STOPLIST name` (`CreateFulltextStoplistStatement.cs`)
- [ ] `DROP FULLTEXT INDEX ON table` (`DropFulltextIndexStatement.cs`)
- [ ] `DROP FULLTEXT CATALOG name` (`DropFulltextCatalogStatement.cs`)

### 7.15 Temporal Tables (SqlScriptDOM `TemporalClause.cs`)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.TemporalClause.cs`, `SystemTimePeriodDefinition.cs`, `SystemVersioningTableOption.cs`

- [ ] `PERIOD FOR SYSTEM_TIME (start_col, end_col)` — period definition
- [ ] `WITH (SYSTEM_VERSIONING = ON (...))` — enable temporal on CREATE TABLE
- [ ] `FOR SYSTEM_TIME AS OF datetime` — point-in-time query
- [ ] `FOR SYSTEM_TIME FROM ... TO ...` — range query
- [ ] `FOR SYSTEM_TIME BETWEEN ... AND ...` — between query
- [ ] `FOR SYSTEM_TIME CONTAINED IN (start, end)` — contained query
- [ ] `FOR SYSTEM_TIME ALL` — all rows including history

### 7.16 Statistics (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateStatisticsStatement.cs`, `UpdateStatisticsStatement.cs`

- [x] `CREATE STATISTICS name ON table (col, ...)` (`CreateStatisticsStatement.cs`)
- [x] `CREATE STATISTICS ... WITH FULLSCAN|SAMPLE n PERCENT` — with options
- [x] `UPDATE STATISTICS table [index] [WITH options]` (`UpdateStatisticsStatement.cs`)
- [ ] `DROP STATISTICS table.name` (`DropStatisticsStatement.cs`)

### 7.17 Certificate & Cryptography DDL (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.Create*Statement.cs` — 20+ files

- [x] `CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'pwd'` (`CreateMasterKeyStatement.cs`)
- [x] `CREATE CERTIFICATE name WITH SUBJECT = 'subject'` (`CreateCertificateStatement.cs`)
- [x] `CREATE SYMMETRIC KEY name WITH ALGORITHM = AES_256 ENCRYPTION BY CERTIFICATE cert` (`CreateSymmetricKeyStatement.cs`)
- [x] `CREATE ASYMMETRIC KEY name FROM FILE = 'path'` (`CreateAsymmetricKeyStatement.cs`)
- [x] `ALTER MASTER KEY ...` (`AlterMasterKeyStatement.cs`)
- [x] `ALTER CERTIFICATE ...` (`AlterCertificateStatement.cs`)
- [x] `ADD SIGNATURE TO object BY CERTIFICATE cert` (`AddSignatureStatement.cs`)
- [x] `DROP CERTIFICATE name` (`DropCertificateStatement.cs`)
- [x] `DROP SYMMETRIC KEY name` (`DropSymmetricKeyStatement.cs`)
- [x] `DROP ASYMMETRIC KEY name` (`DropAsymmetricKeyStatement.cs`)
- [x] `DROP MASTER KEY` (`DropMasterKeyStatement.cs`)

### 7.18 Column Encryption / Always Encrypted (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateColumnEncryptionKeyStatement.cs`

- [x] `CREATE COLUMN ENCRYPTION KEY name WITH VALUES (...)` (`CreateColumnEncryptionKeyStatement.cs`)
- [x] `CREATE COLUMN MASTER KEY name WITH (...)` (`CreateColumnMasterKeyStatement.cs`)
- [x] `ENCRYPTED WITH (COLUMN_ENCRYPTION_KEY = ..., ENCRYPTION_TYPE = ...)` column option (`ColumnEncryptionDefinition.cs`)

### 7.19 Availability Groups / Always On HA (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateAvailabilityGroupStatement.cs`

- [ ] `CREATE AVAILABILITY GROUP name WITH (...) FOR DATABASE db REPLICA ON ...` (`CreateAvailabilityGroupStatement.cs`)
- [ ] `ALTER AVAILABILITY GROUP name ADD|REMOVE DATABASE|REPLICA` (`AlterAvailabilityGroupStatement.cs`)
- [ ] `ALTER DATABASE db SET HADR AVAILABILITY GROUP = ag` (`HadrDatabaseOption.cs`)

### 7.20 External Tables / PolyBase (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateExternalTableStatement.cs` — 16+ files

- [ ] `CREATE EXTERNAL DATA SOURCE name WITH (TYPE = ..., LOCATION = ...)` (`CreateExternalDataSourceStatement.cs`)
- [ ] `CREATE EXTERNAL FILE FORMAT name WITH (FORMAT_TYPE = ...)` (`CreateExternalFileFormatStatement.cs`)
- [ ] `CREATE EXTERNAL TABLE name (...) WITH (LOCATION = ..., DATA_SOURCE = ...)` (`CreateExternalTableStatement.cs`)
- [ ] `DROP EXTERNAL DATA SOURCE name` (`DropExternalDataSourceStatement.cs`)
- [ ] `DROP EXTERNAL FILE FORMAT name` (`DropExternalFileFormatStatement.cs`)
- [ ] `DROP EXTERNAL TABLE name` (`DropExternalTableStatement.cs`)

### 7.21 Service Broker (SqlScriptDOM — 30+ files)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.Create*Statement.cs` (Service, Queue, Contract, Route, etc.)

- [ ] `CREATE MESSAGE TYPE name VALIDATION = ...` (`CreateMessageTypeStatement.cs`)
- [ ] `CREATE CONTRACT name (msg_type SENT BY ...)` (`CreateContractStatement.cs`)
- [ ] `CREATE QUEUE name [WITH STATUS = ON|OFF]` (`CreateQueueStatement.cs`)
- [ ] `CREATE SERVICE name ON QUEUE queue (contract)` (`CreateServiceStatement.cs`)
- [ ] `CREATE ROUTE name WITH SERVICE_NAME = ..., ADDRESS = ...` (`CreateRouteStatement.cs`)
- [ ] `BEGIN DIALOG @handle FROM SERVICE ... TO SERVICE ...` (`BeginDialogStatement.cs`)
- [ ] `SEND ON CONVERSATION @handle MESSAGE TYPE ... (@body)` (`SendStatement.cs`)
- [ ] `RECEIVE ... FROM queue` (`ReceiveStatement.cs`)
- [ ] `END CONVERSATION @handle` (`EndConversationStatement.cs`)
- [ ] `GET CONVERSATION GROUP @id FROM queue` (`GetConversationGroupStatement.cs`)
- [ ] `ALTER QUEUE name ...` (`AlterQueueStatement.cs`)

### 7.22 Graph Database (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.GraphMatch*.cs`

- [ ] `CREATE TABLE name (...) AS NODE` — graph node table
- [ ] `CREATE TABLE name (...) AS EDGE` — graph edge table
- [ ] `MATCH (node1-(edge)->node2)` expression (`GraphMatchExpression.cs`)
- [ ] `SHORTEST_PATH(...)` in MATCH (`GraphMatchShortestPathExpression.cs`)

### 7.23 Resource Governor (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateResourcePoolStatement.cs` — 10+ files

- [ ] `CREATE RESOURCE POOL name WITH (MAX_CPU_PERCENT = n, ...)` (`CreateResourcePoolStatement.cs`)
- [ ] `CREATE WORKLOAD GROUP name WITH (...) USING pool` (`CreateWorkloadGroupStatement.cs`)
- [ ] `ALTER RESOURCE GOVERNOR RECONFIGURE|DISABLE` (`AlterResourceGovernorStatement.cs`)

### 7.24 Azure AI Functions (SqlScriptDOM — SQL Server 2025)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.Ai*.cs` — 10 files

- [ ] `AI_GENERATE_EMBEDDINGS(model, text)` (`AiGenerateEmbeddingsFunction.cs`)
- [ ] `AI_GENERATE_RESPONSE(model, prompt)` (`AiGenerateResponseFunction.cs`)
- [ ] `AI_CLASSIFY(model, text, labels)` (`AiClassifyFunction.cs`)
- [ ] `AI_EXTRACT(model, text, fields)` (`AiExtractFunction.cs`)
- [ ] `AI_SUMMARIZE(model, text)` (`AiSummarizeFunction.cs`)
- [ ] `AI_TRANSLATE(model, text, target_lang)` (`AiTranslateFunction.cs`)
- [ ] `AI_FIX_GRAMMAR(model, text)` (`AiFixGrammarFunction.cs`)
- [ ] `AI_ANALYZE_SENTIMENT(model, text)` (`AiAnalyzeSentimentFunction.cs`)

### 7.25 Assembly & CLR (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateAssemblyStatement.cs`

- [ ] `CREATE ASSEMBLY name FROM 'path' WITH PERMISSION_SET = SAFE|EXTERNAL_ACCESS|UNSAFE` (`CreateAssemblyStatement.cs`)
- [ ] `CREATE AGGREGATE name (@param type) RETURNS type EXTERNAL NAME assembly.class` (`CreateAggregateStatement.cs`)
- [ ] `ALTER ASSEMBLY name ...` (`AlterAssemblyStatement.cs`)
- [ ] `DROP ASSEMBLY name` (`DropAssemblyStatement.cs`)

### 7.26 COPY Statement — Azure Synapse (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CopyStatement.cs`

- [ ] `COPY INTO table FROM 'url' WITH (FILE_FORMAT = ..., ...)` (`CopyStatement.cs`)

### 7.27 External Languages & Libraries (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateExternal*.cs`

- [ ] `CREATE EXTERNAL LANGUAGE name FROM (path) WITH (...)` (`CreateExternalLanguageStatement.cs`)
- [ ] `CREATE EXTERNAL LIBRARY name FROM (path) WITH (LANGUAGE = ...)` (`CreateExternalLibraryStatement.cs`)

### 7.28 XML Schema Collections (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateXmlSchemaCollectionStatement.cs`

- [x] `CREATE XML SCHEMA COLLECTION name AS 'xsd'` (`CreateXmlSchemaCollectionStatement.cs`)
- [x] `DROP XML SCHEMA COLLECTION name` (`DropXmlSchemaCollectionStatement.cs`)

### 7.29 Endpoints & Database Mirroring (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateEndpointStatement.cs`

- [x] `CREATE ENDPOINT name STATE = STARTED AS TCP (...) FOR TSQL|DATA_MIRRORING|SERVICE_BROKER (...)` (`CreateEndpointStatement.cs`)
- [x] `ALTER ENDPOINT name ...` (`AlterEndpointStatement.cs`)
- [x] `DROP ENDPOINT name` (`DropEndpointStatement.cs`)

### 7.30 Security — Row-Level Security, Audit & Data Masking (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateSecurityPolicyStatement.cs`, `AddSensitivityClassification.cs`
> Data Masking: `Parser/TSql/TSql170.g:30028` (`maskedClause` rule)

- [ ] `CREATE SECURITY POLICY name ADD FILTER PREDICATE fn(col) ON table` (`CreateSecurityPolicyStatement.cs`)
- [ ] `ALTER SECURITY POLICY name ...` (`AlterSecurityPolicyStatement.cs`)
- [ ] `CREATE SERVER AUDIT name TO FILE (...)` (`CreateServerAuditStatement.cs`)
- [ ] `CREATE SERVER AUDIT SPECIFICATION name FOR SERVER AUDIT audit ADD (action)` (`CreateServerAuditSpecificationStatement.cs`)
- [ ] `CREATE DATABASE AUDIT SPECIFICATION name FOR SERVER AUDIT audit ADD (action)` (`CreateDatabaseAuditSpecificationStatement.cs`)
- [ ] `ADD SENSITIVITY CLASSIFICATION TO table.column WITH (...)` (`AddSensitivityClassification.cs`)
- [ ] Dynamic Data Masking — `col_name type MASKED WITH (FUNCTION = '...')` in CREATE TABLE (`TSql170.g:30028 maskedClause`)
- [ ] Dynamic Data Masking — `ALTER TABLE t ALTER COLUMN col ADD MASKED WITH (FUNCTION = '...')` (`AlterTableAlterColumnOption.AddMaskingFunction`)
- [ ] Dynamic Data Masking — `ALTER TABLE t ALTER COLUMN col DROP MASKED` (`AlterTableAlterColumnOption.DropMaskingFunction`)

### 7.31 Credentials (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateCredentialStatement.cs`

- [ ] `CREATE CREDENTIAL name WITH IDENTITY = '...', SECRET = '...'` (`CreateCredentialStatement.cs`)
- [x] `CREATE DATABASE SCOPED CREDENTIAL name WITH IDENTITY = '...'` (`CreateDatabaseScopedCredentialStatement.cs`)
- [ ] `ALTER CREDENTIAL name ...` (`AlterCredentialStatement.cs`)

### 7.32 Event Notifications & Extended Events (SqlScriptDOM)

> Reference: `ScriptGenerator/SqlScriptGeneratorVisitor.CreateEventNotificationStatement.cs`

- [ ] `CREATE EVENT NOTIFICATION name ON queue FOR event_type TO SERVICE '...'` (`CreateEventNotificationStatement.cs`)
- [ ] `CREATE EVENT SESSION name ON SERVER ADD EVENT ... ADD TARGET ...` (`CreateEventSessionStatement.cs`)
- [ ] `ALTER EVENT SESSION name ON SERVER ...` (`AlterEventSessionStatement.cs`)

### 7.33 Legacy Statements (SqlScriptDOM)

> Deprecated features still in the official parser.

- [x] `CREATE RULE name AS condition` — legacy (`CreateRuleStatement.cs`)
- [x] `CREATE DEFAULT name AS expression` — legacy (`CreateDefaultStatement.cs`)
- [x] `READTEXT table.column text_pointer offset size` — deprecated (`ReadTextStatement.cs`)
- [x] `WRITETEXT table.column text_pointer data` — deprecated (`WriteTextStatement.cs`)
- [x] `UPDATETEXT table.column text_pointer offset length data` — deprecated (`UpdateTextStatement.cs`)
- [x] `LINENO n` — set line number for error messages

### 7.34 Spatial Methods — GEOGRAPHY/GEOMETRY (SqlScriptDOM)

> Reference: CLR method call visitors in ScriptGenerator. 30+ methods on GEOGRAPHY/GEOMETRY types.

- [ ] `.STArea()` — area of spatial object
- [ ] `.STDistance(other)` — distance between objects
- [ ] `.STIntersects(other)` — intersection test
- [ ] `.STContains(other)` — containment test
- [ ] `.STBuffer(distance)` — buffer geometry
- [ ] `.STLength()` — length of linestring
- [ ] `.STAsText()` — WKT representation
- [ ] `.STGeomFromText(wkt, srid)` — static constructor
- [ ] Other spatial methods (30+ total)

### 7.35 ALTER AUTHORIZATION (Parser L582)

> Reference: ANTLR4 `alter_authorization` and variants

- [x] `ALTER AUTHORIZATION ON [class_type::]entity TO principal` — change owner of securable
- [x] Class types: OBJECT, ASSEMBLY, ASYMMETRIC KEY, AVAILABILITY GROUP, CERTIFICATE, CONTRACT, TYPE, DATABASE, ENDPOINT, FULLTEXT CATALOG/STOPLIST, MESSAGE TYPE, REMOTE SERVICE BINDING, ROLE, ROUTE, SCHEMA, SEARCH PROPERTY LIST, SERVER ROLE, SERVICE, SYMMETRIC KEY, XML SCHEMA COLLECTION
- [ ] Azure SQL variants (`alter_authorization_for_sql_database`, `alter_authorization_for_azure_dw`, `alter_authorization_for_parallel_dw`)

### 7.36 ALTER SERVER CONFIGURATION (Parser L1835)

> Reference: ANTLR4 `alter_server_configuration`

- [ ] `ALTER SERVER CONFIGURATION SET PROCESS AFFINITY ...`
- [ ] `ALTER SERVER CONFIGURATION SET DIAGNOSTICS LOG ...`
- [ ] `ALTER SERVER CONFIGURATION SET FAILOVER CLUSTER PROPERTY ...`
- [ ] `ALTER SERVER CONFIGURATION SET HADR CLUSTER CONTEXT ...`
- [ ] `ALTER SERVER CONFIGURATION SET BUFFER POOL EXTENSION ...`

### 7.37 ALTER SERVICE MASTER KEY (Parser L1904)

> Reference: ANTLR4 `alter_service_master_key`

- [x] `ALTER SERVICE MASTER KEY [FORCE] REGENERATE`
- [x] `ALTER SERVICE MASTER KEY WITH OLD_ACCOUNT|NEW_ACCOUNT = ...`

### 7.38 Application Roles (Parser L371, L384)

> Reference: ANTLR4 `alter_application_role`, `create_application_role`, `drop_application_role`

- [x] `CREATE APPLICATION ROLE name WITH PASSWORD = 'pwd' [, DEFAULT_SCHEMA = schema]`
- [x] `ALTER APPLICATION ROLE name WITH NAME|PASSWORD|DEFAULT_SCHEMA = ...`
- [x] `DROP APPLICATION ROLE name`

### 7.39 Search Property Lists (Parser L1673)

> Reference: ANTLR4 `create_search_property_list`, `drop_search_property_list`

- [x] `CREATE SEARCH PROPERTY LIST name [FROM [db.]source_list] [AUTHORIZATION owner]`
- [x] `DROP SEARCH PROPERTY LIST name`

### 7.40 Remote Service Binding (Parser L1532)

> Reference: ANTLR4 `create_remote_service_binding`, `alter_remote_service_binding`, `drop_remote_service_binding`

- [ ] `CREATE REMOTE SERVICE BINDING name [AUTHORIZATION owner] TO SERVICE 'svc' WITH USER = user [, ANONYMOUS = ON|OFF]`
- [ ] `ALTER REMOTE SERVICE BINDING name ...`
- [ ] `DROP REMOTE SERVICE BINDING name`

### 7.41 External Resource Pool (Parser L1342, L1352)

> Reference: ANTLR4 `alter_external_resource_pool`, `create_external_resource_pool`, `drop_external_resource_pool`

- [ ] `CREATE EXTERNAL RESOURCE POOL name WITH (MAX_CPU_PERCENT = n, ...)`
- [ ] `ALTER EXTERNAL RESOURCE POOL name|DEFAULT WITH (...)`
- [ ] `DROP EXTERNAL RESOURCE POOL name`

### 7.42 Cryptographic Providers (Parser L1174)

> Reference: ANTLR4 `create_cryptographic_provider`, `alter_cryptographic_provider`, `drop_cryptograhic_provider`

- [x] `CREATE CRYPTOGRAPHIC PROVIDER name FROM FILE = 'path'`
- [x] `ALTER CRYPTOGRAPHIC PROVIDER name ...`
- [x] `DROP CRYPTOGRAPHIC PROVIDER name`

### 7.43 Database Encryption Key (Parser L910)

> Reference: ANTLR4 `drop_database_encryption_key`

- [x] `DROP DATABASE ENCRYPTION KEY`
- [x] `CREATE DATABASE ENCRYPTION KEY WITH ALGORITHM = ...` (implicit from SqlScriptDOM)

### 7.44 Database Scoped Credentials (Parser L915)

> Reference: ANTLR4 `drop_database_scoped_credential`, `CreateDatabaseScopedCredentialStatement.cs`

- [x] `CREATE DATABASE SCOPED CREDENTIAL name WITH IDENTITY = '...'`
- [x] `DROP DATABASE SCOPED CREDENTIAL name`

### 7.45 Broker Priority (Parser L828)

> Reference: ANTLR4 `create_or_alter_broker_priority`, `drop_broker_priority`

- [ ] `CREATE BROKER PRIORITY name FOR CONVERSATION SET (CONTRACT_NAME, LOCAL_SERVICE_NAME, REMOTE_SERVICE_NAME, PRIORITY_LEVEL)`
- [ ] `ALTER BROKER PRIORITY name ...`
- [ ] `DROP BROKER PRIORITY name`

### 7.46 BULK INSERT (Parser — community grammar L2252)

> Very common for ETL/data loading. Already listed in 7.11 but repeated here for ANTLR cross-reference.

- [ ] `BULK INSERT table FROM 'file' [WITH (options)]`
- [ ] `INSERT ... SELECT * FROM OPENROWSET(BULK ...)`

---

## Already Complete

These sections are fully implemented with test corpus coverage:

- [x] **Ranking Windowed Functions** — RANK, DENSE_RANK, ROW_NUMBER, NTILE (grammar.js L447-L456)
- [x] **Aggregate Functions** — AVG, MAX, MIN, SUM, STDEV, STDEVP, VAR, VARP, COUNT, COUNT_BIG, CHECKSUM_AGG, APPROX_COUNT_DISTINCT, STRING_AGG, APPROX_PERCENTILE_CONT, APPROX_PERCENTILE_DISC, GROUPING, GROUPING_ID (aggregate_functions.js)
- [x] **Analytic Windowed Functions** — FIRST_VALUE, LAST_VALUE, LAG, LEAD, CUME_DIST, PERCENT_RANK, PERCENTILE_CONT, PERCENTILE_DISC (analytic_windowed_functions.js)
- [x] **OVER Clause / Window Spec** — PARTITION BY, ORDER BY, ROWS/RANGE, all frame bounds (grammar.js L460-L525)
- [x] **Configuration Functions** — all 15 @@variables (configuration_functions.js)
- [x] **Bit Manipulation Functions** — LEFT_SHIFT, RIGHT_SHIFT (function + operator), BIT_COUNT, GET_BIT, SET_BIT (bit_manipulation_functions.js)
- [x] **Collation Functions** — COLLATIONPROPERTY, TERTIARY_WEIGHTS (collation_functions.js)
- [x] **HierarchyID Methods** — GetRoot, Parse, GetLevel, ToString, GetAncestor, IsDescendantOf, GetReparentedValue, GetDescendant (grammar.js L384-L416)
- [x] **Partition Functions** — $PARTITION.func_name(expr) (grammar.js L422-L424)
- [x] **Scalar Function Calls** — func_proc_name(args), RIGHT, LEFT, BINARY_CHECKSUM, CHECKSUM (grammar.js L429-L438)
- [x] **EXECUTE Statement** — ~93% complete (grammar.js L138-L197)
- [x] **Batch / GO** — tsql_file, batch, go_statement, execute_body_batch (grammar.js L54-L72)
- [x] **Select List / Aliases** — select_list, expression_elem, udt_elem, assignment operators, column aliases (grammar.js L231-L297)
- [x] **Primitive Expressions** — DEFAULT, NULL, @local_var, constants (grammar.js L528-L563)
- [x] **Data Types (core + extended)** — exact numerics, approximate numerics, char strings, unicode strings, binary strings, date/time, UNIQUEIDENTIFIER, SQL_VARIANT, GEOGRAPHY, GEOMETRY, ROWVERSION, TIMESTAMP, SYSNAME, HIERARCHYID, XML, CURSOR, TABLE (data_types.js)
- [x] **Built-in Metadata Functions** — 32 functions (builtins.js)
- [x] **ODBC Scalar Functions (partial)** — 17 functions (odbc_scalar_functions.js)
- [x] **Conversion Functions** — CAST, CONVERT, TRY_CAST, TRY_CONVERT, PARSE, TRY_PARSE (conversion_functions.js)
- [x] **IIF, COALESCE, NULLIF** — dedicated rules with proper search_condition/expression args (grammar.js)
- [x] **DECLARE/SET** — DECLARE @var, SET @var, SET options (grammar.js)
- [x] **Control Flow** — BEGIN/END, IF/ELSE, WHILE, TRY/CATCH, RETURN, BREAK, CONTINUE, THROW, PRINT, RAISERROR (grammar.js)
- [x] **Transaction Statements** — BEGIN/COMMIT/ROLLBACK/SAVE TRANSACTION (grammar.js)
- [x] **Cursor Statements** — DECLARE CURSOR, OPEN, FETCH, CLOSE, DEALLOCATE (grammar.js)
- [x] **USE Statement** — `USE database_name` (grammar.js)
- [x] **CREATE INDEX** — UNIQUE, CLUSTERED/NONCLUSTERED, INCLUDE, WHERE, WITH options, ON filegroup (grammar.js)
- [x] **CREATE/ALTER PROCEDURE** — CREATE OR ALTER, params with defaults/OUTPUT, WITH ENCRYPTION/RECOMPILE/EXECUTE AS (grammar.js)
- [x] **CREATE/ALTER FUNCTION** — scalar, inline TVF, multi-statement TVF, WITH options (grammar.js)
- [x] **CREATE/ALTER VIEW** — column list, WITH SCHEMABINDING/ENCRYPTION/VIEW_METADATA, WITH CHECK OPTION (grammar.js)
- [x] **CREATE/ALTER TRIGGER** — DML triggers: AFTER/INSTEAD OF/FOR, INSERT/UPDATE/DELETE, NOT FOR REPLICATION (grammar.js)
- [x] **Other DDL** — CREATE SCHEMA, CREATE TYPE (alias + table), CREATE SEQUENCE, CREATE SYNONYM, TRUNCATE TABLE (grammar.js)
- [x] **Simple Statements** — KILL, RECONFIGURE [WITH OVERRIDE], SHUTDOWN [WITH NOWAIT], CHECKPOINT [duration] (grammar.js)
- [x] **DBCC** — generic `DBCC command [(args)] [WITH options]` rule (grammar.js)
- [x] **BACKUP/RESTORE** — BACKUP DATABASE/LOG/CERTIFICATE/MASTER KEY/SERVICE MASTER KEY, RESTORE DATABASE/LOG (grammar.js)
- [x] **Security Statements** — GRANT/DENY/REVOKE, CREATE/ALTER LOGIN, CREATE/ALTER USER, CREATE/ALTER/DROP ROLE, CREATE/ALTER/DROP SERVER ROLE (grammar.js)

---

## Phase 8 — Negative (Error) Tests

> Tests that assert known-invalid SQL produces `(ERROR)` or `(MISSING)` nodes. Ensures the parser
> rejects bad syntax rather than silently accepting it. **All done.**

### 8.1 SELECT Statement Errors

- [x] `SELECT` — bare SELECT with no columns
- [x] `SELECT ,` — leading comma in select list
- [x] `SELECT a,` — trailing comma in select list
- [x] `SELECT a,,b` — double comma in select list
- [x] `SELECT FROM t` — missing select list before FROM (gap: parses clean)
- [x] `SELECT * FROM` — FROM with no table
- [x] `SELECT * WHERE 1=1` — WHERE without FROM (fixed: now valid, oracle accepts)
- [x] `SELECT * FROM t WHERE` — WHERE with no condition
- [x] `SELECT * FROM t ORDER` — ORDER without BY
- [x] `SELECT * FROM t ORDER BY` — ORDER BY with no expressions
- [x] `SELECT * FROM t GROUP` — GROUP without BY (gap: parses clean)
- [x] `SELECT * FROM t GROUP BY` — GROUP BY with no expressions
- [x] `SELECT * FROM t HAVING` — HAVING with no condition
- [x] `SELECT * FROM t ORDER BY a OFFSET` — OFFSET missing row count
- [x] `SELECT * FROM t ORDER BY a OFFSET 5` — OFFSET without ROWS (gap: parses clean)
- [x] `SELECT * FROM t ORDER BY a OFFSET 5 ROWS FETCH` — FETCH incomplete
- [x] `SELECT TOP FROM t` — TOP missing expression (gap: parses clean)
- [x] `SELECT TOP ( FROM t` — TOP unclosed paren
- [x] `SELECT DISTINCT` — DISTINCT with no columns
- [x] `SELECT * FROM t1 UNION` — UNION with no second query
- [x] `SELECT * FROM t1 INTERSECT` — INTERSECT with no second query
- [x] `SELECT * FROM t1 EXCEPT` — EXCEPT with no second query

### 8.2 Expression Errors

- [x] `SELECT 1 +` — binary operator missing right operand
- [x] `SELECT * 2` — binary operator missing left operand context
- [x] `SELECT 1 + + +` — chained operators with no final operand
- [x] `SELECT (` — unclosed parenthesis
- [x] `SELECT )` — unmatched close parenthesis
- [x] `SELECT (1+2` — unclosed parenthesized expression
- [x] `SELECT 1 + (2 * )` — empty right side inside parens (gap: parses clean)
- [x] `SELECT ~` — bitwise NOT with no operand
- [x] `SELECT 1 2` — two expressions with no operator between
- [x] `SELECT 1 = 2` — assignment operator in select list (not comparison context)

### 8.3 CASE Expression Errors

- [x] `SELECT CASE END` — CASE with no WHEN clauses
- [x] `SELECT CASE WHEN THEN 1 END` — WHEN missing condition
- [x] `SELECT CASE WHEN 1=1 THEN END` — THEN missing result expression (gap: parses clean)
- [x] `SELECT CASE WHEN 1=1 END` — WHEN without THEN
- [x] `SELECT CASE 1 WHEN THEN 2 END` — simple CASE WHEN missing match value
- [x] `SELECT CASE 1` — CASE never closed (no END)
- [x] `SELECT CASE WHEN 1=1 THEN 1 ELSE END` — ELSE with no expression (gap: parses clean)

### 8.4 Search Condition / Predicate Errors

- [x] `SELECT * FROM t WHERE AND` — AND with no left operand
- [x] `SELECT * FROM t WHERE 1=1 AND` — AND with no right operand
- [x] `SELECT * FROM t WHERE OR 1=1` — OR with no left operand
- [x] `SELECT * FROM t WHERE NOT` — NOT with no operand
- [x] `SELECT * FROM t WHERE a BETWEEN` — BETWEEN missing range
- [x] `SELECT * FROM t WHERE a BETWEEN 1` — BETWEEN missing AND
- [x] `SELECT * FROM t WHERE a BETWEEN 1 AND` — BETWEEN AND missing upper bound
- [x] `SELECT * FROM t WHERE a IN` — IN missing list
- [x] `SELECT * FROM t WHERE a IN (` — IN unclosed paren
- [x] `SELECT * FROM t WHERE a IN ()` — IN empty list (gap: parses clean)
- [x] `SELECT * FROM t WHERE a LIKE` — LIKE missing pattern
- [x] `SELECT * FROM t WHERE a IS` — IS without NULL/NOT NULL (gap: parses clean)
- [x] `SELECT * FROM t WHERE EXISTS` — EXISTS missing subquery
- [x] `SELECT * FROM t WHERE EXISTS (` — EXISTS unclosed paren
- [x] `SELECT * FROM t WHERE a >` — comparison missing right side
- [x] `SELECT * FROM t WHERE > 1` — comparison missing left side (gap: parses clean)

### 8.5 JOIN Errors

- [x] `SELECT * FROM t1 JOIN` — JOIN missing table
- [x] `SELECT * FROM t1 JOIN t2` — JOIN missing ON
- [x] `SELECT * FROM t1 JOIN t2 ON` — ON missing condition
- [x] `SELECT * FROM t1 LEFT` — LEFT without JOIN
- [x] `SELECT * FROM t1 INNER` — INNER without JOIN
- [x] `SELECT * FROM t1 CROSS` — CROSS without JOIN/APPLY
- [x] `SELECT * FROM t1 JOIN ON 1=1` — JOIN missing table name before ON

### 8.6 INSERT Statement Errors

- [x] `INSERT INTO` — missing table name
- [x] `INSERT INTO t` — missing VALUES/SELECT/DEFAULT VALUES
- [x] `INSERT INTO t VALUES` — VALUES missing value list
- [x] `INSERT INTO t VALUES (` — unclosed VALUES paren
- [x] `INSERT INTO t VALUES ()` — empty VALUES list (gap: parses clean)
- [x] `INSERT INTO t (a,b) VALUES (1)` — column count mismatch (oracle valid: semantic error, not syntax)
- [x] `INSERT INTO t VALUES (1,)` — trailing comma in VALUES
- [x] `INSERT INTO t (,a) VALUES (1)` — leading comma in column list
- [x] `INSERT INTO t () VALUES (1)` — empty column list (oracle valid: accepts empty column list)

### 8.7 UPDATE Statement Errors

- [x] `UPDATE` — missing table name
- [x] `UPDATE t` — missing SET clause
- [x] `UPDATE t SET` — SET with no assignments
- [x] `UPDATE t SET a =` — SET assignment missing value (gap: parses clean)
- [x] `UPDATE t SET = 1` — SET missing column name (gap: parses clean)
- [x] `UPDATE t SET a = 1,` — trailing comma in SET list
- [x] `UPDATE SET a = 1` — missing table name after UPDATE

### 8.8 DELETE Statement Errors

- [x] `DELETE` — bare DELETE with no target
- [x] `DELETE FROM` — FROM with no table
- [x] `DELETE FROM t WHERE` — WHERE with no condition
- [x] `DELETE t FROM WHERE 1=1` — second FROM missing table in join

### 8.9 MERGE Statement Errors

- [x] `MERGE INTO t` — missing USING
- [x] `MERGE INTO t USING s` — missing ON
- [x] `MERGE INTO t USING s ON` — ON missing condition
- [x] `MERGE INTO t USING s ON 1=1` — missing WHEN clause
- [x] `MERGE INTO t USING s ON 1=1 WHEN MATCHED` — WHEN MATCHED missing THEN
- [x] `MERGE INTO t USING s ON 1=1 WHEN MATCHED THEN` — THEN missing action (gap: parses clean)
- [x] `MERGE INTO t USING s ON 1=1 WHEN NOT MATCHED THEN INSERT` — INSERT missing VALUES

### 8.10 CTE Errors

- [x] `WITH AS (SELECT 1)` — CTE missing name
- [x] `WITH cte` — CTE missing AS
- [x] `WITH cte AS` — CTE AS missing query
- [x] `WITH cte AS (` — CTE unclosed paren
- [x] `WITH cte AS ()` — CTE empty query
- [x] `WITH cte AS (SELECT 1),` — trailing comma, no subsequent CTE or query
- [x] `WITH cte AS (SELECT 1)` — CTE with no main query after it

### 8.11 CREATE TABLE Errors

- [x] `CREATE TABLE` — missing table name
- [x] `CREATE TABLE t` — missing column definitions
- [x] `CREATE TABLE t (` — unclosed paren
- [x] `CREATE TABLE t ()` — empty column list
- [x] `CREATE TABLE t (a)` — column missing data type
- [x] `CREATE TABLE t (a INT,)` — trailing comma
- [x] `CREATE TABLE t (,a INT)` — leading comma
- [x] `CREATE TABLE t (a INT b INT)` — missing comma between columns
- [x] `CREATE TABLE t (PRIMARY KEY)` — PRIMARY KEY missing column list
- [x] `CREATE TABLE t (CONSTRAINT pk PRIMARY KEY)` — named PK missing column list
- [x] `CREATE TABLE t (a INT REFERENCES)` — REFERENCES missing target table
- [x] `CREATE TABLE t (a INT CHECK)` — CHECK missing expression
- [x] `CREATE TABLE t (a INT CHECK ()` — CHECK empty expression
- [x] `CREATE TABLE t (a INT IDENTITY()` — IDENTITY empty parens
- [x] `CREATE TABLE t (a INT DEFAULT)` — DEFAULT missing expression

### 8.12 DROP Statement Errors

- [x] `DROP` — DROP with no object type
- [x] `DROP TABLE` — missing object name
- [x] `DROP VIEW` — missing view name
- [x] `DROP PROCEDURE` — missing procedure name
- [x] `DROP FUNCTION` — missing function name
- [x] `DROP INDEX` — missing index name
- [x] `DROP INDEX ix1` — DROP INDEX missing ON
- [x] `DROP INDEX ix1 ON` — DROP INDEX ON missing table (gap: parses clean)
- [x] `DROP DATABASE` — missing database name
- [x] `DROP SCHEMA` — missing schema name
- [x] `DROP TABLE IF` — IF without EXISTS
- [x] `DROP TABLE EXISTS t` — EXISTS without IF
- [x] `DROP TABLE dbo.t1,` — trailing comma
- [x] `DROP BANANA t` — DROP with invalid object type keyword

### 8.13 ALTER DATABASE Errors

- [x] `ALTER DATABASE` — missing database name
- [x] `ALTER DATABASE db` — missing action clause
- [x] `ALTER DATABASE db ADD` — ADD without FILE
- [x] `ALTER DATABASE db ADD FILE` — ADD FILE missing filespec
- [x] `ALTER DATABASE db ADD FILE (` — unclosed filespec paren
- [x] `ALTER DATABASE db ADD FILE ()` — empty filespec
- [x] `ALTER DATABASE db ADD FILE (NAME)` — NAME missing = value

### 8.14 DECLARE / SET Errors

- [x] `DECLARE` — missing variable
- [x] `DECLARE @v` — missing data type
- [x] `DECLARE INT` — missing @ prefix on variable name
- [x] `DECLARE @v INT,` — trailing comma
- [x] `SET` — bare SET with no variable
- [x] `SET @v` — SET variable missing = and value
- [x] `SET @v =` — SET assignment missing value (gap: parses clean)
- [x] `SET NOCOUNT` — SET option missing ON/OFF (gap: parses clean)

### 8.15 Control Flow Errors

- [x] `BEGIN` — BEGIN without END
- [x] `END` — END without BEGIN
- [x] `IF` — IF missing condition
- [x] `IF 1=1` — IF missing THEN body (gap: parses clean)
- [x] `WHILE` — WHILE missing condition
- [x] `WHILE 1=1` — WHILE missing body (gap: parses clean)
- [x] `BEGIN TRY END TRY` — TRY/CATCH missing CATCH block
- [x] `BEGIN CATCH END CATCH` — CATCH without preceding TRY
- [x] `THROW 50000,` — THROW incomplete arguments (need 3)
- [x] `THROW 50000, 'msg'` — THROW missing third argument (severity)
- [x] `RAISERROR` — RAISERROR missing arguments
- [x] `RAISERROR(` — RAISERROR unclosed paren
- [x] `RAISERROR(50000)` — RAISERROR missing severity and state
- [x] `RAISERROR(50000, 16)` — RAISERROR missing state
- [x] `PRINT` — PRINT missing expression

### 8.16 Transaction Errors

- [x] `COMMIT` — bare COMMIT (fixed: oracle valid, now accepted)
- [x] `BEGIN TRANSACTION DISTRIBUTED` — wrong keyword order (gap: parses clean, DISTRIBUTED treated as id)
- [x] `SAVE` — bare SAVE without TRANSACTION

### 8.17 Cursor Errors

- [x] `DECLARE CURSOR` — missing cursor name before CURSOR
- [x] `DECLARE c CURSOR` — cursor missing FOR SELECT
- [x] `DECLARE c CURSOR FOR` — FOR missing SELECT statement
- [x] `OPEN` — OPEN missing cursor name
- [x] `CLOSE` — CLOSE missing cursor name
- [x] `DEALLOCATE` — DEALLOCATE missing cursor name
- [x] `FETCH` — bare FETCH (missing FROM/NEXT)
- [x] `FETCH NEXT FROM` — FETCH FROM missing cursor name
- [x] `FETCH NEXT FROM c INTO` — INTO missing variable list

### 8.18 EXECUTE Statement Errors

- [x] `EXEC` — EXEC missing procedure name or string
- [x] `EXEC dbo.proc @a =` — named parameter missing value
- [x] `EXEC dbo.proc ,` — leading comma in argument list
- [x] `EXEC (@sql) AT` — AT missing linked server name

### 8.19 Function Call Errors

- [x] `SELECT IIF(` — IIF unclosed
- [x] `SELECT IIF()` — IIF no arguments
- [x] `SELECT IIF(1=1)` — IIF missing then/else args
- [x] `SELECT IIF(1=1, 'a')` — IIF missing else arg
- [x] `SELECT COALESCE()` — COALESCE no arguments
- [x] `SELECT COALESCE(1)` — COALESCE single argument (needs 2+)
- [x] `SELECT NULLIF()` — NULLIF no arguments
- [x] `SELECT NULLIF(1)` — NULLIF single argument (needs 2)
- [x] `SELECT CAST(1)` — CAST missing AS clause
- [x] `SELECT CAST(1 AS)` — CAST AS missing data type
- [x] `SELECT CAST( AS INT)` — CAST missing expression
- [x] `SELECT CONVERT(INT,)` — CONVERT missing expression (gap: parses clean)
- [x] `SELECT CONVERT(,1)` — CONVERT missing target type
- [x] `SELECT DATEADD(, 1, GETDATE())` — DATEADD missing datepart (gap: parses clean)
- [x] `SELECT LEN()` — LEN no arguments (oracle valid: runtime error, not syntax)
- [x] `SELECT RANK()` — RANK missing OVER clause
- [x] `SELECT ROW_NUMBER()` — ROW_NUMBER missing OVER clause
- [x] `SELECT COUNT(*)` — COUNT(*) (oracle valid: valid T-SQL expression)

### 8.20 OVER Clause Errors

- [x] `SELECT ROW_NUMBER() OVER` — OVER missing parens
- [x] `SELECT ROW_NUMBER() OVER (` — OVER unclosed paren
- [x] `SELECT ROW_NUMBER() OVER (ORDER)` — ORDER without BY
- [x] `SELECT ROW_NUMBER() OVER (ORDER BY)` — ORDER BY missing expression
- [x] `SELECT ROW_NUMBER() OVER (PARTITION)` — PARTITION without BY
- [x] `SELECT ROW_NUMBER() OVER (PARTITION BY)` — PARTITION BY missing expression
- [x] `SELECT SUM(a) OVER (ROWS)` — ROWS missing frame extent
- [x] `SELECT SUM(a) OVER (ROWS BETWEEN)` — BETWEEN missing bounds
- [x] `SELECT SUM(a) OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND)` — AND missing upper bound

### 8.21 Data Type Errors

- [x] `DECLARE @v VARCHAR(` — unclosed precision paren
- [x] `DECLARE @v DECIMAL(,)` — empty precision and scale
- [x] `DECLARE @v NUMERIC()` — empty precision (gap: parses clean)
- [x] `DECLARE @v VARCHAR()` — empty length (gap: parses clean)

### 8.22 Subquery Errors

- [x] `SELECT (SELECT)` — subquery with no columns (gap: parses clean)
- [x] `SELECT (SELECT *)` — subquery with no FROM (oracle valid: valid T-SQL)
- [x] `SELECT * FROM (` — derived table unclosed
- [x] `SELECT * FROM ()` — empty derived table
- [x] `SELECT * FROM (SELECT * FROM t` — derived table unclosed
- [x] `SELECT * WHERE a IN (SELECT)` — IN subquery missing columns (gap: parses clean)

### 8.23 PIVOT / UNPIVOT Errors

- [x] `SELECT * FROM t PIVOT` — PIVOT missing parens
- [x] `SELECT * FROM t PIVOT (` — PIVOT unclosed
- [x] `SELECT * FROM t PIVOT ()` — PIVOT empty body
- [x] `SELECT * FROM t PIVOT (SUM(a) FOR)` — FOR missing column
- [x] `SELECT * FROM t PIVOT (SUM(a) FOR b IN)` — IN missing value list
- [x] `SELECT * FROM t PIVOT (SUM(a) FOR b IN ())` — IN empty list
- [x] `SELECT * FROM t UNPIVOT ()` — UNPIVOT empty body

### 8.24 FOR Clause Errors

- [x] `SELECT * FROM t FOR` — FOR with no format (XML/JSON/BROWSE)
- [x] `SELECT * FROM t FOR XML` — FOR XML missing mode (RAW/AUTO/PATH/EXPLICIT)
- [x] `SELECT * FROM t FOR JSON` — FOR JSON missing mode (PATH/AUTO)

### 8.25 Table Hints Errors

- [x] `SELECT * FROM t WITH` — WITH missing parens
- [x] `SELECT * FROM t WITH (` — WITH unclosed paren
- [x] `SELECT * FROM t WITH ()` — WITH empty hints (gap: parses clean)
- [x] `SELECT * FROM t WITH (BANANA)` — invalid hint keyword

### 8.26 OUTPUT Clause Errors

- [x] `INSERT INTO t OUTPUT VALUES (1)` — OUTPUT missing column list
- [x] `INSERT INTO t OUTPUT INSERTED. VALUES (1)` — OUTPUT INSERTED dot with no column name

### 8.27 String Literal Errors

- [x] `SELECT 'unterminated` — unterminated string literal
- [x] `SELECT N'unterminated` — unterminated N-prefixed string

### 8.28 Identifier Errors

- [x] `SELECT [unclosed` — unclosed bracket identifier
- [x] `SELECT "unclosed` — unclosed quoted identifier

---

## Verification Tools & Reference Sources

> Added 2026-03-01. These tools and references support black-box verification
> of tree-sitter-tsql against Microsoft's official T-SQL parser.

### V.1 SQL Parser Oracle Tool

A .NET console app that uses `Microsoft.SqlServer.Management.SqlParser` (NuGet 173.8.0)
as a black-box oracle for validating T-SQL parse results.

**Location:** `tools/sql-parser-oracle/`

**Usage:**
```bash
cd tools/sql-parser-oracle
echo "SELECT * FROM Users WHERE Id = 1" | dotnet run
echo "SELECT FROM" | dotnet run -- --quiet   # exit code 1 on failure
dotnet run --sql "CREATE TABLE T1 (Id INT)"
dotnet run --json < myquery.sql               # machine-readable JSON tree
dotnet run --xml --sql "SELECT 1"             # XML AST output
```

**Output modes:** `--tree` (default), `--xml`, `--json`, `--quiet`
**Exit codes:** 0 = parse success, 1 = parse failure

**AST node types emitted** (partial list from testing):
- `SqlScript` > `SqlBatch` > `SqlSelectStatement` > `SqlSelectSpecification` > `SqlQuerySpecification`
- `SqlSelectClause`, `SqlFromClause`, `SqlWhereClause`
- `SqlSelectStarExpression`, `SqlColumnRefExpression`, `SqlTableRefExpression`
- `SqlComparisonBooleanExpression`, `IntegerLiteralExpression`
- `OnePartObjectIdentifier`, `SqlIdentifier`

**License note:** The NuGet package `Microsoft.SqlServer.Management.SqlParser` has a
restrictive license (no reverse engineering/decompilation). We use it strictly as a
black-box oracle — feeding SQL input and observing parse success/failure and AST output.
We do NOT look at its decompiled source.

### V.2 SqlScriptDOM — Open-Source Official Microsoft T-SQL Parser

**Repository:** https://github.com/microsoft/SqlScriptDom
**License:** MIT (fully open source)
**Cloned to:** `tools/SqlScriptDom/`

This is Microsoft's official open-source T-SQL parser library, built on ANTLR.
Unlike the NuGet SqlParser package, we CAN freely read the grammar and source code.

**Key resources:**

| Resource | Path | Description |
|----------|------|-------------|
| Latest grammar | `tools/SqlScriptDom/SqlScriptDom/Parser/TSql/TSql170.g` | 35,375-line ANTLR grammar for SQL Server 2022 (compat level 170) |
| All grammar versions | `tools/SqlScriptDom/SqlScriptDom/Parser/TSql/TSql{80..170}.g` | Grammars for SQL 2000 through 2022 |
| Fabric DW grammar | `tools/SqlScriptDom/SqlScriptDom/Parser/TSql/TSqlFabricDW.g` | Azure Fabric Data Warehouse dialect |
| Token definitions | `tools/SqlScriptDom/SqlScriptDom/Parser/TSql/TSqlTokenTypes.g` | Lexer token types |
| Test scripts | `tools/SqlScriptDom/Test/SqlDom/TestScripts/` | 470 SQL test scripts from Microsoft |
| AST node classes | `tools/SqlScriptDom/SqlScriptDom/ScriptDom/` | C# AST node definitions |
| Script generator | `tools/SqlScriptDom/SqlScriptDom/ScriptDom/SqlScriptGeneratorVisitor*.cs` | SQL pretty-printer visitors |

**Grammar file versions available:**
- `TSql80.g` — SQL Server 2000
- `TSql90.g` — SQL Server 2005
- `TSql100.g` — SQL Server 2008
- `TSql110.g` — SQL Server 2012
- `TSql120.g` — SQL Server 2014
- `TSql130.g` — SQL Server 2016
- `TSql140.g` — SQL Server 2017
- `TSql150.g` — SQL Server 2019
- `TSql160.g` — SQL Server 2022
- `TSql170.g` — SQL Server 2022 (latest compat level)
- `TSqlFabricDW.g` — Azure Fabric Data Warehouse

**How to use for verification:**
1. **Grammar reference:** Read `TSql170.g` directly to understand official rule structure,
   operator precedence, keyword classification, and production alternatives. This replaces
   the ANTLR4 line references used throughout this Progress.md (those were from an older
   community grammar; SqlScriptDOM is the authoritative Microsoft source).
2. **Test corpus mining:** The 470 test scripts in `Test/SqlDom/TestScripts/` provide real-world
   SQL examples that our tree-sitter parser should handle. These can be fed through both
   our parser and the oracle tool to find discrepancies.
3. **AST comparison:** The `ScriptDom` node classes define the canonical AST structure that
   Microsoft uses — useful for validating that our tree-sitter node names and hierarchy
   are reasonable.

### V.3 ILSpy (compiled, not needed for SqlScriptDOM work)

ILSpy was compiled from source at `/Users/noahpeterson/Downloads/ILSpy/` for .NET 10.
It was originally used to decompile the SqlParser NuGet package, but we deleted that
output to comply with the NuGet license. With SqlScriptDOM now available under MIT,
ILSpy is no longer needed for this project but remains available for other use.

**Binary:** `/Users/noahpeterson/Downloads/ILSpy/ICSharpCode.ILSpyCmd/bin/Release/net10.0/ilspycmd.dll`
**Usage:** `dotnet <path>/ilspycmd.dll <assembly.dll>`

### V.4 Ghidra / GhydraMCP (not suitable for .NET analysis)

Ghidra with GhydraMCP was set up and connected (port 8192) but is not suitable for
analyzing .NET/CLR assemblies — it sees IL bytecode rather than meaningful decompiled
code. The SqlParser DLL was loaded but produced 18,747 "functions" that are really
CLR method stubs. **Use ILSpy or dotnet tools instead for .NET analysis.**

### V.5 Batch Verification Script

**Location:** `tools/verify-tests.sh`

Extracts SQL from all test corpus files and validates each against the oracle.
Positive tests should pass on both parsers; negative tests should fail on both.

**Usage:**
```bash
./tools/verify-tests.sh                           # all test files
./tools/verify-tests.sh test/corpus/select.txt     # specific file
```

**Requirements:** Build oracle first: `cd tools/sql-parser-oracle && dotnet build -c Release`

### V.6 Verification Results (2026-03-01)

**492 tests verified: 471 pass (95.7%), 21 mismatches**

| Category | Count | Files | Issue |
|----------|-------|-------|-------|
| ROWS/RANGE without ORDER BY | 8 | over_clause, row_or_range, window_frame_* | Oracle requires ORDER BY before ROWS/RANGE frame; tree-sitter is more permissive (syntactically valid) |
| GO batch features | 3 | batch, go | `GO 5` repeat count is SSMS/sqlcmd feature, not T-SQL language; multi-line batch format |
| IGNORE/RESPECT NULLS | 2 | analytic_windowed_function | ANSI SQL standard, NOT supported in SQL Server |
| MERGE needs semicolon | 2 | merge, phase1_gaps | SQL Server requires MERGE to end with `;` |
| `?` parameter marker | 2 | parameter, primitive_constant | ODBC/JDBC placeholder, not native T-SQL |
| SELECT DEFAULT | 1 | primitive_expression | DEFAULT not valid as standalone SELECT expression |
| EXEC string concat | 1 | execute_var_string | `EXECUTE 'str' + @var` form rejected by oracle |
| KEY as identifier | 1 | keyword_identifiers | KEY is reserved in SQL Server |
| `$ action` accepted | 1 | negative_tests (reversed!) | Our negative test says invalid but oracle accepts `$ action` with space |

**Assessment:** Most mismatches are intentional permissiveness (e.g., ROWS/RANGE without ORDER BY
is syntactically valid per SQL standard) or client tool features (GO count, ? params). Only 2-3
are genuine issues worth fixing (MERGE semicolon, KEY reserved word, $ action behavior).

### V.7 Verification Strategy Going Forward

1. **Gold standard:** Use SqlScriptDOM's `TSql170.g` as the authoritative grammar reference
   (MIT licensed, we can read every rule).
2. **Black-box oracle:** Use `tools/sql-parser-oracle/` to validate individual SQL statements
   against Microsoft's parser (pass/fail + AST node types).
3. **Batch verification:** Run `tools/verify-tests.sh` after grammar changes to catch regressions.
4. **Test corpus:** Mine the 470 test scripts from `tools/SqlScriptDom/Test/SqlDom/TestScripts/`
   for comprehensive test cases. Feed each through `tree-sitter parse` and the oracle
   to compare results.
5. **Regression testing:** For each new grammar rule added to tree-sitter-tsql, create
   corresponding test cases verified against the oracle.
6. **Version metadata:** `version-rules.json` maps features to minimum SQL Server versions
   for editor/linter integration.

### V.8 Version Metadata (`version-rules.json`)

Maps tree-sitter node types and features to minimum SQL Server compatibility levels.
Editors and linters can use this for version-aware diagnostics (e.g., "DROP IF EXISTS
requires SQL Server 2016+ (compat level 130)").

**Location:** `version-rules.json` (project root)
**Format:**
```json
{
  "features": {
    "drop_if_exists": { "min_version": "130", "sql_server": "2016", "description": "DROP ... IF EXISTS" },
    "json_functions": { "min_version": "130", "sql_server": "2016", "description": "JSON_VALUE, JSON_QUERY, etc." }
  }
}
```
