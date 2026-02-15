const { parens } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/cursor-functions-transact-sql
  cursor_functions: $ => choice(
    $.cursor_rows_
    ,$.fetch_status_
    ,seq($.cursor_status_, parens($.expression, token(','), $.expression))
  ),

  cursor_rows_: $ => token('@@CURSOR_ROWS'),
  fetch_status_: $ => token('@@FETCH_STATUS'),
  cursor_status_: $ => token(/CURSOR_STATUS/i),
};
