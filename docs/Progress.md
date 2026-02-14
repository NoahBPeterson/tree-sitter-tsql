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
- [ ] `for_clause` — `FOR BROWSE` (Parser L4055)
- [ ] `for_clause` — `FOR XML RAW` (Parser L4058)
- [ ] `for_clause` — `FOR XML AUTO` (Parser L4059)
- [ ] `for_clause` — `FOR XML EXPLICIT` (Parser L4060)
- [ ] `for_clause` — `FOR XML PATH` (Parser L4061)
- [ ] `for_clause` — `FOR JSON AUTO` (Parser L4067)
- [ ] `for_clause` — `FOR JSON PATH` (Parser L4068)
- [ ] `option_clause` — `OPTION (query_hint, ...)` (Parser L4089)
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
- [ ] Table-valued functions — `dbo.fn_table(@param)` (Parser L4175)
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
- [ ] `PIVOT (agg FOR col IN (vals)) AS alias` (Parser L4247)
- [ ] `UNPIVOT (col FOR col IN (cols)) AS alias` (Parser L4251)

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

- [ ] `insert_statement` rule (Parser L2161)
- [ ] `INSERT INTO table` with column list (Parser L2162)
- [ ] `insert_statement_value` — `VALUES (expr, ...)` (Parser L2168)
- [ ] `insert_statement_value` — `VALUES (expr, ...), (expr, ...)` (multi-row) (Parser L2169)
- [ ] `insert_statement_value` — derived table / SELECT (Parser L2170)
- [ ] `insert_statement_value` — `execute_statement` (Parser L2171)
- [ ] `insert_statement_value` — `DEFAULT VALUES` (Parser L2172)
- [ ] INSERT with `TOP` (Parser L2163)
- [ ] INSERT with `OUTPUT` clause (Parser L2165)
- [ ] INSERT with `WITH` (CTE) (Parser L2161)

### 3.2 UPDATE Statement (Parser L2195-L2220)

- [ ] `update_statement` rule (Parser L2195)
- [ ] `UPDATE table SET col = expr` (Parser L2196)
- [ ] `update_elem` — `col = expression` (Parser L2197)
- [ ] `update_elem` — `col assignment_operator expression` (Parser L2198)
- [ ] `update_elem` — `@var = col = expression` (Parser L2199)
- [ ] UPDATE with `FROM` clause (Parser L2202)
- [ ] UPDATE with `WHERE` (Parser L2204)
- [ ] UPDATE with `TOP` (Parser L2196)
- [ ] UPDATE with `OUTPUT` clause (Parser L2203)
- [ ] UPDATE with `WITH` (CTE) (Parser L2195)
- [ ] UPDATE with table hints (Parser L2200)
- [ ] UPDATE `CURRENT OF cursor` (Parser L2205)

### 3.3 DELETE Statement (Parser L2148-L2160)

- [ ] `delete_statement` rule (Parser L2148)
- [ ] `DELETE FROM table` (Parser L2149)
- [ ] `delete_statement_from` — `FROM table_sources` (Parser L2154)
- [ ] DELETE with `WHERE` (Parser L2155)
- [ ] DELETE with `TOP` (Parser L2149)
- [ ] DELETE with `OUTPUT` clause (Parser L2153)
- [ ] DELETE with `WITH` (CTE) (Parser L2148)
- [ ] DELETE `CURRENT OF cursor` (Parser L2156)

### 3.4 MERGE Statement (Parser L2127-L2146)

- [ ] `merge_statement` rule (Parser L2127)
- [ ] `MERGE INTO target USING source ON condition` (Parser L2128)
- [ ] `when_matches` — `WHEN MATCHED THEN UPDATE SET ...` (Parser L2132)
- [ ] `when_matches` — `WHEN MATCHED THEN DELETE` (Parser L2133)
- [ ] `when_matches` — `WHEN NOT MATCHED THEN INSERT ...` (Parser L2134)
- [ ] `when_matches` — `WHEN NOT MATCHED BY SOURCE THEN ...` (Parser L2135)
- [ ] `merge_matched` (Parser L2138)
- [ ] `merge_not_matched` (Parser L2143)
- [ ] MERGE with `OUTPUT` clause (Parser L2131)
- [ ] MERGE with `WITH` (CTE) (Parser L2127)
- [ ] `$action` in MERGE OUTPUT (Parser L3916)

### 3.5 OUTPUT Clause (shared across DML)

- [ ] `output_clause` — `OUTPUT inserted.col, deleted.col` (Parser L2228)
- [ ] `output_dml_list_elem` (Parser L2235)
- [ ] `output_column_name` (Parser L2241)
- [ ] `OUTPUT INTO table` (Parser L2230)

---

## Phase 4 — Procedural / Control Flow

### 4.1 DECLARE Statement (Parser L2981-L2993)

- [ ] `DECLARE @var data_type` (Parser L2982)
- [ ] `DECLARE @var data_type = expression` (Parser L2983)
- [ ] `DECLARE @var TABLE (col_def, ...)` (Parser L2984)
- [ ] Multiple declarations — `DECLARE @a INT, @b VARCHAR(10)` (Parser L2985)
- [ ] `DECLARE @var AS table_name` (Parser L2986)
- [ ] `DECLARE @var CURSOR` (Parser L2987)
- [ ] `DECLARE @xml_var XML` with XMLNAMESPACES (Parser L2988)

### 4.2 SET Statement (Parser L3398-L3408)

- [ ] `SET @var = expression` (Parser L3399)
- [ ] `SET @var assignment_operator expression` (`+=`, `-=`, etc.) (Parser L3400)
- [ ] `SET @cursor = CURSOR FOR select_statement` (Parser L3401)
- [ ] `set_special` — `SET ANSI_NULLS ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET ANSI_PADDING ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET ANSI_WARNINGS ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET ARITHABORT ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET CONCAT_NULL_YIELDS_NULL ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET NOCOUNT ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET QUOTED_IDENTIFIER ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET XACT_ABORT ON|OFF` (Parser L3402)
- [ ] `set_special` — `SET TRANSACTION ISOLATION LEVEL ...` (Parser L3404)
- [ ] `set_special` — `SET IDENTITY_INSERT table ON|OFF` (Parser L3405)
- [ ] `set_special` — `SET ROWCOUNT expression` (Parser L3406)
- [ ] `set_special` — other SET options (Parser L3402-L3408)

### 4.3 Control Flow — cfl_statement (Parser L250-L264)

- [ ] `block_statement` — `BEGIN sql_clauses* END` (Parser L251)
- [ ] `if_statement` — `IF search_condition sql_clause [ELSE sql_clause]` (Parser L255)
- [ ] `while_statement` — `WHILE search_condition sql_clause` (Parser L262)
- [ ] `return_statement` — `RETURN [expression]` (Parser L258)
- [ ] `break_statement` — `BREAK` (Parser L252)
- [ ] `continue_statement` — `CONTINUE` (Parser L253)
- [ ] `try_catch_statement` — `BEGIN TRY ... END TRY BEGIN CATCH ... END CATCH` (Parser L260)
- [ ] `throw_statement` — `THROW [number, message, state]` (Parser L259)
- [ ] `print_statement` — `PRINT expression` (Parser L256)
- [ ] `raiseerror_statement` — `RAISERROR(msg, severity, state [, args])` (Parser L257)
- [ ] `goto_statement` — `GOTO label` (Parser L254)
- [ ] `label_statement` — `label_name:` (Parser L264)
- [ ] `waitfor_statement` — `WAITFOR DELAY 'time'` (Parser L261)
- [ ] `waitfor_statement` — `WAITFOR TIME 'time'` (Parser L261)

### 4.4 Transaction Statements (Parser L3409-L3430)

- [ ] `BEGIN TRANSACTION [name]` (Parser L3410)
- [ ] `BEGIN DISTRIBUTED TRANSACTION [name]` (Parser L3411)
- [ ] `COMMIT TRANSACTION [name]` (Parser L3414)
- [ ] `COMMIT WORK` (Parser L3416)
- [ ] `ROLLBACK TRANSACTION [name]` (Parser L3420)
- [ ] `ROLLBACK WORK` (Parser L3422)
- [ ] `SAVE TRANSACTION name` (Parser L3426)

### 4.5 Cursor Statements (Parser L2994-L3007)

- [ ] `DECLARE cursor_name CURSOR [options] FOR select_statement` (Parser L2994)
- [ ] `OPEN cursor_name` (Parser L2998)
- [ ] `FETCH [NEXT|PRIOR|FIRST|LAST|ABSOLUTE|RELATIVE] FROM cursor INTO @vars` (Parser L2999)
- [ ] `CLOSE cursor_name` (Parser L3002)
- [ ] `DEALLOCATE cursor_name` (Parser L3003)

### 4.6 USE Statement (Parser L367)

- [ ] `USE database_name` (Parser L367)

---

## Phase 5 — Built-in Functions

### 5.1 Conversion Functions (Parser L4551-L4557)

- [x] `CAST(expression AS data_type)` (conversion_functions.js L6)
- [ ] `CONVERT(data_type, expression [, style])` (Parser ~L4555)
- [ ] `TRY_CAST(expression AS data_type)` (Parser ~L4553)
- [ ] `TRY_CONVERT(data_type, expression [, style])` (Parser ~L4555)
- [ ] `PARSE(string AS data_type [USING culture])` (Parser ~L4653)
- [ ] `TRY_PARSE(string AS data_type [USING culture])` (Parser ~L4655)
- [ ] `COALESCE(expression, expression, ...)` (Parser ~L4557)
- [ ] `NULLIF(expression, expression)` (Parser ~L4651)
- [ ] `IIF(condition, true_val, false_val)` (Parser ~L4659)

### 5.2 Metadata Functions — remaining (Parser ~L4410-L4420)

- [x] APP_NAME through PARSENAME — 32 functions done (builtins.js)
- [ ] `SCHEMA_ID([schema_name])` (Parser ~L4411)
- [ ] `SCHEMA_NAME([schema_id])` (Parser ~L4412)
- [ ] `SCOPE_IDENTITY()` (Parser ~L4413)
- [ ] `SERVERPROPERTY(property)` (Parser ~L4414)
- [ ] `STATS_DATE(object_id, stats_id)` (Parser ~L4415)
- [ ] `TYPE_ID(type_name)` (Parser ~L4416)
- [ ] `TYPE_NAME(type_id)` (Parser ~L4417)
- [ ] `TYPEPROPERTY(type, property)` (Parser ~L4418)

### 5.3 String Functions (Parser ~L4422-L4491)

- [ ] `ASCII(character_expression)` (~L4423)
- [ ] `CHAR(integer_expression)` (~L4425)
- [ ] `CHARINDEX(expression, expression [, start])` (~L4427)
- [ ] `CONCAT(string1, string2 [, ...])` (~L4429)
- [ ] `CONCAT_WS(separator, string1, string2 [, ...])` (~L4431)
- [ ] `DIFFERENCE(string1, string2)` (~L4433)
- [ ] `FORMAT(value, format [, culture])` (~L4435)
- [ ] `LEFT(string, count)` (~L4437)
- [ ] `LEN(string)` (~L4439)
- [ ] `LOWER(string)` (~L4441)
- [ ] `LTRIM(string)` (~L4443)
- [ ] `NCHAR(integer)` (~L4445)
- [ ] `PATINDEX(pattern, string)` (~L4447)
- [ ] `QUOTENAME(string [, delimiter])` (~L4449)
- [ ] `REPLACE(string, old, new)` (~L4451)
- [ ] `REPLICATE(string, count)` (~L4453)
- [ ] `REVERSE(string)` (~L4455)
- [ ] `RIGHT(string, count)` (~L4457)
- [ ] `RTRIM(string)` (~L4459)
- [ ] `SOUNDEX(string)` (~L4461)
- [ ] `SPACE(count)` (~L4463)
- [ ] `STR(float [, length [, decimal]])` (~L4465)
- [ ] `STRING_ESCAPE(text, type)` (~L4469)
- [ ] `STUFF(string, start, length, replacement)` (~L4471)
- [ ] `SUBSTRING(string, start, length)` (~L4473)
- [ ] `TRANSLATE(string, from_chars, to_chars)` (~L4477)
- [ ] `TRIM([chars FROM] string)` (~L4479)
- [ ] `UNICODE(character)` (~L4483)
- [ ] `UPPER(string)` (~L4485)

### 5.4 Date/Time Functions (Parser ~L4583-L4649)

- [ ] `CURRENT_DATE` (~L4584)
- [ ] `CURRENT_TIMESTAMP` (~L4586)
- [ ] `CURRENT_TIMEZONE()` (~L4588)
- [ ] `CURRENT_TIMEZONE_ID()` (~L4590)
- [ ] `DATE_BUCKET(datepart, number, date [, origin])` (~L4592)
- [ ] `DATEADD(datepart, number, date)` (~L4594)
- [ ] `DATEDIFF(datepart, start, end)` (~L4596)
- [ ] `DATEDIFF_BIG(datepart, start, end)` (~L4598)
- [ ] `DATEFROMPARTS(year, month, day)` (~L4600)
- [ ] `DATENAME(datepart, date)` (~L4602)
- [ ] `DATEPART(datepart, date)` (~L4604)
- [ ] `DATETIME2FROMPARTS(year, month, day, hour, minute, seconds, fractions, precision)` (~L4608)
- [ ] `DATETIMEFROMPARTS(year, month, day, hour, minute, seconds, milliseconds)` (~L4610)
- [ ] `DATETIMEOFFSETFROMPARTS(...)` (~L4612)
- [ ] `DATETRUNC(datepart, date)` (~L4614)
- [ ] `DAY(date)` (~L4616)
- [ ] `EOMONTH(date [, months_to_add])` (~L4618)
- [ ] `GETDATE()` (~L4620)
- [ ] `GETUTCDATE()` (~L4622)
- [ ] `ISDATE(expression)` (~L4624)
- [ ] `MONTH(date)` (~L4632)
- [ ] `SMALLDATETIMEFROMPARTS(year, month, day, hour, minute)` (~L4636)
- [ ] `SWITCHOFFSET(datetimeoffset, timezone)` (~L4638)
- [ ] `SYSDATETIME()` (~L4640)
- [ ] `SYSDATETIMEOFFSET()` (~L4641)
- [ ] `SYSUTCDATETIME()` (~L4642)
- [ ] `TIMEFROMPARTS(hour, minute, seconds, fractions, precision)` (~L4644)
- [ ] `TODATETIMEOFFSET(expression, timezone)` (~L4646)
- [ ] `YEAR(date)` (~L4648)

### 5.5 Math Functions (Parser ~L4678-L4722)

- [ ] `ABS(numeric)` (~L4679)
- [ ] `ACOS(float)` (~L4681)
- [ ] `ASIN(float)` (~L4683)
- [ ] `ATAN(float)` (~L4685)
- [ ] `ATN2(float, float)` (~L4687)
- [ ] `CEILING(numeric)` (~L4689)
- [ ] `COS(float)` (~L4691)
- [ ] `COT(float)` (~L4693)
- [ ] `DEGREES(numeric)` (~L4695)
- [ ] `EXP(float)` (~L4697)
- [ ] `FLOOR(numeric)` (~L4699)
- [ ] `LOG(float [, base])` (~L4701)
- [ ] `LOG10(float)` (~L4703)
- [ ] `PI()` (~L4705)
- [ ] `POWER(float, y)` (~L4707)
- [ ] `RADIANS(numeric)` (~L4709)
- [ ] `RAND([seed])` (~L4711)
- [ ] `ROUND(numeric, length [, function])` (~L4713)
- [ ] `SIGN(numeric)` (~L4715)
- [ ] `SIN(float)` (~L4717)
- [ ] `SQRT(float)` (~L4719)
- [ ] `SQUARE(float)` (~L4720)
- [ ] `TAN(float)` (~L4722)

### 5.6 System Functions (Parser ~L4493-L4548)

- [ ] `BINARY_CHECKSUM(* | expression, ...)` (~L4494)
- [ ] `CHECKSUM(* | expression, ...)` (~L4496)
- [ ] `COMPRESS(expression)` (~L4498)
- [ ] `CONNECTIONPROPERTY(property)` (~L4500)
- [ ] `CONTEXT_INFO()` (~L4502)
- [ ] `CURRENT_REQUEST_ID()` (~L4504)
- [ ] `CURRENT_TRANSACTION_ID()` (~L4506)
- [ ] `DECOMPRESS(expression)` (~L4508)
- [ ] `ERROR_LINE()` (~L4510)
- [ ] `ERROR_MESSAGE()` (~L4512)
- [ ] `ERROR_NUMBER()` (~L4514)
- [ ] `ERROR_PROCEDURE()` (~L4516)
- [ ] `ERROR_SEVERITY()` (~L4518)
- [ ] `ERROR_STATE()` (~L4520)
- [ ] `FORMATMESSAGE(msg_number | msg_string, params)` (~L4522)
- [ ] `GET_FILESTREAM_TRANSACTION_CONTEXT()` (~L4524)
- [ ] `GETANSINULL([database])` (~L4526)
- [ ] `HOST_ID()` (~L4528)
- [ ] `HOST_NAME()` (~L4530)
- [ ] `ISNULL(expression, replacement)` (~L4532)
- [ ] `ISNUMERIC(expression)` (~L4534)
- [ ] `MIN_ACTIVE_ROWVERSION()` (~L4536)
- [ ] `NEWID()` (~L4538)
- [ ] `NEWSEQUENTIALID()` (~L4540)
- [ ] `ROWCOUNT_BIG()` (~L4542)
- [ ] `SESSION_CONTEXT(N'key')` (~L4544)
- [ ] `XACT_STATE()` (~L4548)

### 5.7 JSON Functions (Parser ~L4662-L4675)

- [ ] `ISJSON(expression)` (~L4663)
- [ ] `JSON_OBJECT(key:value, ...)` (~L4665)
- [ ] `JSON_ARRAY(value, ...)` (~L4667)
- [ ] `JSON_VALUE(expression, path)` (~L4669)
- [ ] `JSON_QUERY(expression, path)` (~L4671)
- [ ] `JSON_MODIFY(expression, path, new_value)` (~L4673)
- [ ] `JSON_PATH_EXISTS(expression, path)` (~L4675)

### 5.8 Logical Functions (Parser ~L4724-L4727)

- [ ] `GREATEST(expression, expression, ...)` (~L4725)
- [ ] `LEAST(expression, expression, ...)` (~L4727)

### 5.9 Security Functions (Parser ~L4730-L4782)

- [ ] `CERTENCODED(cert_id)` (~L4731)
- [ ] `CERTPRIVATEKEY(cert_id [, password])` (~L4733)
- [ ] `CURRENT_USER` (~L4735)
- [ ] `DATABASE_PRINCIPAL_ID([principal_name])` (~L4737)
- [ ] `HAS_DBACCESS(database_name)` (~L4739)
- [ ] `HAS_PERMS_BY_NAME(securable, class, permission)` (~L4741)
- [ ] `IS_MEMBER(group_or_role)` (~L4743)
- [ ] `IS_ROLEMEMBER(role [, principal])` (~L4745)
- [ ] `IS_SRVROLEMEMBER(role [, login])` (~L4747)
- [ ] `LOGINPROPERTY(login, property)` (~L4749)
- [ ] `ORIGINAL_LOGIN()` (~L4751)
- [ ] `PERMISSIONS([objectid [, column]])` (~L4753)
- [ ] `PWDENCRYPT(password)` (~L4757)
- [ ] `PWDCOMPARE(clear_text, hashed_password)` (~L4759)
- [ ] `SESSION_USER` (~L4761)
- [ ] `SESSIONPROPERTY(option)` (~L4763)
- [ ] `SUSER_ID([login])` (~L4765)
- [ ] `SUSER_NAME([server_user_id])` (~L4767)
- [ ] `SUSER_SID([login])` (~L4769)
- [ ] `SUSER_SNAME([server_user_sid])` (~L4771)
- [ ] `SYSTEM_USER` (~L4773)
- [ ] `USER` (~L4775)
- [ ] `USER_ID([user])` (~L4777)
- [ ] `USER_NAME([id])` (~L4779)

### 5.10 Cursor Functions (Parser ~L4560-L4564)

- [ ] `@@CURSOR_ROWS` (~L4561)
- [ ] `@@FETCH_STATUS` (~L4563)
- [ ] `CURSOR_STATUS('local|global|variable', cursor_name_or_var)` (~L4564)

### 5.11 Data Type Functions (Parser ~L4570-L4580)

- [ ] `DATALENGTH(expression)` (~L4571)
- [ ] `IDENT_CURRENT(table_name)` (~L4573)
- [ ] `IDENT_INCR(table_name)` (~L4575)
- [ ] `IDENT_SEED(table_name)` (~L4577)
- [ ] `IDENTITY(data_type [, seed, increment])` (~L4579)
- [ ] `SQL_VARIANT_PROPERTY(expression, property)` (~L4580)

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

- [ ] `CREATE TABLE name (column_definitions)` (Parser L1479)
- [ ] Column definition — `col_name data_type [NULL|NOT NULL]` (Parser L1485)
- [ ] Column definition — `DEFAULT expression` (Parser L1487)
- [ ] Column definition — `IDENTITY [(seed, increment)]` (Parser L1488)
- [ ] Column definition — `COLLATE collation_name` (Parser L1489)
- [ ] Column definition — `CONSTRAINT name` (Parser L1490)
- [ ] `PRIMARY KEY` constraint (Parser L1500)
- [ ] `UNIQUE` constraint (Parser L1502)
- [ ] `FOREIGN KEY ... REFERENCES table (col)` (Parser L1504)
- [ ] `CHECK (expression)` constraint (Parser L1510)
- [ ] `CLUSTERED` / `NONCLUSTERED` (Parser L1501)
- [ ] `CREATE TABLE ... AS FileTable` (Parser L1520)
- [ ] Table-level `PRIMARY KEY (col, ...)` (Parser L1530)
- [ ] Table-level `UNIQUE (col, ...)` (Parser L1535)
- [ ] Table-level `FOREIGN KEY (col) REFERENCES ...` (Parser L1540)
- [ ] Table-level `CHECK (expression)` (Parser L1545)
- [ ] `ON filegroup` (Parser L1560)
- [ ] `TEXTIMAGE_ON filegroup` (Parser L1565)
- [ ] Column computed definitions — `col AS expression [PERSISTED]` (Parser L1491)
- [ ] Temporal table — `WITH (SYSTEM_VERSIONING = ON)` (Parser L1570)

### 6.2 ALTER TABLE (Parser L573-L650)

- [ ] `ALTER TABLE table ADD column_definition` (Parser L574)
- [ ] `ALTER TABLE table ALTER COLUMN col data_type [NULL|NOT NULL]` (Parser L580)
- [ ] `ALTER TABLE table DROP COLUMN col` (Parser L585)
- [ ] `ALTER TABLE table ADD CONSTRAINT ...` (Parser L590)
- [ ] `ALTER TABLE table DROP CONSTRAINT name` (Parser L595)
- [ ] `ALTER TABLE table ENABLE|DISABLE TRIGGER` (Parser L600)
- [ ] `ALTER TABLE table CHECK|NOCHECK CONSTRAINT` (Parser L605)
- [ ] `ALTER TABLE table SWITCH PARTITION` (Parser L610)
- [ ] `ALTER TABLE table REBUILD` (Parser L620)
- [ ] `ALTER TABLE table SET (LOCK_ESCALATION = ...)` (Parser L625)

### 6.3 DROP Statements (Parser L2076-L2125)

- [ ] `DROP TABLE [IF EXISTS] name` (Parser L2107)
- [ ] `DROP VIEW [IF EXISTS] name` (Parser L2110)
- [ ] `DROP PROCEDURE [IF EXISTS] name` (Parser L2090)
- [ ] `DROP FUNCTION [IF EXISTS] name` (Parser L2085)
- [ ] `DROP INDEX name ON table` (Parser L2076)
- [ ] `DROP TRIGGER [IF EXISTS] name` (Parser L2113)
- [ ] `DROP DATABASE [IF EXISTS] name` (Parser L2082)
- [ ] `DROP SCHEMA name` (Parser L2098)
- [ ] `DROP SEQUENCE name` (Parser L2101)
- [ ] `DROP TYPE name` (Parser L2116)
- [ ] `DROP USER name` (Parser L2119)
- [ ] `DROP LOGIN name` (Parser L2088)
- [ ] `DROP SYNONYM name` (Parser L2104)
- [ ] `DROP STATISTICS name` (Parser L2095)
- [ ] Other DROP statements (Parser L2076-L2125)

### 6.4 CREATE INDEX (Parser L1284-L1340)

- [ ] `CREATE [UNIQUE] [CLUSTERED|NONCLUSTERED] INDEX name ON table (cols)` (Parser L1284)
- [ ] `INCLUDE (col, ...)` (Parser L1290)
- [ ] `WHERE filter_predicate` (filtered index) (Parser L1295)
- [ ] `WITH (options)` — PAD_INDEX, FILLFACTOR, etc. (Parser L1300)
- [ ] `ON filegroup` (Parser L1310)
- [ ] `CREATE COLUMNSTORE INDEX` (Parser L1320)

### 6.5 CREATE/ALTER Procedure (Parser L2387-L2430)

- [ ] `CREATE [OR ALTER] PROCEDURE name` (Parser L2387)
- [ ] Parameter definitions — `@param data_type [= default] [OUTPUT]` (Parser L2390)
- [ ] `WITH options` — RECOMPILE, ENCRYPTION, EXECUTE AS (Parser L2395)
- [ ] `AS BEGIN ... END` / `AS sql_clauses` (Parser L2400)
- [ ] `ALTER PROCEDURE name` (Parser L2387)

### 6.6 CREATE/ALTER Function (Parser L2433-L2470)

- [ ] `CREATE [OR ALTER] FUNCTION name` (Parser L2433)
- [ ] Parameter definitions (Parser L2435)
- [ ] `RETURNS data_type` — scalar function (Parser L2440)
- [ ] `RETURNS TABLE` — inline table-valued function (Parser L2445)
- [ ] `RETURNS @table TABLE (col_defs)` — multi-statement table-valued (Parser L2450)
- [ ] Function body — `BEGIN ... RETURN expression END` (Parser L2456)
- [ ] `WITH options` — SCHEMABINDING, ENCRYPTION, etc. (Parser L2460)

### 6.7 CREATE VIEW (Parser L2570-L2590)

- [ ] `CREATE [OR ALTER] VIEW name AS select_statement` (Parser L2570)
- [ ] `WITH SCHEMABINDING` (Parser L2575)
- [ ] `WITH ENCRYPTION` (Parser L2576)
- [ ] `WITH VIEW_METADATA` (Parser L2577)
- [ ] `WITH CHECK OPTION` (Parser L2585)
- [ ] Column name list (Parser L2573)

### 6.8 CREATE/ALTER Trigger (Parser L2400-L2432)

- [ ] `CREATE [OR ALTER] TRIGGER name ON table` (DML trigger) (Parser L2405)
- [ ] `AFTER INSERT|UPDATE|DELETE` (Parser L2410)
- [ ] `INSTEAD OF INSERT|UPDATE|DELETE` (Parser L2411)
- [ ] `FOR INSERT|UPDATE|DELETE` (Parser L2412)
- [ ] Trigger body — `AS sql_clauses` (Parser L2415)
- [ ] DDL trigger — `ON DATABASE|ALL SERVER` (Parser L2422)
- [ ] DDL trigger event types (Parser L2425)

### 6.9 Other DDL

- [ ] `CREATE SCHEMA name [AUTHORIZATION owner]` (Parser L1440)
- [ ] `CREATE TYPE name` (Parser L1460)
- [ ] `CREATE SEQUENCE name` (Parser L1380)
- [ ] `CREATE SYNONYM name FOR object` (Parser L1450)
- [ ] `TRUNCATE TABLE name` (Parser L236)
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
- [ ] `CURSOR` type
- [ ] `HIERARCHYID` type
- [ ] `SQL_VARIANT` type
- [ ] `TABLE` type (for table-valued parameters)
- [ ] `XML [(schema_collection)]` type
- [ ] `GEOGRAPHY` type
- [ ] `GEOMETRY` type
- [ ] `ROWVERSION` type
- [ ] `TIMESTAMP` type
- [ ] `UNIQUEIDENTIFIER` type
- [ ] `SYSNAME` type
- [ ] User-defined types (reference by name)
- [ ] `DOUBLE PRECISION` synonym
- [ ] `IDENTITY(seed, increment)` specification

### 7.2 DBCC Commands (Parser L3635-L3652)

- [ ] `DBCC CHECKALLOC` (Parser L3637)
- [ ] `DBCC CHECKCATALOG` (Parser L3638)
- [ ] `DBCC CHECKCONSTRAINTS` (Parser L3639)
- [ ] `DBCC CHECKDB` (Parser L3640)
- [ ] `DBCC CHECKFILEGROUP` (Parser L3641)
- [ ] `DBCC CHECKTABLE` (Parser L3642)
- [ ] `DBCC CLEANTABLE` (Parser L3643)
- [ ] `DBCC CLONEDATABASE` (Parser L3644)
- [ ] `DBCC DBREINDEX` (Parser L3645)
- [ ] `DBCC DLL_FREE` (free DLL) (Parser L3646)
- [ ] `DBCC DROPCLEANBUFFERS` (Parser L3647)
- [ ] `DBCC PDW_SHOWSPACEUSED` (Parser L3648)
- [ ] `DBCC PROCCACHE` (Parser L3649)
- [ ] `DBCC SHOWCONTIG` (Parser L3650)
- [ ] `DBCC SHRINKLOG` (Parser L3652)

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
- [ ] `kill_statement` — `KILL session_id` (Parser L359)
- [ ] `reconfigure_statement` — `RECONFIGURE [WITH OVERRIDE]` (Parser L361)
- [ ] `shutdown_statement` — `SHUTDOWN [WITH NOWAIT]` (Parser L365)
- [ ] `checkpoint_statement` — `CHECKPOINT [duration]` (Parser L352)
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
- [x] **Data Types (core)** — exact numerics, approximate numerics, char strings, unicode strings, binary strings, date/time (data_types.js)
- [x] **Built-in Metadata Functions** — 32 functions (builtins.js)
- [x] **ODBC Scalar Functions (partial)** — 17 functions (odbc_scalar_functions.js)
- [x] **CAST** — `CAST(expression AS data_type)` (conversion_functions.js)
