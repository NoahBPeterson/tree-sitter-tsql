const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/system-functions-transact-sql
  system_functions: $ => choice(
    seq($.compress_, parens($.expression))
    ,seq($.connectionproperty_, parens($.expression))
    ,seq($.context_info_, parens())
    ,seq($.current_request_id_, parens())
    ,seq($.current_transaction_id_, parens())
    ,seq($.decompress_, parens($.expression))
    ,seq($.error_line_, parens())
    ,seq($.error_message_, parens())
    ,seq($.error_number_, parens())
    ,seq($.error_procedure_, parens())
    ,seq($.error_severity_, parens())
    ,seq($.error_state_, parens())
    ,seq($.formatmessage_, parens($.expression, repeat(seq(token(','), $.expression))))
    ,seq($.get_filestream_transaction_context_, parens())
    ,seq($.getansinull_, parens(optional($.expression)))
    ,seq($.host_id_, parens())
    ,seq($.host_name_, parens())
    ,seq($.isnull_, parensComma($.expression, $.expression))
    ,seq($.isnumeric_, parens($.expression))
    ,seq($.min_active_rowversion_, parens())
    ,seq($.newid_, parens())
    ,seq($.newsequentialid_, parens())
    ,seq($.rowcount_big_, parens())
    ,seq($.session_context_, parens($.expression))
    ,seq($.xact_state_, parens())
  ),

  compress_: $ => token(/COMPRESS/i),
  connectionproperty_: $ => token(/CONNECTIONPROPERTY/i),
  context_info_: $ => token(/CONTEXT_INFO/i),
  current_request_id_: $ => token(/CURRENT_REQUEST_ID/i),
  current_transaction_id_: $ => token(/CURRENT_TRANSACTION_ID/i),
  decompress_: $ => token(/DECOMPRESS/i),
  error_line_: $ => token(/ERROR_LINE/i),
  error_message_: $ => token(/ERROR_MESSAGE/i),
  error_number_: $ => token(/ERROR_NUMBER/i),
  error_procedure_: $ => token(/ERROR_PROCEDURE/i),
  error_severity_: $ => token(/ERROR_SEVERITY/i),
  error_state_: $ => token(/ERROR_STATE/i),
  formatmessage_: $ => token(/FORMATMESSAGE/i),
  get_filestream_transaction_context_: $ => token(/GET_FILESTREAM_TRANSACTION_CONTEXT/i),
  getansinull_: $ => token(/GETANSINULL/i),
  host_id_: $ => token(/HOST_ID/i),
  host_name_: $ => token(/HOST_NAME/i),
  isnull_: $ => token(/ISNULL/i),
  isnumeric_: $ => token(/ISNUMERIC/i),
  min_active_rowversion_: $ => token(/MIN_ACTIVE_ROWVERSION/i),
  newid_: $ => token(/NEWID/i),
  newsequentialid_: $ => token(/NEWSEQUENTIALID/i),
  rowcount_big_: $ => token(/ROWCOUNT_BIG/i),
  session_context_: $ => token(/SESSION_CONTEXT/i),
  xact_state_: $ => token(/XACT_STATE/i),
};
