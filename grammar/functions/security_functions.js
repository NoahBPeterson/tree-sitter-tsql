const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/security-functions-transact-sql
  security_functions: $ => choice(
    seq($.certencoded_, parens($.expression))
    ,seq($.certprivatekey_, parens($.expression, optional(seq(token(','), $.expression))))
    ,$.current_user_
    ,seq($.database_principal_id_, parens(optional($.expression)))
    ,seq($.has_dbaccess_, parens($.expression))
    ,seq($.has_perms_by_name_, parens($.expression, token(','), $.expression, token(','), $.expression, optional(seq(token(','), $.expression, optional(seq(token(','), $.expression))))))
    ,seq($.is_member_, parens($.expression))
    ,seq($.is_rolemember_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.is_srvrolemember_, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($.loginproperty_, parensComma($.expression, $.expression))
    ,seq($.original_login_, parens())
    ,seq($.permissions_, parens(optional(seq($.expression, optional(seq(token(','), $.expression))))))
    ,seq($.pwdencrypt_, parens($.expression))
    ,seq($.pwdcompare_, parensComma($.expression, $.expression))
    ,$.session_user_
    ,seq($.sessionproperty_, parens($.expression))
    ,seq($.suser_id_, parens(optional($.expression)))
    ,seq($.suser_name_, parens(optional($.expression)))
    ,seq($.suser_sid_, parens(optional($.expression)))
    ,seq($.suser_sname_, parens(optional($.expression)))
    ,$.system_user_
    ,seq($.user_id_, parens(optional($.expression)))
    ,seq($.user_name_, parens(optional($.expression)))
  ),

  certencoded_: $ => token(/CERTENCODED/i),
  certprivatekey_: $ => token(/CERTPRIVATEKEY/i),
  current_user_: $ => token(/CURRENT_USER/i),
  database_principal_id_: $ => token(/DATABASE_PRINCIPAL_ID/i),
  has_dbaccess_: $ => token(/HAS_DBACCESS/i),
  has_perms_by_name_: $ => token(/HAS_PERMS_BY_NAME/i),
  is_member_: $ => token(/IS_MEMBER/i),
  is_rolemember_: $ => token(/IS_ROLEMEMBER/i),
  is_srvrolemember_: $ => token(/IS_SRVROLEMEMBER/i),
  loginproperty_: $ => token(/LOGINPROPERTY/i),
  original_login_: $ => token(/ORIGINAL_LOGIN/i),
  permissions_: $ => token(/PERMISSIONS/i),
  pwdencrypt_: $ => token(/PWDENCRYPT/i),
  pwdcompare_: $ => token(/PWDCOMPARE/i),
  session_user_: $ => token(/SESSION_USER/i),
  sessionproperty_: $ => token(/SESSIONPROPERTY/i),
  suser_id_: $ => token(/SUSER_ID/i),
  suser_name_: $ => token(/SUSER_NAME/i),
  suser_sid_: $ => token(/SUSER_SID/i),
  suser_sname_: $ => token(/SUSER_SNAME/i),
  system_user_: $ => token(/SYSTEM_USER/i),
  user_id_: $ => token(/USER_ID/i),
  user_name_: $ => token(/USER_NAME/i),
};
