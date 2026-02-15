const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/date-and-time-data-types-and-functions-transact-sql
  datetime_functions: $ => choice(
    $.current_timestamp_
    ,seq($.current_timezone_, parens())
    ,seq($.current_timezone_id_, parens())
    ,seq($.date_bucket_, parens($.datepart, token(','), $.expression, token(','), $.expression))
    ,seq($.dateadd_, parens($.datepart, token(','), $.expression, token(','), $.expression))
    ,seq($.datediff_, parens($.datepart, token(','), $.expression, token(','), $.expression))
    ,seq($.datediff_big_, parens($.datepart, token(','), $.expression, token(','), $.expression))
    ,seq($.datefromparts_, parensComma($.expression, $.expression, $.expression))
    ,seq($.datename_, parens($.datepart, token(','), $.expression))
    ,seq($.datepart_, parens($.datepart, token(','), $.expression))
    ,seq($.datetime2fromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.datetimefromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.datetimeoffsetfromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.datetrunc_, parens($.datepart, token(','), $.expression))
    ,seq($.day_, parens($.expression))
    ,seq($.eomonth_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.getdate_, parens())
    ,seq($.getutcdate_, parens())
    ,seq($.isdate_, parens($.expression))
    ,seq($.month_, parens($.expression))
    ,seq($.smalldatetimefromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.switchoffset_, parensComma($.expression, $.expression))
    ,seq($.sysdatetime_, parens())
    ,seq($.sysdatetimeoffset_, parens())
    ,seq($.sysutcdatetime_, parens())
    ,seq($.timefromparts_, parens($.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression, token(','), $.expression))
    ,seq($.todatetimeoffset_, parensComma($.expression, $.expression))
    ,seq($.year_, parens($.expression))
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

  current_timestamp_: $ => token(/CURRENT_TIMESTAMP/i),
  current_timezone_: $ => token(/CURRENT_TIMEZONE/i),
  current_timezone_id_: $ => token(/CURRENT_TIMEZONE_ID/i),
  date_bucket_: $ => token(/DATE_BUCKET/i),
  dateadd_: $ => token(/DATEADD/i),
  datediff_: $ => token(/DATEDIFF/i),
  datediff_big_: $ => token(/DATEDIFF_BIG/i),
  datefromparts_: $ => token(/DATEFROMPARTS/i),
  datename_: $ => token(/DATENAME/i),
  datepart_: $ => token(/DATEPART/i),
  datetime2fromparts_: $ => token(/DATETIME2FROMPARTS/i),
  datetimefromparts_: $ => token(/DATETIMEFROMPARTS/i),
  datetimeoffsetfromparts_: $ => token(/DATETIMEOFFSETFROMPARTS/i),
  datetrunc_: $ => token(/DATETRUNC/i),
  day_: $ => token(/DAY/i),
  eomonth_: $ => token(/EOMONTH/i),
  getdate_: $ => token(/GETDATE/i),
  getutcdate_: $ => token(/GETUTCDATE/i),
  isdate_: $ => token(/ISDATE/i),
  month_: $ => token(/MONTH/i),
  smalldatetimefromparts_: $ => token(/SMALLDATETIMEFROMPARTS/i),
  switchoffset_: $ => token(/SWITCHOFFSET/i),
  sysdatetime_: $ => token(/SYSDATETIME/i),
  sysdatetimeoffset_: $ => token(/SYSDATETIMEOFFSET/i),
  sysutcdatetime_: $ => token(/SYSUTCDATETIME/i),
  timefromparts_: $ => token(/TIMEFROMPARTS/i),
  todatetimeoffset_: $ => token(/TODATETIMEOFFSET/i),
  year_: $ => token(/YEAR/i),
};
