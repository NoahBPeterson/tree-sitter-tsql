const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/json-functions-transact-sql
  json_functions: $ => choice(
    seq($.isjson_, parens($.expression))
    ,seq($.json_value_, parensComma($.expression, $.expression))
    ,seq($.json_query_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.json_modify_, parensComma($.expression, $.expression, $.expression))
    ,seq($.json_path_exists_, parensComma($.expression, $.expression))
    ,seq($.json_object_, parens(optional(seq($.json_key_value_, repeat(seq(token(','), $.json_key_value_))))))
    ,seq($.json_array_, parens(optional(seq($.expression, repeat(seq(token(','), $.expression))))))
  ),

  json_key_value_: $ => seq($.expression, token(':'), $.expression),

  isjson_: $ => token(/ISJSON/i),
  json_value_: $ => token(/JSON_VALUE/i),
  json_query_: $ => token(/JSON_QUERY/i),
  json_modify_: $ => token(/JSON_MODIFY/i),
  json_path_exists_: $ => token(/JSON_PATH_EXISTS/i),
  json_object_: $ => token(/JSON_OBJECT/i),
  json_array_: $ => token(/JSON_ARRAY/i),
};
