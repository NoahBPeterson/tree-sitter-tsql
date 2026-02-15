const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/string-functions-transact-sql
  // NOTE: CHAR and NCHAR tokens are defined in data_types.js (shared with data type rules)
  string_functions: $ => choice(
    // 1-arg group
    seq($._string_1arg, parens($.expression))
    // 2-arg group
    ,seq($._string_2arg, parensComma($.expression, $.expression))
    // 3-arg group
    ,seq($._string_3arg, parensComma($.expression, $.expression, $.expression))
    // Keep individual: shared tokens or special signatures
    ,seq($.char_, parens($.expression))
    ,seq($.nchar_, parens($.expression))
    ,seq($.concat_, parens($.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
    ,seq($.concat_ws_, parens($.expression, token(','), $.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
    ,seq($.charindex_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
    ,seq($.format_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
    ,seq($.quotename_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.str_, parens($.expression, optional(seq(token(','), $.expression, optional(seq(token(','), $.expression))))))
    ,seq($.stuff_, parensComma($.expression, $.expression, $.expression, $.expression))
  ),

  _string_1arg: $ => token(choice(
    /ASCII/i,
    /LEN/i,
    /LOWER/i,
    /LTRIM/i,
    /REVERSE/i,
    /RTRIM/i,
    /SOUNDEX/i,
    /SPACE/i,
    /TRIM/i,
    /UNICODE/i,
    /UPPER/i,
  )),

  _string_2arg: $ => token(choice(
    /DIFFERENCE/i,
    /PATINDEX/i,
    /REPLICATE/i,
    /STRING_ESCAPE/i,
  )),

  _string_3arg: $ => token(choice(
    /REPLACE/i,
    /SUBSTRING/i,
    /TRANSLATE/i,
  )),

  // char_ defined in data_types.js
  charindex_: $ => token(/CHARINDEX/i),
  concat_: $ => token(/CONCAT/i),
  concat_ws_: $ => token(/CONCAT_WS/i),
  format_: $ => token(/FORMAT/i),
  // nchar_ defined in data_types.js
  quotename_: $ => token(/QUOTENAME/i),
  str_: $ => token(/STR/i),
  stuff_: $ => token(/STUFF/i),
};
