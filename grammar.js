const precedences = require('./grammar/precedences.js');
const built_in_functions = require('./grammar/builtins.js');
const odbc_scalar_functions = require('./grammar/functions/odbc_scalar_functions.js');
const aggregate_window_functions = require('./grammar/functions/aggregate_functions.js');
const analytic_windowed_functions = require('./grammar/functions/analytic_windowed_functions.js');
const bit_manipulation_functions = require('./grammar/functions/bit_manipulation_functions.js');
const collation_functions = require('./grammar/functions/collation_functions.js');
const configuration_functions = require('./grammar/functions/configuration_functions.js');
const conversion_functions = require('./grammar/functions/conversion_functions.js');
const cursor_functions = require('./grammar/functions/cursor_functions.js');
const datatype_functions = require('./grammar/functions/datatype_functions.js');
const datetime_functions = require('./grammar/functions/datetime_functions.js');
const json_functions = require('./grammar/functions/json_functions.js');
const logical_functions = require('./grammar/functions/logical_functions.js');
const math_functions = require('./grammar/functions/math_functions.js');
const security_functions = require('./grammar/functions/security_functions.js');
const string_functions = require('./grammar/functions/string_functions.js');
const system_functions = require('./grammar/functions/system_functions.js');
const data_type = require('./grammar/data_types.js');

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

//
// LEXER https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlLexer.g4
//

//TODO doublecheck * and + semantics
const SEMI = token(';');
//FULLWIDTH handling?
const ID                = token(/[A-Za-z_#][A-Za-z_#$@0-9]*/);
const SQUARE_BRACKET_ID = token(/\[[^\]]+\]/);
const DOUBLE_QUOTE_ID   = token(/"[^"]*"/);
const LOCAL_ID          = token(/@[A-Za-z_$@#0-9]+/);
const INT               = token(/[0-9]+/);
const DOT               = token(/\./);
const STRING            = token(/N?'([^']|'')*'/);
const DECIMAL           = token(/[0-9]+/);
const DOUBLE_COLON      = token('::');
const DEC_DOT_DEC       = token(/([0-9]+\.[0-9]+|[0-9]+\.|\.?[0-9]+)/);
const COMMA             = token(',');

//
// UTILS
//
const parens = (...rule) => seq('(', ...rule, ')');

//
// PARSER https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4
//

module.exports = grammar({
  name: "TSQL",

  word: $ => $._word,

  conflicts: $ => [
    [$.batch]
    ,[$.table_source_item]
    ,[$.table_source]
    ,[$.output_dml_list_elem, $.full_column_name]
    ,[$.top_clause, $.bracket_expression]
  ],

  extras: $ => [
    /\s/,
    $.comment,
  ],

  ...precedences,

  rules: {

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L35
    tsql_file: $ => choice(
      repeat($.batch)
      ,seq($.execute_body_batch, repeat($.go_statement))
    ),

    batch: $ => choice(
      prec(1,$.go_statement)
      ,seq(optional($.execute_body_batch),choice($.go_statement, repeat1($.sql_clauses)), repeat($.go_statement))
      ,//TODO seq($.batch_level_statement, repeat($.go_statement))
       //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L46-L51
    ),

    // Comments
    // Single-line: -- until end of line
    // Multi-line:  /* ... */
    comment: $ => token(choice(
      seq('--', /.*/)
      ,seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/sql-server-utilities-statements-go?view=sql-server-ver16
    go_statement: $ => seq(token(/GO/i), optional(field("count", $.integer))),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3145
    execute_body_batch: $ => prec.left(seq(
      $.func_proc_name_server_database_schema, optional(seq($.execute_statement_arg, repeat(seq(token(','), $.execute_statement_arg)))), optional(SEMI)
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5145
    func_proc_name_server_database_schema: $ => choice(
      seq(optional(field('server', $.id_)), DOT, optional(field('database', $.id_)), DOT, optional(field('schema', $.id_)), DOT, field('procedure', $.id_))
      ,$.func_proc_name_database_schema
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5140
    func_proc_name_database_schema: $ => choice(
      seq(optional(field('database', $.id_)), DOT, optional(field('schema', $.id_)), DOT, field('procedure', $.id_))
      ,$.func_proc_name_schema
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5136
    func_proc_name_schema: $ => prec.right(seq(optional(seq(field('schema',$.id_), DOT)), field('procedure', $.id_))),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3158
    execute_statement_arg: $ => choice(
      prec.left(seq($.execute_statement_arg_unnamed, repeat(seq(token(','), $.execute_statement_arg))))   //Unnamed params can continue unnamed
      ,prec.left(seq($.execute_statement_arg_named, repeat(seq(token(','), $.execute_statement_arg_named)))) //Named can only be continued by unnamed
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3163
    execute_statement_arg_named: $ => seq(
      field('name', LOCAL_ID), token('='), field('value', $.execute_parameter)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3167
    execute_statement_arg_unnamed : $ => field('value', $.execute_parameter),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3171
    execute_parameter: $ => choice(
      $.constant
      ,seq($.LOCAL_ID_, optional($.OUTPUT))
      ,$.id_
      ,$.default
      ,$.null_
    ),

    LOCAL_ID_: $ => LOCAL_ID,
    OUTPUT: $ => token(/OUT(PUT)?/i),

    default: $ => token(/DEFAULT/i),
    null_: $ => token(/NULL/i),

    constant: $ => choice(
      STRING
      ,seq(optional(token(/-/)), choice(DECIMAL)) //TODO
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5270
    ),

    //TODO batch_level_statement: $ => 'TODO', //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L46-L51

    sql_clauses: $ => prec.right(choice(
      seq($.dml_clause, optional(SEMI))
      ,seq($.cfl_statement, optional(SEMI))
      ,seq($.ddl_clause, optional(SEMI))
      ,seq($.another_statement, optional(SEMI))
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L53-L61
    )),

    // =====================
    // DDL
    // =====================

    ddl_clause: $ => choice(
      $.create_table
      ,$.create_index
      ,$.create_or_alter_procedure
      ,$.create_or_alter_function
      ,$.create_or_alter_view
      ,$.create_or_alter_trigger
      ,$.create_schema
      ,$.create_type
      ,$.create_sequence
      ,$.create_synonym
      ,$.truncate_table
      ,$.alter_database
      ,$.alter_table
      ,$.drop_table
      ,$.drop_view
      ,$.drop_procedure
      ,$.drop_function
      ,$.drop_index
      ,$.drop_trigger
      ,$.drop_database
      ,$.drop_schema
      ,$.drop_sequence
      ,$.drop_type
      ,$.drop_user
      ,$.drop_login
      ,$.drop_synonym
      ,$.drop_statistics
      ,$.create_login
      ,$.alter_login
      ,$.create_user
      ,$.alter_user
      ,$.create_role
      ,$.alter_role
      ,$.drop_role
      ,$.create_server_role
      ,$.alter_server_role
      ,$.drop_server_role
    ),

    //https://learn.microsoft.com/en-us/sql/t-sql/statements/alter-database-transact-sql-file-and-filegroup-options
    alter_database: $ => seq(
      token(/ALTER/i), token(/DATABASE/i),
      $.id_,
      choice(
        $.alter_database_add_file,
        //TODO: SET, MODIFY NAME, MODIFY FILE, ADD/REMOVE FILEGROUP, COLLATE, etc.
      )
    ),

    alter_database_add_file: $ => seq(
      token(/ADD/i), optional(token(/LOG/i)), token(/FILE/i),
      $.database_filespec, repeat(seq(token(','), $.database_filespec)),
      optional(seq(token(/TO/i), token(/FILEGROUP/i), $.id_))
    ),

    database_filespec: $ => seq(
      token('('),
      $.database_filespec_option, repeat(seq(token(','), $.database_filespec_option)),
      token(')')
    ),

    database_filespec_option: $ => choice(
      seq(token(/NAME/i), token('='), $.id_),
      seq(token(/FILENAME/i), token('='), $.string_lit),
      seq(token(/SIZE/i), token('='), $.file_size),
      seq(token(/MAXSIZE/i), token('='), choice($.file_size, token(/UNLIMITED/i))),
      seq(token(/FILEGROWTH/i), token('='), $.file_size),
    ),

    file_size: $ => seq(
      $.decimal_,
      optional(choice(token(/KB/i), token(/MB/i), token(/GB/i), token(/TB/i), token('%')))
    ),

    // =====================
    // ALTER TABLE
    // =====================

    //https://learn.microsoft.com/en-us/sql/t-sql/statements/alter-table-transact-sql
    alter_table: $ => seq(
      token(/ALTER/i), token(/TABLE/i),
      $.full_table_name,
      choice(
        $.alter_table_add,
        $.alter_table_alter_column,
        $.alter_table_drop,
        $.alter_table_check_constraint,
        $.alter_table_trigger,
        $.alter_table_switch,
        $.alter_table_rebuild,
        $.alter_table_set,
      )
    ),

    alter_table_add: $ => seq(
      token(/ADD/i),
      $.table_element, repeat(seq(',', $.table_element))
    ),

    alter_table_alter_column: $ => seq(
      token(/ALTER/i), token(/COLUMN/i),
      $.id_, $.data_type,
      optional($.null_notnull),
    ),

    alter_table_drop: $ => choice(
      seq(token(/DROP/i), token(/COLUMN/i), optional($._if_exists),
        $.id_, repeat(seq(',', $.id_))),
      seq(token(/DROP/i), token(/CONSTRAINT/i), optional($._if_exists),
        $.id_, repeat(seq(',', $.id_))),
    ),

    alter_table_check_constraint: $ => seq(
      choice(token(/CHECK/i), token(/NOCHECK/i)),
      token(/CONSTRAINT/i),
      choice(token(/ALL/i), seq($.id_, repeat(seq(',', $.id_)))),
    ),

    alter_table_trigger: $ => seq(
      choice(token(/ENABLE/i), token(/DISABLE/i)),
      token(/TRIGGER/i),
      choice(token(/ALL/i), seq($.id_, repeat(seq(',', $.id_)))),
    ),

    alter_table_switch: $ => seq(
      token(/SWITCH/i),
      optional(seq(token(/PARTITION/i), $.expression)),
      token(/TO/i), $.full_table_name,
      optional(seq(token(/PARTITION/i), $.expression)),
    ),

    alter_table_rebuild: $ => prec.right(seq(
      token(/REBUILD/i),
      optional(seq(token(/WITH/i), '(', $.alter_table_option, repeat(seq(',', $.alter_table_option)), ')')),
    )),

    alter_table_set: $ => seq(
      token(/SET/i), '(',
      token(/LOCK_ESCALATION/i), '=', choice(token(/TABLE/i), token(/AUTO/i), token(/DISABLE/i)),
      ')',
    ),

    alter_table_option: $ => seq(
      $.id_, '=', choice($.id_, $.decimal_, token(/ON/i), token(/OFF/i)),
    ),

    // =====================
    // DROP statements
    // =====================

    // Pattern A — multi-name with IF EXISTS
    drop_table: $ => seq(token(/DROP/i), token(/TABLE/i), optional($._if_exists), $.full_table_name, repeat(seq(',', $.full_table_name))),
    drop_view: $ => seq(token(/DROP/i), token(/VIEW/i), optional($._if_exists), $.full_table_name, repeat(seq(',', $.full_table_name))),
    drop_procedure: $ => seq(token(/DROP/i), choice(token(/PROC/i), token(/PROCEDURE/i)), optional($._if_exists), $.func_proc_name_server_database_schema, repeat(seq(',', $.func_proc_name_server_database_schema))),
    drop_function: $ => seq(token(/DROP/i), token(/FUNCTION/i), optional($._if_exists), $.func_proc_name_server_database_schema, repeat(seq(',', $.func_proc_name_server_database_schema))),
    drop_trigger: $ => seq(token(/DROP/i), token(/TRIGGER/i), optional($._if_exists), $.full_table_name, repeat(seq(',', $.full_table_name))),
    drop_database: $ => seq(token(/DROP/i), token(/DATABASE/i), optional($._if_exists), $.id_, repeat(seq(',', $.id_))),
    drop_sequence: $ => seq(token(/DROP/i), token(/SEQUENCE/i), optional($._if_exists), $.full_table_name, repeat(seq(',', $.full_table_name))),
    drop_synonym: $ => seq(token(/DROP/i), token(/SYNONYM/i), optional($._if_exists), $.full_table_name),

    // Pattern B — simple name
    drop_schema: $ => seq(token(/DROP/i), token(/SCHEMA/i), optional($._if_exists), $.id_),
    drop_type: $ => seq(token(/DROP/i), token(/TYPE/i), optional($._if_exists), $.full_table_name),
    drop_user: $ => seq(token(/DROP/i), token(/USER/i), optional($._if_exists), $.id_),
    drop_login: $ => seq(token(/DROP/i), $.LOGIN, $.id_),
    drop_statistics: $ => seq(token(/DROP/i), token(/STATISTICS/i), $.full_table_name, repeat(seq(',', $.full_table_name))),

    // Pattern C — INDEX with ON
    drop_index: $ => seq(token(/DROP/i), token(/INDEX/i), optional($._if_exists), $.drop_index_item, repeat(seq(',', $.drop_index_item))),
    drop_index_item: $ => seq($.id_, token(/ON/i), $.full_table_name),

    // Shared helper
    _if_exists: $ => seq(token(/IF/i), token(/EXISTS/i)),
    create_or_alter: $ => choice(
      seq(token(/CREATE/i), optional(seq(token(/OR/i), token(/ALTER/i)))),
      token(/ALTER/i),
    ),

    // =====================
    // CREATE INDEX
    // =====================

    create_index: $ => prec.right(seq(
      token(/CREATE/i),
      optional(token(/UNIQUE/i)),
      optional(choice(token(/CLUSTERED/i), token(/NONCLUSTERED/i))),
      token(/INDEX/i),
      $.id_,
      token(/ON/i),
      $.full_table_name,
      '(', $.column_name_list_ordered, ')',
      optional(seq(token(/INCLUDE/i), '(', $.column_name_list, ')')),
      optional(seq(token(/WHERE/i), $.search_condition)),
      optional(seq(token(/WITH/i), '(', $.alter_table_option, repeat(seq(',', $.alter_table_option)), ')')),
      optional(seq(token(/ON/i), $.id_)),
    )),

    column_name_list_ordered: $ => seq(
      $.id_, optional(choice(token(/ASC/i), token(/DESC/i))),
      repeat(seq(',', $.id_, optional(choice(token(/ASC/i), token(/DESC/i))))),
    ),

    // =====================
    // CREATE/ALTER PROCEDURE
    // =====================

    create_or_alter_procedure: $ => prec.right(seq(
      $.create_or_alter,
      choice(token(/PROCEDURE/i), token(/PROC/i)),
      $.func_proc_name_server_database_schema,
      optional(seq($.procedure_param, repeat(seq(',', $.procedure_param)))),
      optional(seq(token(/WITH/i), $.proc_option, repeat(seq(',', $.proc_option)))),
      token(/AS/i),
      repeat1($.sql_clauses),
    )),

    procedure_param: $ => seq(
      $.LOCAL_ID_,
      $.data_type,
      optional(token(/VARYING/i)),
      optional(seq('=', $.expression)),
      optional(choice($.OUTPUT, token(/READONLY/i))),
    ),

    proc_option: $ => choice(
      token(/ENCRYPTION/i),
      seq(token(/EXECUTE/i), token(/AS/i), choice(token(/CALLER/i), token(/SELF/i), token(/OWNER/i), STRING)),
      token(/RECOMPILE/i),
    ),

    // =====================
    // CREATE/ALTER FUNCTION
    // =====================

    create_or_alter_function: $ => prec.right(seq(
      $.create_or_alter,
      token(/FUNCTION/i),
      $.func_proc_name_server_database_schema,
      '(', optional(seq($.procedure_param, repeat(seq(',', $.procedure_param)))), ')',
      $.func_return,
      optional(seq(token(/WITH/i), $.proc_option, repeat(seq(',', $.proc_option)))),
      token(/AS/i),
      choice(
        // Scalar / multi-statement TVF: BEGIN ... RETURN expr ... END
        seq($.block_statement),
        // Inline TVF: RETURN ( select_statement )
        seq(token(/RETURN/i), '(', $.select_statement, ')'),
      ),
    )),

    func_return: $ => seq(
      token(/RETURNS/i),
      choice(
        // Scalar function
        $.data_type,
        // Inline TVF
        token(/TABLE/i),
        // Multi-statement TVF
        seq($.LOCAL_ID_, token(/TABLE/i), '(', $.table_element, repeat(seq(',', $.table_element)), ')'),
      ),
    ),

    // =====================
    // CREATE/ALTER VIEW
    // =====================

    create_or_alter_view: $ => prec.right(seq(
      $.create_or_alter,
      token(/VIEW/i),
      $.full_table_name,
      optional(seq('(', $.column_name_list, ')')),
      optional(seq(token(/WITH/i), $.view_attribute, repeat(seq(',', $.view_attribute)))),
      token(/AS/i),
      $.select_statement,
      optional(seq(token(/WITH/i), token(/CHECK/i), token(/OPTION/i))),
    )),

    view_attribute: $ => choice(
      token(/SCHEMABINDING/i),
      token(/ENCRYPTION/i),
      token(/VIEW_METADATA/i),
    ),

    // =====================
    // CREATE/ALTER TRIGGER (DML)
    // =====================

    create_or_alter_trigger: $ => prec.right(seq(
      $.create_or_alter,
      token(/TRIGGER/i),
      $.full_table_name,
      token(/ON/i),
      choice(
        // DML trigger: ON table_name AFTER|INSTEAD OF|FOR INSERT,UPDATE,DELETE
        seq(
          $.full_table_name,
          choice(
            token(/AFTER/i),
            seq(token(/INSTEAD/i), token(/OF/i)),
            token(/FOR/i),
          ),
          $.dml_trigger_operation, repeat(seq(',', $.dml_trigger_operation)),
          optional(seq(token(/NOT/i), token(/FOR/i), token(/REPLICATION/i))),
        ),
        // DDL trigger: ON DATABASE|ALL SERVER FOR event_type,...
        seq(
          choice(token(/DATABASE/i), seq(token(/ALL/i), token(/SERVER/i))),
          token(/FOR/i),
          $.id_, repeat(seq(',', $.id_)),
        ),
      ),
      token(/AS/i),
      repeat1($.sql_clauses),
    )),

    dml_trigger_operation: $ => choice(
      token(/INSERT/i),
      token(/UPDATE/i),
      token(/DELETE/i),
    ),

    // =====================
    // Other DDL (Schema, Type, Sequence, Synonym, Truncate)
    // =====================

    create_schema: $ => seq(
      token(/CREATE/i), token(/SCHEMA/i),
      $.id_,
      optional(seq(token(/AUTHORIZATION/i), $.id_)),
    ),

    create_type: $ => seq(
      token(/CREATE/i), token(/TYPE/i),
      $.full_table_name,
      choice(
        seq(token(/FROM/i), $.data_type, optional($.null_notnull)),
        seq(token(/AS/i), token(/TABLE/i), '(', $.table_element, repeat(seq(',', $.table_element)), ')'),
      ),
    ),

    create_sequence: $ => prec.right(seq(
      token(/CREATE/i), token(/SEQUENCE/i),
      $.full_table_name,
      optional(seq(token(/AS/i), $.data_type)),
      optional(seq(token(/START/i), token(/WITH/i), $.decimal_)),
      optional(seq(token(/INCREMENT/i), token(/BY/i), $.decimal_)),
      optional(choice(seq(token(/MINVALUE/i), $.decimal_), seq(token(/NO/i), token(/MINVALUE/i)))),
      optional(choice(seq(token(/MAXVALUE/i), $.decimal_), seq(token(/NO/i), token(/MAXVALUE/i)))),
      optional(choice(token(/CYCLE/i), seq(token(/NO/i), token(/CYCLE/i)))),
      optional(choice(seq(token(/CACHE/i), $.decimal_), seq(token(/NO/i), token(/CACHE/i)))),
    )),

    create_synonym: $ => seq(
      token(/CREATE/i), token(/SYNONYM/i),
      $.full_table_name,
      token(/FOR/i),
      $.full_table_name,
    ),

    truncate_table: $ => seq(
      token(/TRUNCATE/i), token(/TABLE/i),
      $.full_table_name,
    ),

    // =====================
    // CREATE/ALTER LOGIN
    // =====================

    create_login: $ => prec.right(seq(
      token(/CREATE/i), $.LOGIN,
      $.id_,
      choice(
        seq($.WITH, $.login_option, repeat(seq(',', $.login_option))),
        seq(token(/FROM/i), token(/WINDOWS/i),
          optional(seq($.WITH, $.login_option, repeat(seq(',', $.login_option))))),
      ),
    )),

    alter_login: $ => prec.right(seq(
      token(/ALTER/i), $.LOGIN,
      $.id_,
      choice(
        seq($.WITH, $.login_option, repeat(seq(',', $.login_option))),
        token(/ENABLE/i),
        token(/DISABLE/i),
      ),
    )),

    login_option: $ => seq($.id_, optional(seq('=', $.expression))),

    // =====================
    // CREATE/ALTER USER
    // =====================

    create_user: $ => prec.right(seq(
      token(/CREATE/i), $.USER,
      $.id_,
      optional(choice(
        seq(token(/FOR/i), $.LOGIN, $.id_),
        seq(token(/WITHOUT/i), $.LOGIN),
      )),
      optional(seq($.WITH, $.login_option, repeat(seq(',', $.login_option)))),
    )),

    alter_user: $ => prec.right(seq(
      token(/ALTER/i), $.USER,
      $.id_,
      $.WITH, $.login_option, repeat(seq(',', $.login_option)),
    )),

    // =====================
    // CREATE/ALTER/DROP ROLE
    // =====================

    create_role: $ => prec.right(seq(
      token(/CREATE/i), token(/ROLE/i),
      $.id_,
      optional(seq(token(/AUTHORIZATION/i), $.id_)),
    )),

    alter_role: $ => prec.right(seq(
      token(/ALTER/i), token(/ROLE/i),
      $.id_,
      choice(
        seq(token(/ADD/i), token(/MEMBER/i), $.id_),
        seq(token(/DROP/i), token(/MEMBER/i), $.id_),
        seq($.WITH, token(/NAME/i), '=', $.id_),
      ),
    )),

    drop_role: $ => seq(
      token(/DROP/i), token(/ROLE/i), optional($._if_exists), $.id_,
    ),

    // =====================
    // CREATE/ALTER/DROP SERVER ROLE
    // =====================

    create_server_role: $ => prec.right(seq(
      token(/CREATE/i), token(/SERVER/i), token(/ROLE/i),
      $.id_,
      optional(seq(token(/AUTHORIZATION/i), $.id_)),
    )),

    alter_server_role: $ => prec.right(seq(
      token(/ALTER/i), token(/SERVER/i), token(/ROLE/i),
      $.id_,
      choice(
        seq(token(/ADD/i), token(/MEMBER/i), $.id_),
        seq(token(/DROP/i), token(/MEMBER/i), $.id_),
      ),
    )),

    drop_server_role: $ => seq(
      token(/DROP/i), token(/SERVER/i), token(/ROLE/i), $.id_,
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L1479
    create_table: $ => seq(
      token(/CREATE/i), token(/TABLE/i),
      $.full_table_name,
      token('('),
      $.table_element, repeat(seq(token(','), $.table_element)),
      token(')')
    ),

    table_element: $ => choice(
      $.column_definition,
      $.table_constraint,
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L1485
    column_definition: $ => seq(
      field('name', $.id_),
      choice(
        seq($.data_type, repeat(choice(
          $.null_notnull,
          $.identity_column,
          $.column_constraint,
        ))),
        seq(token(/AS/i), $.expression, optional(token(/PERSISTED/i))),
      ),
    ),

    null_notnull: $ => choice(
      seq(token(/NOT/i), $.null_),
      $.null_,
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L1488
    identity_column: $ => seq(
      token(/IDENTITY/i),
      optional(seq(token('('), $.decimal_, token(','), $.decimal_, token(')'))),
    ),

    column_constraint: $ => seq(
      optional(seq(token(/CONSTRAINT/i), field('name', $.id_))),
      choice(
        seq(token(/PRIMARY/i), token(/KEY/i)),
        token(/UNIQUE/i),
        seq($.default, $.expression),
        seq(token(/CHECK/i), token('('), $.search_condition, token(')')),
        seq(optional(seq(token(/FOREIGN/i), token(/KEY/i))),
          token(/REFERENCES/i), $.full_table_name,
          optional(seq(token('('), $.id_, token(')')))),
      )
    ),

    table_constraint: $ => seq(
      optional(seq(token(/CONSTRAINT/i), field('name', $.id_))),
      choice(
        seq(token(/PRIMARY/i), token(/KEY/i),
          token('('), $.column_name_list, token(')')),
        seq(token(/UNIQUE/i),
          token('('), $.column_name_list, token(')')),
        seq(token(/FOREIGN/i), token(/KEY/i),
          token('('), $.column_name_list, token(')'),
          token(/REFERENCES/i), $.full_table_name,
          optional(seq(token('('), $.column_name_list, token(')')))),
        seq(token(/CHECK/i), token('('), $.search_condition, token(')')),
        seq($.default, $.expression, token(/FOR/i), $.id_),
      )
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L250-L264
    cfl_statement: $ => choice(
      $.block_statement
      ,$.if_statement
      ,$.while_statement
      ,$.return_statement
      ,$.break_statement
      ,$.continue_statement
      ,$.try_catch_statement
      ,$.throw_statement
      ,$.print_statement
      ,$.raiseerror_statement
      ,$.goto_statement
      ,$.waitfor_statement
      //TODO label_statement
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L251
    block_statement: $ => seq(
      token(/BEGIN/i), repeat($.sql_clauses), token(/END/i)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L255
    if_statement: $ => prec.right(seq(
      token(/IF/i), $.search_condition
      ,$.sql_clauses
      ,optional(seq(token(/ELSE/i), $.sql_clauses))
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L262
    while_statement: $ => seq(
      token(/WHILE/i), $.search_condition, $.sql_clauses
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L258
    return_statement: $ => prec.right(seq(token(/RETURN/i), optional($.expression))),

    break_statement: $ => token(/BREAK/i),
    continue_statement: $ => token(/CONTINUE/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L260
    try_catch_statement: $ => seq(
      token(/BEGIN/i), token(/TRY/i)
      ,repeat($.sql_clauses)
      ,token(/END/i), token(/TRY/i)
      ,token(/BEGIN/i), token(/CATCH/i)
      ,repeat($.sql_clauses)
      ,token(/END/i), token(/CATCH/i)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L259
    throw_statement: $ => prec.right(seq(
      token(/THROW/i)
      ,optional(seq($.expression, token(','), $.expression, token(','), $.expression))
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L256
    print_statement: $ => seq(token(/PRINT/i), $.expression),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L257
    raiseerror_statement: $ => prec.right(seq(
      token(/RAISERROR/i), token('(')
      ,$.expression, token(','), $.expression, token(','), $.expression
      ,repeat(seq(token(','), $.expression))
      ,token(')')
      ,optional(seq(token(/WITH/i), $.raiserror_option, repeat(seq(token(','), $.raiserror_option))))
    )),

    raiserror_option: $ => choice(
      token(/LOG/i), token(/NOWAIT/i), token(/SETERROR/i)
    ),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/goto-transact-sql
    goto_statement: $ => seq(token(/GOTO/i), $.id_),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/waitfor-transact-sql
    waitfor_statement: $ => seq(
      token(/WAITFOR/i),
      choice(
        seq(token(/DELAY/i), $.expression),
        seq(token(/TIME/i), $.expression),
      ),
    ),

    another_statement: $ => choice(
      $.execute_statement
      ,$.declare_statement
      ,$.set_statement
      ,$.use_statement
      ,$.transaction_statement
      ,$.cursor_statement
      ,$.kill_statement
      ,$.reconfigure_statement
      ,$.shutdown_statement
      ,$.checkpoint_statement
      ,$.dbcc_statement
      ,$.backup_statement
      ,$.restore_statement
      ,$.grant_statement
      ,$.deny_statement
      ,$.revoke_statement
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L350
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2981
    declare_statement: $ => seq(
      token(/DECLARE/i)
      ,$.declare_local, repeat(seq(token(','), $.declare_local))
    ),

    declare_local: $ => seq(
      $.LOCAL_ID_, $.data_type, optional(seq(token('='), $.expression))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3398
    set_statement: $ => choice(
      seq(token(/SET/i), $.LOCAL_ID_, choice(token('='), $.assignment_operator), $.expression)
      ,$.set_special
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3402
    set_special: $ => seq(
      token(/SET/i)
      ,choice(
        seq($.set_on_off_option, choice(token(/ON/i), token(/OFF/i)))
        ,seq(token(/TRANSACTION/i), token(/ISOLATION/i), token(/LEVEL/i)
          ,choice(
            seq(token(/READ/i), token(/UNCOMMITTED/i))
            ,seq(token(/READ/i), token(/COMMITTED/i))
            ,seq(token(/REPEATABLE/i), token(/READ/i))
            ,token(/SNAPSHOT/i)
            ,token(/SERIALIZABLE/i)
          ))
        ,seq(token(/IDENTITY_INSERT/i), $.full_table_name, choice(token(/ON/i), token(/OFF/i)))
        ,seq(token(/ROWCOUNT/i), $.expression)
      )
    ),

    set_on_off_option: $ => choice(
      token(/ANSI_DEFAULTS/i)
      ,token(/ANSI_NULLS/i)
      ,token(/ANSI_NULL_DFLT_OFF/i)
      ,token(/ANSI_NULL_DFLT_ON/i)
      ,token(/ANSI_PADDING/i)
      ,token(/ANSI_WARNINGS/i)
      ,token(/ARITHABORT/i)
      ,token(/ARITHIGNORE/i)
      ,token(/CONCAT_NULL_YIELDS_NULL/i)
      ,token(/CURSOR_CLOSE_ON_COMMIT/i)
      ,token(/FMTONLY/i)
      ,token(/FORCEPLAN/i)
      ,token(/IMPLICIT_TRANSACTIONS/i)
      ,token(/NOCOUNT/i)
      ,token(/NOEXEC/i)
      ,token(/NUMERIC_ROUNDABORT/i)
      ,token(/PARSEONLY/i)
      ,token(/QUOTED_IDENTIFIER/i)
      ,token(/REMOTE_PROC_TRANSACTIONS/i)
      ,token(/SHOWPLAN_ALL/i)
      ,token(/SHOWPLAN_TEXT/i)
      ,token(/SHOWPLAN_XML/i)
      ,token(/STATISTICS_IO/i)
      ,token(/STATISTICS_XML/i)
      ,token(/STATISTICS_PROFILE/i)
      ,token(/STATISTICS_TIME/i)
      ,token(/XACT_ABORT/i)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L367
    use_statement: $ => seq(token(/USE/i), $.id_),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3409
    transaction_statement: $ => prec.right(choice(
      seq(token(/BEGIN/i), optional(token(/DISTRIBUTED/i)), token(/TRAN(SACTION)?/i), optional($.id_))
      ,seq(token(/COMMIT/i), choice(token(/TRAN(SACTION)?/i), token(/WORK/i)), optional($.id_))
      ,seq(token(/ROLLBACK/i), choice(token(/TRAN(SACTION)?/i), token(/WORK/i)), optional($.id_))
      ,seq(token(/SAVE/i), token(/TRAN(SACTION)?/i), $.id_)
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2994
    cursor_statement: $ => choice(
      seq(token(/DECLARE/i), $.id_, token(/CURSOR/i)
        ,optional(choice(token(/LOCAL/i), token(/GLOBAL/i)))
        ,optional(choice(token(/FORWARD_ONLY/i), token(/SCROLL/i)))
        ,optional(choice(token(/STATIC/i), token(/KEYSET/i), token(/DYNAMIC/i), token(/FAST_FORWARD/i)))
        ,optional(choice(token(/READ_ONLY/i), token(/SCROLL_LOCKS/i), token(/OPTIMISTIC/i)))
        ,token(/FOR/i), $.select_statement
      )
      ,seq(token(/OPEN/i), $.id_)
      ,seq(token(/FETCH/i)
        ,optional(choice(token(/NEXT/i), token(/PRIOR/i), token(/FIRST/i), token(/LAST/i)
          ,seq(token(/ABSOLUTE/i), $.expression)
          ,seq(token(/RELATIVE/i), $.expression)
        ))
        ,token(/FROM/i), $.id_
        ,optional(seq(token(/INTO/i), $.LOCAL_ID_, repeat(seq(token(','), $.LOCAL_ID_))))
      )
      ,seq(token(/CLOSE/i), $.id_)
      ,seq(token(/DEALLOCATE/i), $.id_)
    ),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/kill-transact-sql
    kill_statement: $ => seq(token(/KILL/i), $.expression),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/reconfigure-transact-sql
    reconfigure_statement: $ => prec.right(seq(
      token(/RECONFIGURE/i),
      optional(seq($.WITH, token(/OVERRIDE/i))),
    )),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/shutdown-transact-sql
    shutdown_statement: $ => prec.right(seq(
      token(/SHUTDOWN/i),
      optional(seq($.WITH, token(/NOWAIT/i))),
    )),

    //https://learn.microsoft.com/en-us/sql/t-sql/language-elements/checkpoint-transact-sql
    checkpoint_statement: $ => prec.right(seq(
      token(/CHECKPOINT/i),
      optional($.decimal_),
    )),

    //https://learn.microsoft.com/en-us/sql/t-sql/database-console-commands/dbcc-transact-sql
    dbcc_statement: $ => prec.right(seq(
      token(/DBCC/i),
      $.id_,
      optional(seq('(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')')),
      optional(seq($.WITH, $.id_, repeat(seq(',', $.id_)))),
    )),

    backup_statement: $ => prec.right(seq(
      token(/BACKUP/i),
      choice(
        // BACKUP DATABASE db [FILE/FILEGROUP specs] TO device [MIRROR TO] [WITH]
        seq(token(/DATABASE/i), $.id_,
          optional($._backup_filespec),
          $._backup_to_clause,
          optional($._backup_mirror_clause),
          optional($._backup_with_clause)),
        // BACKUP LOG db TO device [MIRROR TO] [WITH]
        seq(token(/LOG/i), $.id_,
          $._backup_to_clause,
          optional($._backup_mirror_clause),
          optional($._backup_with_clause)),
        // BACKUP CERTIFICATE name TO FILE = 'path' [WITH PRIVATE KEY (...)]
        seq(token(/CERTIFICATE/i), $.id_,
          token(/TO/i), token(/FILE/i), '=', $.string_lit,
          optional(seq($.WITH, token(/PRIVATE/i), token(/KEY/i), '(',
            token(/FILE/i), '=', $.string_lit, ',',
            token(/ENCRYPTION/i), token(/BY/i), $.id_, '=', $.string_lit,
            optional(seq(',', $.id_, token(/BY/i), $.id_, '=', $.string_lit)),
          ')'))),
        // BACKUP MASTER KEY TO FILE = 'path' ENCRYPTION BY PASSWORD = 'pwd'
        seq(token(/MASTER/i), token(/KEY/i),
          token(/TO/i), token(/FILE/i), '=', $.string_lit,
          token(/ENCRYPTION/i), token(/BY/i), $.id_, '=', $.string_lit),
        // BACKUP SERVICE MASTER KEY TO FILE = 'path' ENCRYPTION BY PASSWORD = 'pwd'
        seq(token(/SERVICE/i), token(/MASTER/i), token(/KEY/i),
          token(/TO/i), token(/FILE/i), '=', $.string_lit,
          token(/ENCRYPTION/i), token(/BY/i), $.id_, '=', $.string_lit),
      ),
    )),

    _backup_filespec: $ => seq(
      choice(token(/FILE/i), token(/FILEGROUP/i)), '=', $.string_lit,
      repeat(seq(',', choice(token(/FILE/i), token(/FILEGROUP/i)), '=', $.string_lit)),
    ),

    restore_statement: $ => prec.right(seq(
      token(/RESTORE/i),
      choice(token(/DATABASE/i), token(/LOG/i)),
      $.id_,
      token(/FROM/i),
      $.backup_device_spec, repeat(seq(',', $.backup_device_spec)),
      optional($._backup_with_clause),
    )),

    backup_device_spec: $ => seq(
      choice(token(/DISK/i), token(/TAPE/i), token(/URL/i)),
      '=', $.string_lit,
    ),

    _backup_to_clause: $ => seq(
      token(/TO/i),
      $.backup_device_spec, repeat(seq(',', $.backup_device_spec)),
    ),

    _backup_mirror_clause: $ => seq(
      token(/MIRROR/i), token(/TO/i),
      $.backup_device_spec, repeat(seq(',', $.backup_device_spec)),
    ),

    _backup_with_clause: $ => seq(
      $.WITH,
      $.backup_option, repeat(seq(',', $.backup_option)),
    ),

    backup_option: $ => seq(
      $.id_, optional(seq('=', $.expression)),
    ),

    // =====================
    // GRANT / DENY / REVOKE
    // =====================

    grant_statement: $ => prec.right(seq(
      token(/GRANT/i),
      $.id_, repeat(seq(',', $.id_)),
      optional(seq(token(/ON/i),
        optional(seq($.id_, DOUBLE_COLON)),
        $.full_table_name)),
      token(/TO/i),
      $.id_, repeat(seq(',', $.id_)),
      optional(seq($.WITH, token(/GRANT/i), token(/OPTION/i))),
      optional(seq(token(/AS/i), $.id_)),
    )),

    deny_statement: $ => prec.right(seq(
      token(/DENY/i),
      $.id_, repeat(seq(',', $.id_)),
      optional(seq(token(/ON/i),
        optional(seq($.id_, DOUBLE_COLON)),
        $.full_table_name)),
      token(/TO/i),
      $.id_, repeat(seq(',', $.id_)),
      optional(token(/CASCADE/i)),
      optional(seq(token(/AS/i), $.id_)),
    )),

    revoke_statement: $ => prec.right(seq(
      token(/REVOKE/i),
      optional(seq(token(/GRANT/i), token(/OPTION/i), token(/FOR/i))),
      $.id_, repeat(seq(',', $.id_)),
      optional(seq(token(/ON/i),
        optional(seq($.id_, DOUBLE_COLON)),
        $.full_table_name)),
      choice(token(/TO/i), token(/FROM/i)),
      $.id_, repeat(seq(',', $.id_)),
      optional(token(/CASCADE/i)),
      optional(seq(token(/AS/i), $.id_)),
    )),

    // https://msdn.microsoft.com/en-us/library/ms188332.aspx
    // https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3141
    execute_statement: $ => prec.left(seq($.execute, $.execute_body, optional(SEMI))),

    execute: $ => token(/EXEC(UTE)?/i),

    // https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver15
    execute_body: $ => prec.right(choice(
      seq(optional(seq(field('return_status',$.LOCAL_ID_), token(/=/)))
        , choice($.func_proc_name_server_database_schema, $.execute_var_string)
        , optional($.execute_statement_arg)
        , optional(seq($.WITH, $.execute_option, repeat(seq(token(','), $.execute_option)))))
      //TODO execute_option https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver15

      ,seq(parens(seq($.execute_var_string, repeat(seq(token(','), $.execute_var_string))))
        ,optional(seq($.as, choice($.LOGIN,$.USER), token('='), $.string_lit))
        ,optional(seq($.AT_KEYWORD, field('linkedServer', $.id_))))
      //TODO AT_DATA_SOURCE https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver16&redirectedfrom=MSDN#:~:text=AT%20DATA_SOURCE%20data_source_name%20Applies%20to%3A%20SQL%20Server%202019%20(15.x)%20and%20later
    )),

    WITH: $ => token(/WITH/i),

    execute_option: $ => choice(
      $.RECOMPILE
      ,seq($.RESULT_SETS, choice($.NONE, $.UNDEFINED))
      //TODO Result Sets Definition
      // https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver15
    ),

    RESULT_SETS: $ => seq(token(/RESULT/i), token(/SETS/i)),
    NONE: $ => token(/NONE/i),
    UNDEFINED: $ => token(/UNDEFINED/i),

    RECOMPILE: $ => token(/RECOMPILE/i),

    LOGIN: $ => token(/LOGIN/i),
    USER: $ => token(/USER/i),
    AT_KEYWORD: $ => token(/AT/i),

    // https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver15
    // https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3175-L3178
    execute_var_string: $ => choice(
      seq($.LOCAL_ID_, optional(seq($.PLUS, $.LOCAL_ID_, optional(seq($.PLUS, $.execute_var_string)))))
      ,seq($.string_lit, optional(seq($.PLUS, $.LOCAL_ID_, optional(seq($.PLUS, $.execute_var_string)))))
    ),

    string_lit: $ => token(seq(
      optional('N')
      ,"'" //Opening Single Quote
      ,repeat(choice(
        /[^']/,               // Any character except a single quote
        "''"                  // Escaped single quote (two single quotes)
      ))
      ,"'" //Closing Single Quote

    )),


    PLUS: $ => token(/\+/),

    dml_clause: $ => choice(
      $.select_statement_standalone
      ,$.insert_statement
      ,$.update_statement
      ,$.delete_statement
      ,$.merge_statement
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L63-L70
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2161
    insert_statement: $ => seq(
      optional($.with_expression)
      ,token(/INSERT/i)
      ,optional($.top_clause)
      ,optional(token(/INTO/i))
      ,$.full_table_name
      ,optional(seq(token('('), $.column_name_list, token(')')))
      ,optional($.output_clause)
      ,$.insert_statement_value
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2168
    insert_statement_value: $ => choice(
      seq(token(/VALUES/i), $.value_list, repeat(seq(token(','), $.value_list)))
      ,$.select_statement
      ,seq(token(/DEFAULT/i), token(/VALUES/i))
      ,$.execute_statement
    ),

    value_list: $ => seq(token('('), $.expression_list_, token(')')),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2195
    update_statement: $ => seq(
      optional($.with_expression)
      ,token(/UPDATE/i)
      ,optional($.top_clause)
      ,$.update_target
      ,token(/SET/i)
      ,$.update_elem, repeat(seq(token(','), $.update_elem))
      ,optional($.output_clause)
      ,optional(seq(token(/FROM/i), $.table_sources))
      ,optional(seq(token(/WHERE/i), $.search_condition))
    ),

    update_target: $ => choice(
      $.full_table_name
      ,$.local_id_
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2221
    update_elem: $ => choice(
      seq($.full_column_name, token('='), $.expression)
      ,seq($.full_column_name, $.assignment_operator, $.expression)
      ,seq($.LOCAL_ID_, token('='), $.expression)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2148
    delete_statement: $ => seq(
      optional($.with_expression)
      ,token(/DELETE/i)
      ,optional($.top_clause)
      ,optional(token(/FROM/i))
      ,$.delete_target
      ,optional($.output_clause)
      ,optional(seq(token(/FROM/i), $.table_sources))
      ,optional(seq(token(/WHERE/i), $.search_condition))
    ),

    delete_target: $ => choice(
      $.full_table_name
      ,$.local_id_
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2127
    merge_statement: $ => seq(
      optional($.with_expression)
      ,token(/MERGE/i)
      ,optional(token(/INTO/i))
      ,$.full_table_name
      ,optional($.as_table_alias)
      ,token(/USING/i)
      ,$.table_source
      ,token(/ON/i)
      ,$.search_condition
      ,repeat1($.when_matches)
      ,optional($.output_clause)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2132
    when_matches: $ => choice(
      seq(token(/WHEN/i), token(/MATCHED/i), optional(seq(token(/AND/i), $.search_condition))
        ,token(/THEN/i), $.merge_matched)
      ,seq(token(/WHEN/i), token(/NOT/i), token(/MATCHED/i), optional(seq(token(/BY/i), token(/TARGET/i)))
        ,optional(seq(token(/AND/i), $.search_condition))
        ,token(/THEN/i), $.merge_not_matched)
      ,seq(token(/WHEN/i), token(/NOT/i), token(/MATCHED/i), token(/BY/i), token(/SOURCE/i)
        ,optional(seq(token(/AND/i), $.search_condition))
        ,token(/THEN/i), $.merge_matched)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2138
    merge_matched: $ => choice(
      seq(token(/UPDATE/i), token(/SET/i), $.update_elem, repeat(seq(token(','), $.update_elem)))
      ,token(/DELETE/i)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2143
    merge_not_matched: $ => seq(
      token(/INSERT/i)
      ,optional(seq(token('('), $.column_name_list, token(')')))
      ,token(/VALUES/i), token('('), $.expression_list_, token(')')
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L2228
    output_clause: $ => seq(
      token(/OUTPUT/i)
      ,$.output_dml_list_elem, repeat(seq(token(','), $.output_dml_list_elem))
      ,optional(seq(token(/INTO/i), $.full_table_name, optional(seq(token('('), $.column_name_list, token(')')))))
    ),

    output_dml_list_elem: $ => prec.right(seq(
      choice(
        seq(token(/INSERTED/i), DOT, choice($.id_, $.asterisk))
        ,seq(token(/DELETED/i), DOT, choice($.id_, $.asterisk))
        ,$.expression
      )
      ,optional($.as_column_alias)
    )),

    select_statement_standalone: $ => seq(
      optional($.with_expression),
      $.select_statement
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3955
    with_expression: $ => seq(
      token(/WITH/i)
      ,$.common_table_expression, repeat(seq(token(','), $.common_table_expression))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3959
    common_table_expression: $ => seq(
      field('cte_name', $.id_)
      ,optional(seq(token('('), $.column_name_list, token(')')))
      ,token(/AS/i)
      ,token('(')
      ,$.select_statement
      ,token(')')
    ),

    column_name_list: $ => seq($.id_, repeat(seq(token(','), $.id_))),

    select_statement: $ => prec.left(seq(
      $.query_expression
      ,optional($.select_order_by_clause)
      ,optional($.for_clause)
      ,optional($.option_clause)
      ,optional(SEMI)
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4055-L4068
    for_clause: $ => seq(
      token(/FOR/i)
      ,choice(
        token(/BROWSE/i)
        ,seq(token(/XML/i), $.xml_common_directives)
        ,seq(token(/JSON/i), $.json_common_directives)
      )
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4058-L4065
    xml_common_directives: $ => choice(
      seq(token(/RAW/i), optional(seq(token('('), $.string_lit, token(')'))), repeat(seq(token(','), $.xml_option)))
      ,seq(token(/AUTO/i), repeat(seq(token(','), $.xml_option)))
      ,seq(token(/EXPLICIT/i), repeat(seq(token(','), $.xml_option)))
      ,seq(token(/PATH/i), optional(seq(token('('), $.string_lit, token(')'))), repeat(seq(token(','), $.xml_option)))
    ),

    xml_option: $ => choice(
      token(/ELEMENTS/i)
      ,seq(token(/ELEMENTS/i), choice(token(/XSINIL/i), token(/ABSENT/i)))
      ,token(/TYPE/i)
      ,seq(token(/ROOT/i), optional(seq(token('('), $.string_lit, token(')'))))
      ,token(/BINARY_BASE64/i)
      ,seq(token(/XMLSCHEMA/i), optional(seq(token('('), $.string_lit, token(')'))))
      ,seq(token(/XMLDATA/i))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4067-L4068
    json_common_directives: $ => seq(
      choice(token(/AUTO/i), token(/PATH/i))
      ,repeat(seq(token(','), $.json_option))
    ),

    json_option: $ => choice(
      seq(token(/ROOT/i), optional(seq(token('('), $.string_lit, token(')'))))
      ,token(/INCLUDE_NULL_VALUES/i)
      ,token(/WITHOUT_ARRAY_WRAPPER/i)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4089
    option_clause: $ => seq(
      token(/OPTION/i), token('('), $.query_hint, repeat(seq(token(','), $.query_hint)), token(')')
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4093
    query_hint: $ => choice(
      token(/RECOMPILE/i)
      ,seq(token(/MAXDOP/i), $.expression)
      ,seq(token(/OPTIMIZE/i), token(/FOR/i), choice(token(/UNKNOWN/i), seq(token('('), $.optimize_for_arg, repeat(seq(token(','), $.optimize_for_arg)), token(')'))))
      ,seq(token(/HASH/i), choice(token(/GROUP/i), token(/JOIN/i), token(/UNION/i)))
      ,seq(token(/MERGE/i), choice(token(/JOIN/i), token(/UNION/i)))
      ,seq(token(/LOOP/i), token(/JOIN/i))
      ,seq(token(/CONCAT/i), token(/UNION/i))
      ,seq(token(/FORCE/i), token(/ORDER/i))
      ,seq(token(/KEEP/i), token(/PLAN/i))
      ,token(/EXPAND_VIEWS/i)
      ,token(/FAST/i)
      ,seq(token(/MAXRECURSION/i), $.expression)
      ,seq(token(/USE/i), token(/PLAN/i), $.string_lit)
    ),

    optimize_for_arg: $ => seq(
      $.LOCAL_ID_, choice(token(/UNKNOWN/i), seq(token('='), $.constant))
    ),

    query_expression: $ => seq(
      $.query_specification, repeat($.sql_union)
      //TODO parenthesized query_expression https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3999
    ),

    sql_union: $ => seq(
      choice(
        seq(token(/UNION/i), optional(token(/ALL/i)))
        ,token(/EXCEPT/i)
        ,token(/INTERSECT/i)
      )
      ,choice($.query_specification, seq(token('('), $.query_expression, token(')')))
    ),

    query_specification: $ => seq(
      $.select
      ,optional(choice(token(/ALL/i), token(/DISTINCT/i)))
      ,optional($.top_clause)
      ,$.select_list
      ,optional(seq(token(/INTO/i), $.full_table_name))
      ,optional(seq(token(/FROM/i), $.table_sources))
      ,optional(seq(token(/WHERE/i), $.search_condition))
      ,optional($.groupby)
      ,optional(seq(token(/HAVING/i), $.search_condition))
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4010-L4023
    ),

    top_clause: $ => seq(
      token(/TOP/i)
      ,choice(
        seq(token('('), $.expression, token(')'))
        ,$.expression
      )
      ,optional(token(/PERCENT/i))
      ,optional(seq(token(/WITH/i), token(/TIES/i)))
    ),

    select_order_by_clause: $ => prec.right(seq(
      token(/ORDER/i), token(/BY/i)
      ,$.order_by_expression, repeat(seq(token(','), $.order_by_expression))
      ,optional(seq(token(/OFFSET/i), $.expression, token(/ROWS/i)))
      ,optional(seq(token(/FETCH/i), choice(token(/FIRST/i), token(/NEXT/i)), $.expression, token(/ROWS/i), token(/ONLY/i)))
    )),

    select: $ => token(/SELECT/i),
    //https://learn.microsoft.com/en-us/sql/t-sql/queries/select-clause-transact-sql?view=sql-server-ver16&redirectedfrom=MSDN
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4119
    select_list: $ => seq($.select_list_elem, repeat(seq(token(','), $.select_list_elem))),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4143-L4148
    select_list_elem: $ => choice(
      $.asterisk
      ,seq(field('table', $.id_), DOT, $.asterisk)  // qualified asterisk: table.*
      ,$.udt_elem
      ,seq($.LOCAL_ID_, choice($.assignment_operator, token('=')), $.expression)
      ,$.expression_elem
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4018
    groupby: $ => seq($.groupby_, optional(token(/ALL/i)),
      field('groupBys',seq($.group_by_item, repeat(seq(token(','), $.group_by_item))))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4018-L4019
    group_by_item: $ => choice(
      $.expression
      ,seq(token(/ROLLUP/i), token('('), $.expression_list_, token(')'))
      ,seq(token(/CUBE/i), token('('), $.expression_list_, token(')'))
      ,$.grouping_sets_item
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4019
    grouping_sets_item: $ => seq(
      token(/GROUPING/i), token(/SETS/i)
      ,token('('), $.grouping_set, repeat(seq(token(','), $.grouping_set)), token(')')
    ),

    grouping_set: $ => choice(
      seq(token('('), optional($.expression_list_), token(')'))
      ,$.expression
    ),

    groupby_: $ => token(/GROUP BY/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L6294
    assignment_operator: $ => choice(
       token('+=')
      ,token('-=')
      ,token('*=')
      ,token('/=')
      ,token('%=')
      ,token('&=')
      ,token('^=')
      ,token('|=')
    ),

    asterisk: $ => token(/\*/),

    //https://learn.microsoft.com/en-us/sql/t-sql/queries/select-clause-transact-sql?view=sql-server-ver16
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4133
    udt_elem: $ => prec.left(10, choice(
      seq(field('udt_column_name', $.id_), DOT, field('non_static_attr',$.id_), $.udt_method_arguments, optional($.as_column_alias))

      ,seq(field('udt_column_name', $.id_), DOUBLE_COLON, field('non_static_attr',$.id_)
        ,optional($.udt_method_arguments)
        ,optional($.as_column_alias))
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4123
    udt_method_arguments: $ => seq(
      parens($.execute_var_string, repeat(seq(token(','), $.execute_var_string)))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4138
    expression_elem: $ => prec.right(choice(
      seq(field('leftAlias', $.column_alias), token(/=/), field('leftAssignment', $.expression))
      ,seq(field('expressionAs', $.expression), optional($.as_column_alias))
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4910
    as_column_alias: $ => seq(optional($.as), $.column_alias),
    as: $ => token(/AS/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4990
    column_alias: $ => choice(
      $.id_
      ,$.string_lit
    ),

    table_sources: $ => seq(
      $.table_source, repeat(seq(token(','), $.table_source))
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4150-L4153
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4160C4-L4163
    table_source: $ => seq($.table_source_item, repeat($.join_part)),

    table_source_item: $ => seq(
      choice(
        $.table_valued_function  // must be before full_table_name (both start with id_)
        ,$.full_table_name
        ,seq(token('('), $.select_statement, token(')'))  // derived table
        ,$.local_id_
        //TODO OPENROWSET, OPENQUERY, OPENDATASOURCE
      )
      ,choice(
        $.pivot_clause          // PIVOT path (includes its own alias)
        ,$.unpivot_clause       // UNPIVOT path (includes its own alias)
        ,seq(optional($.as_table_alias), optional($.with_table_hints))  // normal path
      )
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4175
    table_valued_function: $ => seq(
      $.func_proc_name_database_schema
      ,token('('), optional($.expression_list_), token(')')
    ),

    as_table_alias: $ => seq(optional(token(/AS/i)), $.id_),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4173
    with_table_hints: $ => seq(
      token(/WITH/i), token('('), $.table_hint, repeat(seq(token(','), $.table_hint)), token(')')
    ),

    table_hint: $ => choice(
      token(/NOLOCK/i)
      ,token(/READUNCOMMITTED/i)
      ,token(/READCOMMITTED/i)
      ,token(/READCOMMITTEDLOCK/i)
      ,token(/REPEATABLEREAD/i)
      ,token(/SERIALIZABLE/i)
      ,token(/SNAPSHOT/i)
      ,token(/TABLOCK/i)
      ,token(/TABLOCKX/i)
      ,token(/UPDLOCK/i)
      ,token(/ROWLOCK/i)
      ,token(/PAGLOCK/i)
      ,token(/HOLDLOCK/i)
      ,token(/NOWAIT/i)
      ,token(/XLOCK/i)
      //TODO INDEX, FORCESEEK, FORCESCAN, SPATIAL_WINDOW_MAX_CELLS
    ),

    join_part: $ => choice(
      seq(optional($.join_hint), token(/JOIN/i), $.table_source_item, token(/ON/i), $.search_condition)
      ,seq(token(/INNER/i), optional($.join_hint), token(/JOIN/i), $.table_source_item, token(/ON/i), $.search_condition)
      ,seq(choice(
        seq(token(/LEFT/i), optional(token(/OUTER/i)))
        ,seq(token(/RIGHT/i), optional(token(/OUTER/i)))
        ,seq(token(/FULL/i), optional(token(/OUTER/i)))
      ), optional($.join_hint), token(/JOIN/i), $.table_source_item, token(/ON/i), $.search_condition)
      ,seq(token(/CROSS/i), token(/JOIN/i), $.table_source_item)
      ,seq(token(/CROSS/i), token(/APPLY/i), $.table_source_item)
      ,seq(token(/OUTER/i), token(/APPLY/i), $.table_source_item)
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4247
    pivot_clause: $ => seq(
      token(/PIVOT/i), token('(')
      ,$.aggregate_functions, token(/FOR/i), $.full_column_name
      ,token(/IN/i), token('('), $.column_alias_list, token(')')
      ,token(')'), $.as_table_alias
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4251
    unpivot_clause: $ => seq(
      token(/UNPIVOT/i), token('(')
      ,$.full_column_name, token(/FOR/i), $.full_column_name
      ,token(/IN/i), token('('), $.column_alias_list, token(')')
      ,token(')'), $.as_table_alias
    ),

    column_alias_list: $ => seq($.column_alias, repeat(seq(token(','), $.column_alias))),

    join_hint: $ => choice(
      token(/LOOP/i), token(/HASH/i), token(/MERGE/i), token(/REMOTE/i)
    ),

    //TODO CORPUS
    table_name: $ => prec.right(seq(
      optional(choice(
        seq(field('database', $.id_), DOT, field('schema', $.id_))
        ,seq(field('schema', $.id_), DOT)
      ))
      ,choice(
        field('table', $.id_)
        //TODO blocking_hiearchy
        //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5128
      )
    )),


    full_table_name: $ => prec.right(seq(
      optional(choice(
      //NOTE? whats this dotdot example https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5118
        seq(field('server', $.id_), DOT, field('database', $.id_), DOT, field('schema', $.id_), DOT)
        ,seq(field('database', $.id_), DOT, field('schema', $.id_), DOT)
        ,seq(field('schema', $.id_), DOT)
      ))
      ,field('table', $.id_)
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5155-L5160
    full_column_name: $ => prec.right(seq(
      optional(choice(
        seq(field('server', $.id_), DOT, field('schema', $.id_), DOT, field('table', $.id_), DOT)
        ,seq(field('schema', $.id_), DOT, field('table', $.id_), DOT)
        ,seq(field('table', $.id_), DOT)
        ,seq(token(/DELETED/i), DOT)
        ,seq(token(/INSERTED/i), DOT)
      ))
      ,field('column', $.id_)
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3900-L3917
    expression: $ => choice(
      $.primitive_expression
      ,$.full_column_name
      ,$.function_call
      ,$.bracket_expression
      ,$.case_expression
      ,$.unary_operator_expression
      // Multiplicative: * / %
      ,prec.left(5, seq($.expression, $.asterisk, $.expression))
      ,prec.left(5, seq($.expression, token('/'), $.expression))
      ,prec.left(5, seq($.expression, token('%'), $.expression))
      // Additive: + -
      ,prec.left(4, seq($.expression, $.PLUS, $.expression))
      ,prec.left(4, seq($.expression, token('-'), $.expression))
      // Bitwise: & ^ | ||
      ,prec.left(3, seq($.expression, token('&'), $.expression))
      ,prec.left(3, seq($.expression, token('^'), $.expression))
      ,prec.left(3, seq($.expression, token('|'), $.expression))
      ,prec.left(3, seq($.expression, token('||'), $.expression))
      // COLLATE
      ,prec.left(7, seq($.expression, $.collation_))
      // AT TIME ZONE
      ,prec.left(7, seq($.expression, $.AT_KEYWORD, token(/TIME/i), token(/ZONE/i), $.expression))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3945
    bracket_expression: $ => choice(
      seq(token('('), $.expression, token(')'))
      ,seq(token('('), $.subquery, token(')'))
    ),

    subquery: $ => $.select_statement,

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3940
    unary_operator_expression: $ => prec(6, seq(
      choice(token('~'), token('+'), token('-'))
      ,$.expression
    )),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3935
    case_expression: $ => choice(
      seq(token(/CASE/i), $.expression, repeat1($.switch_section), optional(seq(token(/ELSE/i), $.expression)), token(/END/i))
      ,seq(token(/CASE/i), repeat1($.switch_search_condition_section), optional(seq(token(/ELSE/i), $.expression)), token(/END/i))
    ),

    switch_section: $ => seq(token(/WHEN/i), $.expression, token(/THEN/i), $.expression),
    switch_search_condition_section: $ => seq(token(/WHEN/i), $.search_condition, token(/THEN/i), $.expression),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3977
    search_condition: $ => choice(
      $.predicate
      ,prec(3, seq(token(/NOT/i), $.search_condition))
      ,prec.left(2, seq($.search_condition, token(/AND/i), $.search_condition))
      ,prec.left(1, seq($.search_condition, token(/OR/i), $.search_condition))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3983
    predicate: $ => choice(
      seq(token(/EXISTS/i), token('('), $.subquery, token(')'))
      ,$.freetext_predicate
      ,prec(1, seq($.expression, $.comparison_operator, $.expression))
      ,seq($.expression, optional(token(/NOT/i)), token(/BETWEEN/i), $.expression, token(/AND/i), $.expression)
      ,seq($.expression, optional(token(/NOT/i)), token(/IN/i), token('('), choice($.subquery, $.expression_list_), token(')'))
      ,seq($.expression, optional(token(/NOT/i)), token(/LIKE/i), $.expression, optional(seq(token(/ESCAPE/i), $.expression)))
      ,seq($.expression, token(/IS/i), optional(token(/NOT/i)), $.null_)
      ,seq($.expression, $.comparison_operator, choice(token(/ALL/i), token(/SOME/i), token(/ANY/i)), '(', $.subquery, ')')
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4011-L4024
    freetext_predicate: $ => choice(
      seq(token(/CONTAINS/i), '(',
        choice($.full_column_name, seq('(', $.full_column_name, repeat(seq(',', $.full_column_name)), ')'), $.asterisk),
        ',', $.expression,
        optional(seq(',', token(/LANGUAGE/i), $.expression)),
        ')')
      ,seq(token(/FREETEXT/i), '(',
        choice($.full_column_name, seq('(', $.full_column_name, repeat(seq(',', $.full_column_name)), ')'), $.asterisk),
        ',', $.expression,
        optional(seq(',', token(/LANGUAGE/i), $.expression)),
        ')')
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3970
    comparison_operator: $ => choice(
      token('=')
      ,token('<>')
      ,token('!=')
      ,token('<')
      ,token('>')
      ,token('<=')
      ,token('>=')
      ,token('!<')
      ,token('!>')
    ),

    //TODO CORPUS
    function_call: $ => choice(
      $.ranking_windowed_function
      ,$.aggregate_functions
      ,$.analytic_windowed_functions

      ,$.built_in_functions
      //TODO built_in_function ~~200 rules https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4291

      ,$.iif_function
      ,$.coalesce_function
      ,$.nullif_function

      ,choice(
        seq($.scalar_function_name, parens(optional($.expression_list_)))
        ,seq(choice($.binary_checksum_, $.checksum_), parens(choice($.asterisk, $.expression_list_))) //TODO MOVE TO BUILTINS
      )

      ,$.partition_function
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4287
      ,$.hierarchyid_static_method
      //TODO freetext_function
      ,$.odbc_scalar_functions
      ,$.bit_manipulation_functions
      ,$.collation_functions
      ,$.configuration_functions
      ,$.conversion_functions
      ,$.cursor_functions
      ,$.datatype_functions
      ,$.datetime_functions
      ,$.json_functions
      ,$.logical_functions
      ,$.math_functions
      ,$.security_functions
      ,$.string_functions
      ,$.system_functions
    ),

    // IIF(search_condition, true_val, false_val) — first arg is search_condition
    iif_function: $ => seq($.iif_, token('('), $.search_condition, token(','), $.expression, token(','), $.expression, token(')')),
    iif_: $ => token(/IIF/i),

    // COALESCE(expression, expression [, ...]) — at least 2 args
    coalesce_function: $ => seq($.coalesce_, token('('), $.expression, token(','), $.expression, repeat(seq(token(','), $.expression)), token(')')),
    coalesce_: $ => token(/COALESCE/i),

    // NULLIF(expression, expression)
    nullif_function: $ => seq($.nullif_, token('('), $.expression, token(','), $.expression, token(')')),
    nullif_: $ => token(/NULLIF/i),

    ...built_in_functions,
    ...odbc_scalar_functions,
    ...aggregate_window_functions,
    ...analytic_windowed_functions,
    ...bit_manipulation_functions,
    ...collation_functions,
    ...configuration_functions,
    ...conversion_functions,
    ...cursor_functions,
    ...datatype_functions,
    ...datetime_functions,
    ...json_functions,
    ...logical_functions,
    ...math_functions,
    ...security_functions,
    ...string_functions,
    ...system_functions,
    ...data_type,

    //https://learn.microsoft.com/en-us/sql/t-sql/data-types/hierarchyid-data-type-method-reference?view=sql-server-ver16
    hierarchyid_static_method: $ => choice(
      seq($.hierachyid_, DOUBLE_COLON, choice(
        seq($.getroot_, parens())
        ,seq($.parse_, parens(field('input',$.expression)))
        )
      )
      ,seq($.id_, DOT, choice(
        $.getlevel_
        ,$.tostring_
      ), parens())

      ,seq($.id_, DOT, choice(
        $.getancestor_
        ,$.is_descendant_of_
      ), parens($.expression))

      ,seq($.id_, DOT, choice(
        $.get_reparented_value_
        ,$.get_descendant_
      ), parens(seq($.expression, token(','), $.expression)))


    ),

    hierachyid_: $ => token(/HIERARCHYID/i),

    get_descendant_: $ => token(/GetDescendant/i),
    get_reparented_value_: $ => token(/GetReparentedValue/i),
    getancestor_: $ => token(/GETANCESTOR/i),
    is_descendant_of_: $ => token(/IsDescendantOf/i),
    getlevel_: $ => token(/GETLEVEL/i),
    getroot_: $ => token(/GETROOT/i),
    tostring_: $ => token(/ToString/i),


    parse_: $ => token(/PARSE/i),

    // https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4298-L4300
    partition_function: $ => seq(
      optional(seq(field('database', $.id_), DOT)), $.dollar_partition_, DOT, field('func_name', $.id_), parens($.expression)
    ),

    dollar_partition_: $ => token(/\$PARTITION/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5198
    scalar_function_name: $ => choice(
      $.func_proc_name_database_schema
      ,$.right_
      ,$.left_
    ),

    right_: $ => token(/RIGHT/i),
    left_: $ => token(/LEFT/i),
    binary_checksum_: $ => token(/BINARY_CHECKSUM/i),
    checksum_: $ => token(/CHECKSUM/i),

    local_id_: $ => LOCAL_ID,
    seperator: $ => choice(
      $.local_id_
      ,$.string_lit
    ),
    //https://msdn.microsoft.com/en-us/library/ms189798.aspx
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5004
    ranking_windowed_function: $ => choice(
      seq(choice($.rank_, $.dense_rank_, $.row_number_)
        ,token('('), token(')'), $.over_clause)
      ,seq($.ntile_, parens($.expression), $.over_clause)
    ),

    ntile_: $ => token(/NTILE/i),
    rank_: $ => token(/RANK/i),
    dense_rank_: $ => token(/DENSE_RANK/i),
    row_number_: $ => token(/ROW_NUMBER/i),

    //https://msdn.microsoft.com/en-us/library/ms189461.aspx
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5033
    over_clause: $ => seq(
      token(/OVER/i)
      ,token('(')
        ,optional($.partition_by_clause)
        ,optional($.order_by_clause)
        ,optional($.row_or_range_clause)
      ,token(')')
    ),

    partition_by_clause: $ => seq(token(/PARTITION/i), token(/BY/i), $.expression_list_),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4999
    expression_list_: $ => prec.left(seq($.expression, repeat(seq(token(','), $.expression)))),

    //https://docs.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql?view=sql-server-ver16
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4041
    order_by_clause: $ => seq(
      token(/ORDER/i), token(/BY/i), $.order_by_expression, repeat(seq(token(','), $.order_by_expression))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4071
    order_by_expression: $ => seq(
      field('order_by', $.expression)
      ,optional($.collation_)
      ,optional(choice(
        field('ascending', $.asc_)
        ,field('descending', $.desc_)
      )),
    ),

    collation_: $ => seq(
      token(/COLLATE/i)
      ,field('collation_name', $.id_)
    ),

    asc_: $ => token(/ASC/i),
    desc_: $ => token(/DESC/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5041
    window_frame_extent: $ => choice(
      $.window_frame_preceding
      ,seq(token(/BETWEEN/i), $.window_frame_bound, token(/AND/i), $.window_frame_bound)
    ),

    window_frame_bound: $ => choice(
      $.window_frame_preceding
      ,$.window_frame_following
    ),

    window_frame_following: $ => choice(
      seq(token(/UNBOUNDED/i), token(/FOLLOWING/i))
      ,seq(DECIMAL, token(/FOLLOWING/i))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5051
    window_frame_preceding: $ => choice(
      seq(token(/UNBOUNDED/i), token(/PRECEDING/i))
      ,seq(DECIMAL, token(/PRECEDING/i))
      ,seq(token(/CURRENT/i), token(/ROW/i))
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5037
    row_or_range_clause: $ => seq(
      choice(token(/ROWS/i), token(/RANGE/i)),
      $.window_frame_extent
    ),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3927
    primitive_expression: $ => choice(
      $.default
      ,$.null_
      ,$.LOCAL_ID_
      ,$.primitive_constant
      ,$.dollar_action_
    ),

    dollar_action_: $ => token(/\$action/i),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5278
    primitive_constant: $ => choice(
      $.string_lit
      ,$.binary
      ,$.real_
      ,$.decimal_
      ,$.float_
      ,$.money_
      ,$.parameter_
    ),

    binary: $ => token(/0x[0-9A-F]*/),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5283
    money_: $ => seq(field('dollar', token('$')), optional(choice(token('-'),token('+'))), choice($.real_, $.float_)),

    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L3919-L3921
    parameter_: $ => token('?'),


    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlLexer.g4#L1231
    real_: $ => seq(
      choice(DECIMAL,DEC_DOT_DEC)
      ,token(/E/i)
      ,optional(choice(token('+'),token('-')))
      ,token(/[0-9]+/)),

    float_: $ => DEC_DOT_DEC,
    decimal_: $ => DECIMAL,

    //
    // HELPERS
    //

    // Word token for keyword extraction optimization
    // This must match the identifier pattern so tree-sitter can extract keywords
    _word: $ => /[A-Za-z_#][A-Za-z_#$@0-9]*/,

    //https://msdn.microsoft.com/en-us/library/ms175874.aspx
    TEMP_ID_: $ => token(prec(1, /##?[A-Za-z_][A-Za-z_$@0-9]*/)),

    id_: $ => choice(
      $._word
      ,$.TEMP_ID_
      ,SQUARE_BRACKET_ID
      ,DOUBLE_QUOTE_ID
      ,$.keyword
      //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L6261
    ),

    //TODO https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L5287
    keyword: $ => choice(
      token(/GO/i)
    ),

    integer: $ => INT,

    placeholder: $ => alias('TODO', $.dummy),

  }
});
