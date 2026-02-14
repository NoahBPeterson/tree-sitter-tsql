const { parens, parensComma } = require('../utils.js');

//https://learn.microsoft.com/en-us/sql/t-sql/functions/conversion-functions-transact-sql?view=sql-server-ver16
module.exports = {
  conversion_functions: $ => choice(
    // CAST(expression AS data_type)
    seq($.cast_, parens($.expression, $.as, $.data_type))
    // TRY_CAST(expression AS data_type)
    ,seq($.try_cast_, parens($.expression, $.as, $.data_type))
    // CONVERT(data_type, expression [, style])
    ,seq($.convert_, parens($.data_type, token(','), $.expression, optional(seq(token(','), $.expression))))
    // TRY_CONVERT(data_type, expression [, style])
    ,seq($.try_convert_, parens($.data_type, token(','), $.expression, optional(seq(token(','), $.expression))))
    // PARSE(expression AS data_type [USING culture])
    ,seq($.parse_, parens($.expression, $.as, $.data_type, optional(seq(token(/USING/i), $.expression))))
    // TRY_PARSE(expression AS data_type [USING culture])
    ,seq($.try_parse_, parens($.expression, $.as, $.data_type, optional(seq(token(/USING/i), $.expression))))
  ),

  cast_: $ => token(/CAST/i),
  convert_: $ => token(/CONVERT/i),
  try_cast_: $ => token(/TRY_CAST/i),
  try_convert_: $ => token(/TRY_CONVERT/i),
  try_parse_: $ => token(/TRY_PARSE/i),

};
