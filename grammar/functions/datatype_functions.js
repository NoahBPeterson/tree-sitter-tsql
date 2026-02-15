const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/data-type-functions-transact-sql
  datatype_functions: $ => choice(
    seq($.datalength_, parens($.expression))
    ,seq($.ident_current_, parens($.expression))
    ,seq($.ident_incr_, parens($.expression))
    ,seq($.ident_seed_, parens($.expression))
    ,seq($.sql_variant_property_, parensComma($.expression, $.expression))
  ),

  datalength_: $ => token(/DATALENGTH/i),
  ident_current_: $ => token(/IDENT_CURRENT/i),
  ident_incr_: $ => token(/IDENT_INCR/i),
  ident_seed_: $ => token(/IDENT_SEED/i),
  sql_variant_property_: $ => token(/SQL_VARIANT_PROPERTY/i),
};
