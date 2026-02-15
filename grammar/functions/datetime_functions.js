const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/date-and-time-data-types-and-functions-transact-sql
  datetime_functions: $ => choice(
    // bare keyword
    $.current_timestamp_
    // 0-arg group
    ,seq($._datetime_0arg, parens())
    // 1-arg group
    ,seq($._datetime_1arg, parens($.expression))
    // 2-arg group
    ,seq($._datetime_2arg, parensComma($.expression, $.expression))
    // datepart + 1 expr
    ,seq($._datetime_datepart_2arg, parens($.datepart, token(','), $.expression))
    // datepart + 2 expr
    ,seq($._datetime_datepart_3arg, parens($.datepart, token(','), $.expression, token(','), $.expression))
    // 5-arg group
    ,seq($._datetime_5arg, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    // Keep individual: special signatures
    ,seq($.datefromparts_, parensComma($.expression, $.expression, $.expression))
    ,seq($.eomonth_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.datetime2fromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.datetimefromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.datetimeoffsetfromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
  ),

  // https://learn.microsoft.com/en-us/sql/t-sql/functions/datepart-transact-sql#arguments
  datepart: $ => choice(
    token(/YEAR/i), token(/YY/i), token(/YYYY/i),
    token(/QUARTER/i), token(/QQ/i), token(/Q/i),
    token(/MONTH/i), token(/MM/i), token(/M/i),
    token(/DAYOFYEAR/i), token(/DY/i),
    token(/DAY/i), token(/DD/i), token(/D/i),
    token(/WEEK/i), token(/WK/i), token(/WW/i),
    token(/WEEKDAY/i), token(/DW/i),
    token(/HOUR/i), token(/HH/i),
    token(/MINUTE/i), token(/MI/i), token(/N/i),
    token(/SECOND/i), token(/SS/i), token(/S/i),
    token(/MILLISECOND/i), token(/MS/i),
    token(/MICROSECOND/i), token(/MCS/i),
    token(/NANOSECOND/i), token(/NS/i),
    token(/ISO_WEEK/i), token(/ISOWK/i), token(/ISOWW/i),
    token(/TZOFFSET/i), token(/TZ/i),
  ),

  _datetime_0arg: $ => token(choice(
    /CURRENT_TIMEZONE/i,
    /CURRENT_TIMEZONE_ID/i,
    /GETDATE/i,
    /GETUTCDATE/i,
    /SYSDATETIME/i,
    /SYSDATETIMEOFFSET/i,
    /SYSUTCDATETIME/i,
  )),

  _datetime_1arg: $ => token(choice(
    /DAY/i,
    /ISDATE/i,
    /MONTH/i,
    /YEAR/i,
  )),

  _datetime_2arg: $ => token(choice(
    /SWITCHOFFSET/i,
    /TODATETIMEOFFSET/i,
  )),

  _datetime_datepart_2arg: $ => token(choice(
    /DATENAME/i,
    /DATEPART/i,
    /DATETRUNC/i,
  )),

  _datetime_datepart_3arg: $ => token(choice(
    /DATE_BUCKET/i,
    /DATEADD/i,
    /DATEDIFF/i,
    /DATEDIFF_BIG/i,
  )),

  _datetime_5arg: $ => token(choice(
    /SMALLDATETIMEFROMPARTS/i,
    /TIMEFROMPARTS/i,
  )),

  current_timestamp_: $ => token(/CURRENT_TIMESTAMP/i),
  datefromparts_: $ => token(/DATEFROMPARTS/i),
  eomonth_: $ => token(/EOMONTH/i),
  datetime2fromparts_: $ => token(/DATETIME2FROMPARTS/i),
  datetimefromparts_: $ => token(/DATETIMEFROMPARTS/i),
  datetimeoffsetfromparts_: $ => token(/DATETIMEOFFSETFROMPARTS/i),
};
