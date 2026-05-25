# Taming tree-sitter: how to shrink million-line parsers

A **2.3-million-line parser.c** and **19MB .wasm binary** almost always trace back to combinatorial state explosion caused by rules with too many `optional()`, `repeat()`, and `choice()` constructs packed into single productions. The fix is structural: break monolithic rules into hidden sub-rules, use keyword extraction, define extras as named rules, and systematically profile state counts with `--report-states-for-rule`. The tree-sitter-c grammar demonstrated a **20% state reduction from refactoring just two rules**. You are not alone in this problem — tree-sitter-sql hit 83MB, tree-sitter-zig reached 25MB, and tree-sitter-ocaml produced a 19MB .wasm — and each case was addressed through grammar restructuring, not CLI flags or configuration.

## Why parser.c files explode to millions of lines

The generated `parser.c` contains two massive data structures: a dense 2D parse table array `ts_parse_table[LARGE_STATE_COUNT][SYMBOL_COUNT]` and a lexer function `ts_lex` implemented as a large switch-case DFA. Both grow in proportion to the grammar's state count, which is determined by the number of distinct LR(1) item sets the parser generator produces.

**The fundamental mechanism is combinatorial.** Each `optional()` in a rule doubles the number of possible parse paths through that rule. Multiple optionals compound exponentially: *n* optionals create up to **2^n paths**. When combined with `repeat()` and `choice()` in a single production, the cross-product of states grows rapidly. The tree-sitter-c grammar's `type_definition` rule — containing one `optional()`, two `repeat()` calls, and a `commaSep1()` in a single `seq()` — generated **295 states** for that one rule alone.

The `LARGE_STATE_COUNT` value in parser.c indicates how many states use the dense array representation. This single metric is the primary driver of file size and compile time because each "large state" occupies `SYMBOL_COUNT` entries in a 2D array. Reducing `LARGE_STATE_COUNT` has the most dramatic effect on output size. The remaining states use a compressed representation that contributes far less to file size.

Unicode character class expansion is another major contributor. One grammar that expanded `\p{L}` into a full Unicode character set saw parser.c jump from **850KB to 2.3MB**, with 49,000 of 52,000 lines in the `ts_lex` function alone. Max Brunsfeld explicitly recommends against full Unicode expansion — instead, accept all non-ASCII characters as a simple range.

## The seven anti-patterns that cause state explosion

Real-world grammars that balloon to tens of megabytes share common structural problems. These anti-patterns, documented across GitHub issues, the tree-sitter wiki, and community blog posts, are the root causes of oversized parsers:

**1. Monolithic rules with multiple optionals and repeats.** The single most destructive pattern. A rule like `seq(optional(A), B, repeat(C), optional(D), repeat(E), F)` creates a combinatorial explosion because the parser must track every possible combination of which optionals are present and how many repeats occurred. The tree-sitter-sql grammar's `select_statement` — with window, from, group_by, having, and other optional clauses — alone accounted for **54MB** of an 83MB parser.c.

**2. Inline patterns in `extras`.** The official documentation explicitly warns: "When adding more complicated tokens to extras, it's preferable to associate the pattern with a rule. This way, you avoid the lexer inlining this pattern in a bunch of spots, which can **dramatically reduce the parser size**." Defining a comment regex directly in the extras array causes it to be duplicated in every parse state's lexer code.

**3. Deeply nested expression hierarchies without flattening.** Language specifications often encode expression precedence with 20+ levels of indirection. Directly translating this into tree-sitter creates unnecessary states. The documentation explicitly addresses this: flatten expression hierarchies using `prec.left()` and `prec.right()` on a single `binary_expression` rule.

**4. Missing keyword extraction.** Without a `word` token, tree-sitter generates separate lexer branches for every keyword (`if`, `for`, `return`, `while`, etc.). The official docs state that keyword extraction "allows Tree-sitter to generate a smaller, simpler lexing function, which means that the **parser will compile much more quickly**."

**5. Excessive conflicts entries.** The tree-sitter-d grammar had **198 conflicts**, and the Verilog grammar had ~200 lines of conflicts. While the `conflicts` array doesn't dramatically increase state count (it allows multiple actions per existing state), it increases parse table density and runtime GLR forking. Many conflicts can be resolved with `prec()` or `prec.left()`/`prec.right()` instead.

**6. Duplicate token definitions.** Analysis of the 83MB tree-sitter-sql parser found 1,153 total token values but only **546 unique values** — `=` appeared 54 times, `,` appeared 42 times, `(` and `)` each appeared 38 times. Consolidating token definitions reduces table size.

**7. Excessive `inline` rule usage.** While `inline` can reduce conflicts by eliminating intermediate non-terminals, inlining a rule used in many places creates a multiplicative increase in states. Max Brunsfeld clarified in Discussion #955: "Inlining is different [from hiding], because it actually changes the parsing process, affects where ambiguities can or can't occur." Use it surgically, not broadly.

## How each DSL construct affects parser size

Understanding the precise impact of each tree-sitter DSL construct is critical for optimization. The effects vary significantly.

**`prec()`, `prec.left()`, `prec.right()`** resolve LR(1) conflicts at parser-generation time, which *reduces* state count by eliminating ambiguity. These are free optimizations — use them liberally. **`prec.dynamic()`**, by contrast, operates at runtime only and has **zero effect on parse table size**. It guides GLR conflict resolution for genuinely ambiguous parses declared in the `conflicts` array.

**`choice()` with many alternatives** creates new parse states proportional to the number of alternatives, especially when followed by different continuations. Binary expressions with 18 operators typically create 165–215 states — high but manageable. The real danger is `choice()` combined with other constructs in long `seq()` chains.

**`token()`** groups a complex regex into a single terminal, preventing tree-sitter from creating intermediate parse states for each component. This directly reduces both state count and lexer complexity.

**`optional()` and `repeat()`** are the primary state multipliers. Each `optional()` effectively adds a `choice(rule, BLANK)`, and multiple optionals/repeats in one production compound multiplicatively. **`repeat1()`** is slightly less expensive than `repeat()` since it avoids the zero-match case.

The `conflicts` array tells the parser generator to retain both conflicting actions in a state rather than erroring. This doesn't add many new states but increases the density of existing state entries. Each conflict pair enables runtime GLR forking, which impacts runtime performance more than parser size.

| Construct | Parse table size impact | Best practice |
|-----------|------------------------|---------------|
| `prec()` / `prec.left()` / `prec.right()` | ↓ Reduces (resolves conflicts) | Use liberally for operators |
| `prec.dynamic()` | No effect on table | Use only with `conflicts` entries |
| `choice()` (many alternatives) | ↑ Proportional to alternatives | Acceptable; the real issue is nesting |
| `optional()` / `repeat()` in sequence | ↑↑ Multiplicative per element | Extract into hidden sub-rules |
| `token()` | ↓ Fewer lexer states | Use for multi-part terminals |
| `word` token | ↓↓ Major lexer reduction | Always define for keyword languages |
| `extras` as named rules | ↓↓ Prevents duplication | Always use named rules for complex extras |
| `inline` array | ↑ or ↓ (context-dependent) | Test state count before/after |
| `conflicts` array | Slight ↑ in table density | Prefer `prec()` when possible |

## The optimization workflow that works

The tree-sitter wiki documents a concrete, proven optimization workflow demonstrated on the C grammar. This is the systematic approach to reducing your 2.3M-line parser.c:

**Step 1: Profile with `--report-states-for-rule`.** Run `tree-sitter generate --report-states-for-rule -` to see every rule and its state count, sorted by largest. In tree-sitter-c v0.20.5, this revealed `for_statement` at 318 states and `type_definition` at 295 states as the top offenders. Your grammar's worst rules are almost certainly responsible for the majority of your state count.

**Step 2: Extract hidden sub-rules from the largest rules.** Take each high-state rule and break its `seq()` into smaller hidden rules prefixed with `_`. For example, `for_statement` was split so its body became `_for_statement_body`. The `type_definition` was split into `_type_definition_type` and `_type_definition_declarators`. The result: **STATE_COUNT dropped from 2,243 to 1,825** (18% reduction) and **LARGE_STATE_COUNT from 666 to 510** (23% reduction). Crucially, "not only did `for_statement` and `type_definition` drop from #1/#2 to #7/#10, but states for everything else went down as a consequence."

**Step 3: Add keyword extraction.** Define `word: $ => $.identifier` (or your language's identifier rule). This consolidates all keyword lexing into a single path, reducing both `ts_lex` function size and parse states.

**Step 4: Fix extras definitions.** Replace any inline regex patterns in `extras` with named grammar rules. Change `extras: $ => [/\s/, token(seq("//", /.*/))]` to `extras: $ => [/\s/, $.comment]` with `comment` defined as a regular rule.

**Step 5: Iterate.** After each change, regenerate and check `STATE_COUNT` and `LARGE_STATE_COUNT` with `grep "#define.*STATE" src/parser.c`. Some refactorings can *increase* state count — the wiki warns that "refactoring is tricky and requires some creativity." Monitor the numbers across every change.

**Step 6: Consider architectural changes for extreme cases.** Tree-sitter-markdown splits into **two separate grammars** (block structure and inline content), each producing a smaller parser that coordinates via `ts_parser_set_included_ranges`. For very complex languages, targeting a specific dialect rather than the entire language (as relevant for SQL) can eliminate the combinatorial explosion from rarely-used optional clauses.

## Real-world grammars and how they manage complexity

Major tree-sitter grammars offer instructive patterns for managing complexity at scale. The **C grammar** (~3.7MB parser.c, ~2,243 states before optimization) uses 7 `inline` rules for supertype categories like `_statement` and `_top_level_item`, 8 conflict pairs for the classic declaration-vs-expression ambiguity, and 16+ precedence levels for operators. The **C++ grammar** extends C and adds 15+ additional conflict pairs for template ambiguity, concept constraints, and structured bindings — each interaction between inherited C rules and new C++ rules compounds state count.

**TypeScript** (~8.7MB parser.c) extends JavaScript using `grammar(JavaScript, {...})` and adds conflicts for type annotations, generics, and JSX interaction. **Ruby** offloads significant complexity to an external scanner written in C, handling heredocs, string interpolation, and regex-vs-division disambiguation outside the grammar itself. This is a powerful technique: external scanners handle context-sensitive lexing that would otherwise require many grammar rules and conflicts.

For comparison, the most extreme known cases are **tree-sitter-sql at 83MB** (driven by SELECT's many optional clauses interacting with subqueries) and **tree-sitter-zig at 25MB**. The OCaml grammar produced a **19MB .wasm file** — the same size as your binary — which was documented as "excessively large" in tree-sitter-ocaml issue #30. The Julia grammar's .wasm started at 7MB and was reduced to 3MB through dependency updates, though it remained problematic.

## CLI flags and tools for diagnosis

Tree-sitter provides several built-in diagnostic capabilities, though **no flags exist to directly limit or reduce state table size** — all optimization must happen in the grammar itself.

- **`tree-sitter generate --report-states-for-rule -`** is the primary profiling tool, showing state counts per rule
- **`tree-sitter generate --report-states-for-rule *`** shows full item sets for all rules (very verbose)
- **`tree-sitter generate --log`** prints detailed generation information including error recovery tokens, keyword extraction results, and state split reasons
- **`tree-sitter generate --json-summary`** reports conflicts in machine-readable JSON format
- **`tree-sitter parse --debug`** outputs step-by-step lexing and parsing traces
- **`tree-sitter parse --debug-graph`** generates `log.html` with SVG visualizations of the parse stack

The `--disable-optimization` flag exists but does the opposite of what you want — it disables the built-in state merging compression that already reduces states by ~57%. No optimization-increasing flags exist. External tools include the tree-sitter playground (web-based), AST Explorer (astexplorer.net), and editor-integrated inspectors in Neovim (`TSPlaygroundToggle`) and Emacs (`treesit-explore-mode`).

## Conclusion

Your 2.3M-line parser.c is not a tree-sitter limitation — it is a grammar structure problem with known solutions. The path forward is diagnostic-driven: run `--report-states-for-rule -` to identify which rules contribute the most states, then systematically extract hidden sub-rules from those top offenders. The C grammar's experience — **20% total state reduction from refactoring just two rules** — suggests your grammar likely has a handful of rules responsible for the majority of the bloat. Combine this with keyword extraction (`word` token), named extras rules, and `token()` for complex terminals. For truly extreme cases, consider splitting the grammar into sublanguages or targeting a specific dialect. The key insight from the tree-sitter community is that state explosion is always multiplicative: many small optionals in one rule are far more expensive than the same optionals factored into separate sub-rules, because factoring breaks the combinatorial cross-product.