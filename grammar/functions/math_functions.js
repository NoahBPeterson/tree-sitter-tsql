const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/mathematical-functions-transact-sql
  math_functions: $ => choice(
    seq($.abs_, parens($.expression))
    ,seq($.acos_, parens($.expression))
    ,seq($.asin_, parens($.expression))
    ,seq($.atan_, parens($.expression))
    ,seq($.atn2_, parensComma($.expression, $.expression))
    ,seq($.ceiling_, parens($.expression))
    ,seq($.cos_, parens($.expression))
    ,seq($.cot_, parens($.expression))
    ,seq($.degrees_, parens($.expression))
    ,seq($.exp_, parens($.expression))
    ,seq($.floor_, parens($.expression))
    ,seq($.log_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.log10_, parens($.expression))
    ,seq($.pi_, parens())
    ,seq($.power_, parensComma($.expression, $.expression))
    ,seq($.radians_, parens($.expression))
    ,seq($.rand_, parens(optional($.expression)))
    ,seq($.round_, parens($.expression, token(','), $.expression, optional(seq(token(','), $.expression))))
    ,seq($.sign_, parens($.expression))
    ,seq($.sin_, parens($.expression))
    ,seq($.sqrt_, parens($.expression))
    ,seq($.square_, parens($.expression))
    ,seq($.tan_, parens($.expression))
  ),

  abs_: $ => token(/ABS/i),
  acos_: $ => token(/ACOS/i),
  asin_: $ => token(/ASIN/i),
  atan_: $ => token(/ATAN/i),
  atn2_: $ => token(/ATN2/i),
  ceiling_: $ => token(/CEILING/i),
  cos_: $ => token(/COS/i),
  cot_: $ => token(/COT/i),
  degrees_: $ => token(/DEGREES/i),
  exp_: $ => token(/EXP/i),
  floor_: $ => token(/FLOOR/i),
  log_: $ => token(/LOG/i),
  log10_: $ => token(/LOG10/i),
  pi_: $ => token(/PI/i),
  power_: $ => token(/POWER/i),
  radians_: $ => token(/RADIANS/i),
  rand_: $ => token(/RAND/i),
  round_: $ => token(/ROUND/i),
  sign_: $ => token(/SIGN/i),
  sin_: $ => token(/SIN/i),
  sqrt_: $ => token(/SQRT/i),
  square_: $ => token(/SQUARE/i),
  tan_: $ => token(/TAN/i),
};
