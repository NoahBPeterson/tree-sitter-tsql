const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/mathematical-functions-transact-sql
  math_functions: $ => choice(
    // 1-arg group
    seq($._math_1arg, parens($.expression))
    // 2-arg group
    ,seq($._math_2arg, parensComma($.expression, $.expression))
    // Keep individual: special signatures
    ,seq($.pi_, parens())
    ,seq($.log_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.rand_, parens(optional($.expression)))
    ,seq($.round_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
  ),

  _math_1arg: $ => token(choice(
    /ABS/i,
    /ACOS/i,
    /ASIN/i,
    /ATAN/i,
    /CEILING/i,
    /COS/i,
    /COT/i,
    /DEGREES/i,
    /EXP/i,
    /FLOOR/i,
    /LOG10/i,
    /RADIANS/i,
    /SIGN/i,
    /SIN/i,
    /SQRT/i,
    /SQUARE/i,
    /TAN/i,
  )),

  _math_2arg: $ => token(choice(
    /ATN2/i,
    /POWER/i,
  )),

  pi_: $ => token(/PI/i),
  log_: $ => token(/LOG/i),
  rand_: $ => token(/RAND/i),
  round_: $ => token(/ROUND/i),
};
