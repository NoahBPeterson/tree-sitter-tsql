const { parens } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/logical-functions-transact-sql
  logical_functions: $ => choice(
    seq($._logical_variadic, parens($.expression, token(','), $.expression, repeat(seq(token(','), $.expression))))
  ),

  _logical_variadic: $ => token(choice(
    /GREATEST/i,
    /LEAST/i,
  )),
};
