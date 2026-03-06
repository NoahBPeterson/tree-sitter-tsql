const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/data-type-functions-transact-sql
  datatype_functions: $ => choice(
    seq($._datatype_1arg, parens($.expression))
    ,seq($._datatype_2arg, parensComma($.expression, $.expression))
  ),

  _datatype_1arg: $ => token(choice(
    /DATALENGTH/i,
    /IDENT_CURRENT/i,
    /IDENT_INCR/i,
    /IDENT_SEED/i,
    /TEXTPTR/i,
  )),

  _datatype_2arg: $ => token(choice(
    /SQL_VARIANT_PROPERTY/i,
    /TEXTVALID/i,
  )),
};
