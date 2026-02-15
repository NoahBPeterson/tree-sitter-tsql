const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/security-functions-transact-sql
  security_functions: $ => choice(
    // bare keywords (no parens)
    $._security_bare
    // 0-or-1 arg
    ,seq($._security_0or1, parens(optional($.expression)))
    // 1-arg
    ,seq($._security_1arg, parens($.expression))
    // 1-or-2 arg
    ,seq($._security_1or2, parens($.expression, optional(seq(token(','), $.expression))))
    // 2-arg
    ,seq($._security_2arg, parensComma($.expression, $.expression))
    // Keep individual: special signatures
    ,seq($.original_login_, parens())
    ,seq($.has_perms_by_name_, parens($.expression, token(','), $.expression, token(','), $.expression, optional(seq(token(','), $.expression, optional(seq(token(','), $.expression))))))
    ,seq($.permissions_, parens(optional(seq($.expression, optional(seq(token(','), $.expression))))))
  ),

  _security_bare: $ => token(choice(
    /CURRENT_USER/i,
    /SESSION_USER/i,
    /SYSTEM_USER/i,
  )),

  _security_0or1: $ => token(choice(
    /DATABASE_PRINCIPAL_ID/i,
    /SUSER_ID/i,
    /SUSER_NAME/i,
    /SUSER_SID/i,
    /SUSER_SNAME/i,
    /USER_ID/i,
    /USER_NAME/i,
  )),

  _security_1arg: $ => token(choice(
    /CERTENCODED/i,
    /HAS_DBACCESS/i,
    /IS_MEMBER/i,
    /PWDENCRYPT/i,
    /SESSIONPROPERTY/i,
  )),

  _security_1or2: $ => token(choice(
    /CERTPRIVATEKEY/i,
    /IS_ROLEMEMBER/i,
    /IS_SRVROLEMEMBER/i,
  )),

  _security_2arg: $ => token(choice(
    /LOGINPROPERTY/i,
    /PWDCOMPARE/i,
  )),

  original_login_: $ => token(/ORIGINAL_LOGIN/i),
  has_perms_by_name_: $ => token(/HAS_PERMS_BY_NAME/i),
  permissions_: $ => token(/PERMISSIONS/i),
};
