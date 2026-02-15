const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/data-type-functions-transact-sql
  datatype_functions: $ => choice(
    seq($._datatype_1arg, parens($.expression))
    ,seq($.sql_variant_property_, parensComma($.expression, $.expression))
  ),

  _datatype_1arg: $ => token(choice(
    /DATALENGTH/i,
    /IDENT_CURRENT/i,
    /IDENT_INCR/i,
    /IDENT_SEED/i,
  )),

  sql_variant_property_: $ => token(/SQL_VARIANT_PROPERTY/i),
};
