const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/system-functions-transact-sql
  system_functions: $ => choice(
    // 0-arg group
    seq($._system_0arg, parens())
    // 1-arg group
    ,seq($._system_1arg, parens($.expression))
    // Keep individual: special signatures
    ,seq($.formatmessage_, parens($.expression, repeat(seq(token(','), $.expression))))
    ,seq($.getansinull_, parens(optional($.expression)))
    ,seq($.isnull_, parensComma($.expression, $.expression))
  ),

  _system_0arg: $ => token(choice(
    /CONTEXT_INFO/i,
    /CURRENT_REQUEST_ID/i,
    /CURRENT_TRANSACTION_ID/i,
    /ERROR_LINE/i,
    /ERROR_MESSAGE/i,
    /ERROR_NUMBER/i,
    /ERROR_PROCEDURE/i,
    /ERROR_SEVERITY/i,
    /ERROR_STATE/i,
    /GET_FILESTREAM_TRANSACTION_CONTEXT/i,
    /HOST_ID/i,
    /HOST_NAME/i,
    /MIN_ACTIVE_ROWVERSION/i,
    /NEWID/i,
    /NEWSEQUENTIALID/i,
    /ROWCOUNT_BIG/i,
    /XACT_STATE/i,
  )),

  _system_1arg: $ => token(choice(
    /COMPRESS/i,
    /CONNECTIONPROPERTY/i,
    /DECOMPRESS/i,
    /ISNUMERIC/i,
    /SESSION_CONTEXT/i,
  )),

  formatmessage_: $ => token(/FORMATMESSAGE/i),
  getansinull_: $ => token(/GETANSINULL/i),
  isnull_: $ => token(/ISNULL/i),
};
