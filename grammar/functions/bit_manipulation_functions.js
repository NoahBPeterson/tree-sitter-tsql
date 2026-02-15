const { parens, parensComma } = require('../utils.js');

module.exports = {
  bit_manipulation_functions: $ => choice(
    // 2-arg function form: LEFT_SHIFT(a,b), RIGHT_SHIFT(a,b), GET_BIT(a,b)
    seq($._bitman_2arg, parensComma($.expression,$.expression)),

    // Operator forms: a << b, a >> b
    prec.left(seq($.expression, $.left_shift_operator_, $.expression)),
    prec.left(seq($.expression, $.right_shift_operator_, $.expression)),

    seq($.bit_count_, parens($.expression)),
    seq($.set_bit_, parensComma($.expression,$.expression)),
    seq($.set_bit_, parensComma($.expression,$.expression,$.expression)),
  ),

  _bitman_2arg: $ => token(choice(
    /LEFT_SHIFT/i,
    /RIGHT_SHIFT/i,
    /GET_BIT/i,
  )),

  left_shift_operator_: $ => token(/<</),
  right_shift_operator_: $ => token(/>>/),
  bit_count_: $ => token(/BIT_COUNT/i),
  set_bit_: $ => token(/SET_BIT/i),
};
