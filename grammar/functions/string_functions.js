const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/string-functions-transact-sql
  // NOTE: CHAR and NCHAR tokens are defined in data_types.js (shared with data type rules)
  string_functions: $ => choice(
    seq($.ascii_, parens($.expression))
    ,seq($.char_, parens($.expression))
    ,seq($.charindex_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
    ,seq($.concat_, parens($.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
    ,seq($.concat_ws_, parens($.expression, token(','), $.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
    ,seq($.difference_, parensComma($.expression, $.expression))
    ,seq($.format_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
    ,seq($.len_, parens($.expression))
    ,seq($.lower_, parens($.expression))
    ,seq($.ltrim_, parens($.expression))
    ,seq($.nchar_, parens($.expression))
    ,seq($.patindex_, parensComma($.expression, $.expression))
    ,seq($.quotename_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.replace_, parensComma($.expression, $.expression, $.expression))
    ,seq($.replicate_, parensComma($.expression, $.expression))
    ,seq($.reverse_, parens($.expression))
    ,seq($.rtrim_, parens($.expression))
    ,seq($.soundex_, parens($.expression))
    ,seq($.space_, parens($.expression))
    ,seq($.str_, parens($.expression, optional(seq(token(','), $.expression, optional(seq(token(','), $.expression))))))
    ,seq($.string_escape_, parensComma($.expression, $.expression))
    ,seq($.stuff_, parensComma($.expression, $.expression, $.expression, $.expression))
    ,seq($.substring_, parensComma($.expression, $.expression, $.expression))
    ,seq($.translate_, parensComma($.expression, $.expression, $.expression))
    ,seq($.trim_, parens($.expression))
    ,seq($.unicode_, parens($.expression))
    ,seq($.upper_, parens($.expression))
  ),

  ascii_: $ => token(/ASCII/i),
  // char_ defined in data_types.js
  charindex_: $ => token(/CHARINDEX/i),
  concat_: $ => token(/CONCAT/i),
  concat_ws_: $ => token(/CONCAT_WS/i),
  difference_: $ => token(/DIFFERENCE/i),
  format_: $ => token(/FORMAT/i),
  len_: $ => token(/LEN/i),
  lower_: $ => token(/LOWER/i),
  ltrim_: $ => token(/LTRIM/i),
  // nchar_ defined in data_types.js
  patindex_: $ => token(/PATINDEX/i),
  quotename_: $ => token(/QUOTENAME/i),
  replace_: $ => token(/REPLACE/i),
  replicate_: $ => token(/REPLICATE/i),
  reverse_: $ => token(/REVERSE/i),
  rtrim_: $ => token(/RTRIM/i),
  soundex_: $ => token(/SOUNDEX/i),
  space_: $ => token(/SPACE/i),
  str_: $ => token(/STR/i),
  string_escape_: $ => token(/STRING_ESCAPE/i),
  stuff_: $ => token(/STUFF/i),
  substring_: $ => token(/SUBSTRING/i),
  translate_: $ => token(/TRANSLATE/i),
  trim_: $ => token(/TRIM/i),
  unicode_: $ => token(/UNICODE/i),
  upper_: $ => token(/UPPER/i),
};
