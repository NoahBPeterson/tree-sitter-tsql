const { parens } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/cursor-functions-transact-sql
  cursor_functions: $ => choice(
    $._cursor_global_var
    ,seq($.cursor_status_, parens($.expression, token(','), $.expression))
  ),

  _cursor_global_var: $ => token(prec(1, choice(
    '@@CURSOR_ROWS',
    '@@FETCH_STATUS',
  ))),

  cursor_status_: $ => token(/CURSOR_STATUS/i),
};
