; highlights.scm — tree-sitter-tsql syntax highlighting queries

; ─── Keywords ──────────────────────────────────────────
(select) @keyword
(groupby_) @keyword

; ─── Operators ─────────────────────────────────────────
(comparison_operator) @operator
(assignment_operator) @operator
(PLUS) @operator
(asterisk) @operator

; ─── Literals ──────────────────────────────────────────
(string_lit) @string
(decimal_) @number
(float_) @number
(real_) @number
(money_) @number
(binary) @number

; ─── Functions ─────────────────────────────────────────
(scalar_function_name) @function
(count_) @function.builtin
(ranking_windowed_function) @function

; ─── Identifiers / Variables ───────────────────────────
(LOCAL_ID_) @variable
(local_id_) @variable

; ─── Types ─────────────────────────────────────────────
(data_type) @type

; ─── Null ──────────────────────────────────────────────
(null_) @constant.builtin
