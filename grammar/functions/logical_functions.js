const { parens } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/logical-functions-transact-sql
  logical_functions: $ => choice(
    seq($.greatest_, parens($.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
    ,seq($.least_, parens($.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
  ),

  greatest_: $ => token(/GREATEST/i),
  least_: $ => token(/LEAST/i),
};
