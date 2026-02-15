const { COMMA
       ,parens
       ,parensComma } = require('./utils.js');

module.exports = {
    //https://github.com/antlr/grammars-v4/blob/master/sql/tsql/TSqlParser.g4#L4338
    built_in_functions: $ => choice(
      // 0-arg: APP_NAME, ORIGINAL_DB_NAME, SCOPE_IDENTITY
      seq($._builtin_0arg, parens())

      // 0-or-1 arg: DB_ID, DB_NAME, SCHEMA_ID, SCHEMA_NAME
      ,seq($._builtin_0or1, parens(optional($.expression)))

      // 1-arg: FILE_ID, FILE_IDEX, FILE_NAME, FILEGROUP_ID, FILEGROUP_NAME,
      //        FULLTEXTSERVICEPROPERTY, OBJECT_DEFINITION, SERVERPROPERTY, TYPE_ID, TYPE_NAME
      ,seq($._builtin_1arg, parens($.expression))

      // 1-or-2 arg: OBJECT_ID, OBJECT_NAME, OBJECT_SCHEMA_NAME
      ,seq($._builtin_1or2, parens(seq($.expression
                               ,optional(seq(COMMA, $.expression)))))

      // 2-arg: ASSEMBLYPROPERTY, COL_LENGTH, COL_NAME, DATABASEPROPERTYEX,
      //        FILEGROUPPROPERTY, FILEPROPERTY, FILEPROPERTYEX,
      //        FULLTEXTCATALOGPROPERTY, OBJECTPROPERTY, OBJECTPROPERTYEX,
      //        PARSENAME, STATS_DATE, TYPEPROPERTY
      ,seq($._builtin_2arg, parensComma($.expression, $.expression))

      // 3-arg: APPLOCK_MODE, COLUMNPROPERTY, INDEX_COL, INDEXPROPERTY
      ,seq($._builtin_3arg, parensComma($.expression, $.expression, $.expression))

      // 4-arg: APPLOCK_TEST, INDEXKEY_PROPERTY
      ,seq($._builtin_4arg, parensComma($.expression, $.expression, $.expression, $.expression))

      // NEXT VALUE FOR — multi-token keyword + OVER clause, keep individual
      ,seq($.next_value_for_, field('sequence_name', $.table_name)
          ,optional(seq($.over_, parens($.order_by_clause))))
    ),

    _builtin_0arg: $ => token(choice(
      /APP_NAME/i,
      /ORIGINAL_DB_NAME/i,
      /SCOPE_IDENTITY/i,
    )),

    _builtin_0or1: $ => token(choice(
      /DB_ID/i,
      /DB_NAME/i,
      /SCHEMA_ID/i,
      /SCHEMA_NAME/i,
    )),

    _builtin_1arg: $ => token(choice(
      /FILE_ID/i,
      /FILE_IDEX/i,
      /FILE_NAME/i,
      /FILEGROUP_ID/i,
      /FILEGROUP_NAME/i,
      /FULLTEXTSERVICEPROPERTY/i,
      /OBJECT_DEFINITION/i,
      /SERVERPROPERTY/i,
      /TYPE_ID/i,
      /TYPE_NAME/i,
    )),

    _builtin_1or2: $ => token(choice(
      /OBJECT_ID/i,
      /OBJECT_NAME/i,
      /OBJECT_SCHEMA_NAME/i,
    )),

    _builtin_2arg: $ => token(choice(
      /ASSEMBLYPROPERTY/i,
      /COL_LENGTH/i,
      /COL_NAME/i,
      /DATABASEPROPERTYEX/i,
      /FILEGROUPPROPERTY/i,
      /FILEPROPERTY/i,
      /FILEPROPERTYEX/i,
      /FULLTEXTCATALOGPROPERTY/i,
      /OBJECTPROPERTY/i,
      /OBJECTPROPERTYEX/i,
      /PARSENAME/i,
      /STATS_DATE/i,
      /TYPEPROPERTY/i,
    )),

    _builtin_3arg: $ => token(choice(
      /APPLOCK_MODE/i,
      /COLUMNPROPERTY/i,
      /INDEX_COL/i,
      /INDEXPROPERTY/i,
    )),

    _builtin_4arg: $ => token(choice(
      /APPLOCK_TEST/i,
      /INDEXKEY_PROPERTY/i,
    )),

    next_value_for_: $ => seq(token(/NEXT/i),token(/VALUE/i),token(/FOR/i)),

};
