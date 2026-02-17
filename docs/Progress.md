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
- [ ] `full_column_name` — `DELETED.column`, `INSERTED.column` (Parser L5156)
- [x] `bracket_expression` — `(expression)` (Parser L3945)
- [x] `bracket_expression` — `(subquery)` (Parser L3946)
- [x] `unary_operator_expression` — `~expr`, `-expr`, `+expr` (Parser L3940)
- [x] Multiplicative operators — `expr * expr`, `expr / expr`, `expr % expr` (Parser L3912)
- [x] Additive operators — `expr + expr`, `expr - expr` (Parser L3913)
- [x] Bitwise operators — `expr & expr`, `expr ^ expr`, `expr | expr`, `expr || expr` (Parser L3913)
- [x] `case_expression` — simple CASE: `CASE expr WHEN val THEN result END` (Parser L3935)
- [x] `case_expression` — searched CASE: `CASE WHEN condition THEN result END` (Parser L3936)
- [ ] `COLLATE` on expression — `expression COLLATE collation_name` (Parser L3907)
- [ ] `AT TIME ZONE` — `expression AT TIME ZONE 'zone'` (Parser L3914)
- [ ] XML `.value()` method (Parser L3905)
- [ ] XML `.query()` method (Parser L3905)
- [ ] XML `.exist()` method (Parser L3905)
- [ ] XML `.modify()` method (Parser L3905)
- [ ] `expression.hierarchyid_call` (Parser L3906)
- [ ] `DOLLAR_ACTION` — `$action` for MERGE (Parser L3916)
- [ ] `over_clause` as standalone expression (Parser L3915)

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
- [ ] `ALL`/`SOME`/`ANY` predicate — `expr op ALL|SOME|ANY (subquery)` (Parser L3988)
- [ ] `freetext_predicate` — `CONTAINS(col, 'text')` (Parser L3985)
- [ ] `freetext_predicate` — `FREETEXT(col, 'text')` (Parser L3985)

### 1.3 WHERE and HAVING Clauses

- [x] WHERE clause in `query_specification` (Parser L4016)
- [x] HAVING clause in `query_specification` (Parser L4022)

### 1.4 Keyword-as-Identifier Expansion (Parser L5287-L6258)

- [~] `keyword` rule — currently only `GO` (grammar.js L578-L580)
- [ ] Expand `keyword` to include all ~600+ T-SQL keywords that can be used as identifiers

### 1.5 Identifier Fixes (Lexer L1218-L1225)

- [x] `ID` — regular identifiers (grammar.js L22)
- [x] `SQUARE_BRACKET_ID` — `[delimited]` identifiers (grammar.js L23)
- [x] `LOCAL_ID` — `@variable` (grammar.js L24)
- [x] `DOUBLE_QUOTE_ID` — `"delimited"` identifiers (Lexer L1218)
- [ ] `TEMP_ID` — `#temp` / `##global_temp` (Lexer L1223)
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
- [ ] Parenthesized `query_expression` — `(query_expression)` (Parser L3999)

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
- [ ] `rowset_function` — `OPENROWSET(...)` (Parser L4167)
- [ ] `rowset_function` — `OPENQUERY(...)` (Parser L4167)
- [ ] `rowset_function` — `OPENDATASOURCE(...)` (Parser L4167)
- [ ] `change_table` — `CHANGETABLE(CHANGES ...)` (Parser L4177)
- [ ] `change_table` — `CHANGETABLE(VERSION ...)` (Parser L4177)
- [ ] `nodes_method` — XML `.nodes()` in FROM (Parser L4180)
- [ ] `open_xml` (Parser L4182)
- [ ] `open_json` (Parser L4183)
- [ ] `TABLESAMPLE (n PERCENT|ROWS)` (Parser L4186)

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
- [ ] UPDATE with table hints (Parser L2200)
- [ ] UPDATE `CURRENT OF cursor` (Parser L2205)

### 3.3 DELETE Statement (Parser L2148-L2160)

- [x] `delete_statement` rule (Parser L2148)
- [x] `DELETE FROM table` (Parser L2149)
- [x] `delete_statement_from` — `FROM table_sources` (Parser L2154)
- [x] DELETE with `WHERE` (Parser L2155)
- [x] DELETE with `TOP` (Parser L2149)
- [x] DELETE with `OUTPUT` clause (Parser L2153)
- [x] DELETE with `WITH` (CTE) (Parser L2148)
- [ ] DELETE `CURRENT OF cursor` (Parser L2156)

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
- [ ] `$action` in MERGE OUTPUT (Parser L3916)

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
- [ ] `DECLARE @var TABLE (col_def, ...)` (Parser L2984)
- [x] Multiple declarations — `DECLARE @a INT, @b VARCHAR(10)` (Parser L2985)
- [ ] `DECLARE @var AS table_name` (Parser L2986)
- [ ] `DECLARE @var CURSOR` (Parser L2987)
- [ ] `DECLARE @xml_var XML` with XMLNAMESPACES (Parser L2988)

### 4.2 SET Statement (Parser L3398-L3408)

- [x] `SET @var = expression` (Parser L3399)
- [x] `SET @var assignment_operator expression` (`+=`, `-=`, etc.) (Parser L3400)
- [ ] `SET @cursor = CURSOR FOR select_statement` (Parser L3401)
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
- [ ] `set_special` — other SET options (Parser L3402-L3408)

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
- [ ] `goto_statement` — `GOTO label` (Parser L254)
- [ ] `label_statement` — `label_name:` (Parser L264)
- [ ] `waitfor_statement` — `WAITFOR DELAY 'time'` (Parser L261)
- [ ] `waitfor_statement` — `WAITFOR TIME 'time'` (Parser L261)

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

- [ ] `CURRENT_DATE` (~L4584)
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

- [ ] `BINARY_CHECKSUM(* | expression, ...)` (~L4494)
- [ ] `CHECKSUM(* | expression, ...)` (~L4496)
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
- [ ] `USER` (~L4775)
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
- [ ] `IDENTITY(data_type [, seed, increment])` (~L4579)
- [x] `SQL_VARIANT_PROPERTY(expression, property)` (~L4580)

### 5.12 Cryptographic Functions (Parser ~L4567)

- [ ] `CERT_ID(cert_name)` (~L4567)

### 5.13 Freetext Functions (Parser L4302-L4320)

- [ ] `CONTAINSTABLE(table, column, search_condition)` (Parser L4303)
- [ ] `FREETEXTTABLE(table, column, freetext_string)` (Parser L4308)
- [ ] `SEMANTICSIMILARITYTABLE(table, column, expression)` (Parser L4310)
- [ ] `SEMANTICKEYPHRASETABLE(table, column, expression)` (Parser L4312)
- [ ] `SEMANTICSIMILARITYDETAILSTABLE(table, col1, expression, col2, expression)` (Parser L4314)

---

## Phase 6 — DDL

### 6.1 CREATE TABLE (Parser L1479-L1570)

- [x] `CREATE TABLE name (column_definitions)` (Parser L1479)
- [x] Column definition — `col_name data_type [NULL|NOT NULL]` (Parser L1485)
- [x] Column definition — `DEFAULT expression` (Parser L1487)
- [x] Column definition — `IDENTITY [(seed, increment)]` (Parser L1488)
- [ ] Column definition — `COLLATE collation_name` (Parser L1489)
- [x] Column definition — `CONSTRAINT name` (Parser L1490)
- [x] `PRIMARY KEY` constraint (Parser L1500)
- [x] `UNIQUE` constraint (Parser L1502)
- [x] `FOREIGN KEY ... REFERENCES table (col)` (Parser L1504)
- [x] `CHECK (expression)` constraint (Parser L1510)
- [ ] `CLUSTERED` / `NONCLUSTERED` (Parser L1501)
- [ ] `CREATE TABLE ... AS FileTable` (Parser L1520)
- [x] Table-level `PRIMARY KEY (col, ...)` (Parser L1530)
- [x] Table-level `UNIQUE (col, ...)` (Parser L1535)
- [x] Table-level `FOREIGN KEY (col) REFERENCES ...` (Parser L1540)
- [x] Table-level `CHECK (expression)` (Parser L1545)
- [ ] `ON filegroup` (Parser L1560)
- [ ] `TEXTIMAGE_ON filegroup` (Parser L1565)
- [ ] Column computed definitions — `col AS expression [PERSISTED]` (Parser L1491)
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
- [ ] `CREATE COLUMNSTORE INDEX` (Parser L1320)

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
- [ ] DDL trigger — `ON DATABASE|ALL SERVER` (Parser L2422)
- [ ] DDL trigger event types (Parser L2425)

### 6.9 Other DDL

- [x] `CREATE SCHEMA name [AUTHORIZATION owner]` (Parser L1440)
- [x] `CREATE TYPE name` (Parser L1460)
- [x] `CREATE SEQUENCE name` (Parser L1380)
- [x] `CREATE SYNONYM name FOR object` (Parser L1450)
- [x] `TRUNCATE TABLE name` (Parser L236)
- [ ] `UPDATE STATISTICS table` (Parser L237)
- [ ] `ENABLE TRIGGER name ON table` (Parser L231)
- [ ] `DISABLE TRIGGER name ON table` (Parser L229)
- [ ] `ALTER DATABASE name SET options` (Parser L700)
- [ ] `ALTER INDEX name ON table REBUILD|REORGANIZE|DISABLE` (Parser L800)

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
- [ ] `DOUBLE PRECISION` synonym
- [ ] `IDENTITY(seed, increment)` specification

### 7.2 DBCC Commands (Parser L3635-L3652)

- [x] `DBCC` generic rule — `DBCC command [(args)] [WITH options]` (covers all DBCC commands)

### 7.3 Backup/Restore (Parser L241, L3008-L3117)

- [ ] `BACKUP DATABASE name TO DISK|TAPE|URL` (Parser L3008)
- [ ] `BACKUP DATABASE ... WITH DIFFERENTIAL` (Parser L3020)
- [ ] `BACKUP DATABASE ... WITH options` (COMPRESSION, INIT, etc.) (Parser L3030)
- [ ] `BACKUP LOG name TO DISK|TAPE|URL` (Parser L3054)
- [ ] `BACKUP LOG ... WITH NO_LOG|TRUNCATE_ONLY` (Parser L3060)
- [ ] `BACKUP CERTIFICATE name TO FILE` (Parser L3101)
- [ ] `BACKUP MASTER KEY TO FILE` (Parser L3112)
- [ ] `BACKUP SERVICE MASTER KEY TO FILE` (Parser L3117)
- [ ] `RESTORE DATABASE name FROM DISK|TAPE|URL` (restore statements)
- [ ] `RESTORE LOG name FROM DISK|TAPE|URL`
- [ ] `RESTORE ... WITH NORECOVERY|RECOVERY|STANDBY`

### 7.4 Security Statements (Parser L362)

- [ ] `GRANT permission ON object TO principal` (Parser L362)
- [ ] `DENY permission ON object TO principal`
- [ ] `REVOKE permission ON object FROM principal`
- [ ] `GRANT ... WITH GRANT OPTION`
- [ ] `ADD MEMBER` / `DROP MEMBER` (role membership)

### 7.5 XML Methods (Parser L3905)

- [ ] `.value(xpath, data_type)` — extract scalar (Parser L3905)
- [ ] `.query(xpath)` — return XML fragment (Parser L3905)
- [ ] `.exist(xpath)` — check existence (Parser L3905)
- [ ] `.modify(xml_dml)` — modify in place (Parser L3905)
- [ ] `.nodes(xpath)` — shred to rows (Parser L4180)

### 7.6 ODBC Scalar Functions — remaining

- [x] 17 ODBC functions implemented (odbc_scalar_functions.js)
- [ ] ODBC string functions — ASCII, CHAR, INSERT, LCASE, LENGTH, LOCATE, LTRIM, REPEAT, RIGHT, RTRIM, SPACE, SUBSTRING, UCASE
- [ ] ODBC numeric functions — ABS, ACOS, ASIN, ATAN, ATAN2, CEILING, COS, COT, DEGREES, EXP, FLOOR, LOG, LOG10, MOD, PI, POWER, RADIANS, RAND, ROUND, SIGN, SIN, SQRT, TAN
- [ ] ODBC date functions — DAYOFYEAR, EXTRACT, NOW, TIMESTAMPADD, TIMESTAMPDIFF

### 7.7 another_statement — remaining (Parser L350-L368)

- [x] `execute_statement` (grammar.js L135)
- [x] `kill_statement` — `KILL session_id` (Parser L359)
- [x] `reconfigure_statement` — `RECONFIGURE [WITH OVERRIDE]` (Parser L361)
- [x] `shutdown_statement` — `SHUTDOWN [WITH NOWAIT]` (Parser L365)
- [x] `checkpoint_statement` — `CHECKPOINT [duration]` (Parser L352)
- [ ] `setuser_statement` — `SETUSER ['user']` (Parser L364)
- [ ] `conversation_statement` — Service Broker conversations (Parser L353)
- [ ] `message_statement` — Service Broker messages (Parser L360)
- [ ] `security_statement` — GRANT/DENY/REVOKE (Parser L362)
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
- [ ] Negative constant prefix — `constant` allows `-` (Parser L5273)
- [ ] `$action` token (Parser L3916)

### 7.10 Comments (Lexer L1214-L1215)

- [x] Block comments `/* ... */` (nestable) (Lexer L1214)
- [x] Single-line comments `-- ...` (Lexer L1215)

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

---

## Phase 8 — Negative (Error) Tests

> Tests that assert known-invalid SQL produces `(ERROR)` nodes. Ensures the parser
> rejects bad syntax rather than silently accepting it. **0 of these exist today.**

### 8.1 SELECT Statement Errors

- [x] `SELECT` — bare SELECT with no columns
- [x] `SELECT ,` — leading comma in select list
- [x] `SELECT a,` — trailing comma in select list
- [x] `SELECT a,,b` — double comma in select list
- [ ] `SELECT FROM t` — missing select list before FROM
- [x] `SELECT * FROM` — FROM with no table
- [ ] `SELECT * WHERE 1=1` — WHERE without FROM
- [x] `SELECT * FROM t WHERE` — WHERE with no condition
- [x] `SELECT * FROM t ORDER` — ORDER without BY
- [x] `SELECT * FROM t ORDER BY` — ORDER BY with no expressions
- [ ] `SELECT * FROM t GROUP` — GROUP without BY
- [x] `SELECT * FROM t GROUP BY` — GROUP BY with no expressions
- [x] `SELECT * FROM t HAVING` — HAVING with no condition
- [x] `SELECT * FROM t ORDER BY a OFFSET` — OFFSET missing row count
- [ ] `SELECT * FROM t ORDER BY a OFFSET 5` — OFFSET without ROWS
- [x] `SELECT * FROM t ORDER BY a OFFSET 5 ROWS FETCH` — FETCH incomplete
- [ ] `SELECT TOP FROM t` — TOP missing expression
- [ ] `SELECT TOP ( FROM t` — TOP unclosed paren
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
- [ ] `SELECT (1+2` — unclosed parenthesized expression
- [ ] `SELECT 1 + (2 * )` — empty right side inside parens
- [x] `SELECT ~` — bitwise NOT with no operand
- [x] `SELECT 1 2` — two expressions with no operator between
- [x] `SELECT 1 = 2` — assignment operator in select list (not comparison context)

### 8.3 CASE Expression Errors

- [x] `SELECT CASE END` — CASE with no WHEN clauses
- [x] `SELECT CASE WHEN THEN 1 END` — WHEN missing condition
- [ ] `SELECT CASE WHEN 1=1 THEN END` — THEN missing result expression
- [x] `SELECT CASE WHEN 1=1 END` — WHEN without THEN
- [x] `SELECT CASE 1 WHEN THEN 2 END` — simple CASE WHEN missing match value
- [x] `SELECT CASE 1` — CASE never closed (no END)
- [ ] `SELECT CASE WHEN 1=1 THEN 1 ELSE END` — ELSE with no expression

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
- [ ] `SELECT * FROM t WHERE a IN ()` — IN empty list
- [x] `SELECT * FROM t WHERE a LIKE` — LIKE missing pattern
- [ ] `SELECT * FROM t WHERE a IS` — IS without NULL/NOT NULL
- [x] `SELECT * FROM t WHERE EXISTS` — EXISTS missing subquery
- [x] `SELECT * FROM t WHERE EXISTS (` — EXISTS unclosed paren
- [x] `SELECT * FROM t WHERE a >` — comparison missing right side
- [ ] `SELECT * FROM t WHERE > 1` — comparison missing left side

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
- [ ] `INSERT INTO t VALUES ()` — empty VALUES list
- [ ] `INSERT INTO t (a,b) VALUES (1)` — column count mismatch (parser may not catch, but good to document)
- [x] `INSERT INTO t VALUES (1,)` — trailing comma in VALUES
- [x] `INSERT INTO t (,a) VALUES (1)` — leading comma in column list
- [ ] `INSERT INTO t () VALUES (1)` — empty column list

### 8.7 UPDATE Statement Errors

- [x] `UPDATE` — missing table name
- [x] `UPDATE t` — missing SET clause
- [x] `UPDATE t SET` — SET with no assignments
- [ ] `UPDATE t SET a =` — SET assignment missing value
- [ ] `UPDATE t SET = 1` — SET missing column name
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
- [ ] `MERGE INTO t USING s ON 1=1 WHEN MATCHED THEN` — THEN missing action
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
- [ ] `DROP INDEX ix1 ON` — DROP INDEX ON missing table
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
- [ ] `SET @v =` — SET assignment missing value
- [ ] `SET NOCOUNT` — SET option missing ON/OFF

### 8.15 Control Flow Errors

- [x] `BEGIN` — BEGIN without END
- [ ] `END` — END without BEGIN
- [x] `IF` — IF missing condition
- [ ] `IF 1=1` — IF missing THEN body (sql_clauses)
- [x] `WHILE` — WHILE missing condition
- [ ] `WHILE 1=1` — WHILE missing body
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

- [ ] `COMMIT` — bare COMMIT (may or may not be valid — verify)
- [ ] `BEGIN TRANSACTION DISTRIBUTED` — wrong keyword order (should be BEGIN DISTRIBUTED TRANSACTION)
- [ ] `SAVE` — bare SAVE without TRANSACTION

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
- [ ] `SELECT CONVERT(INT,)` — CONVERT missing expression
- [x] `SELECT CONVERT(,1)` — CONVERT missing target type
- [ ] `SELECT DATEADD(, 1, GETDATE())` — DATEADD missing datepart
- [ ] `SELECT LEN()` — LEN no arguments
- [x] `SELECT RANK()` — RANK missing OVER clause
- [x] `SELECT ROW_NUMBER()` — ROW_NUMBER missing OVER clause
- [ ] `SELECT COUNT(*)` — COUNT(*) missing OVER when used as analytic (verify if error)

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
- [ ] `DECLARE @v NUMERIC()` — empty precision
- [ ] `DECLARE @v VARCHAR()` — empty length

### 8.22 Subquery Errors

- [ ] `SELECT (SELECT)` — subquery with no columns
- [ ] `SELECT (SELECT *)` — subquery with no FROM (may be valid in T-SQL — verify)
- [x] `SELECT * FROM (` — derived table unclosed
- [x] `SELECT * FROM ()` — empty derived table
- [x] `SELECT * FROM (SELECT * FROM t` — derived table unclosed
- [ ] `SELECT * WHERE a IN (SELECT)` — IN subquery missing columns

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
- [ ] `SELECT * FROM t WITH ()` — WITH empty hints
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
