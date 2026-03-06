const { parens, parensComma } = require('../utils.js');

module.exports = {
  // https://learn.microsoft.com/en-us/sql/t-sql/functions/cryptographic-functions-transact-sql
  cryptography_functions: $ => choice(
    seq($._crypto_1arg, parens($.expression))
    ,seq($._crypto_2arg, parensComma($.expression, $.expression))
    ,seq($._crypto_1or2, parens($.expression, optional(seq(token(','), $.expression))))
    ,seq($._crypto_3arg, parensComma($.expression, $.expression, $.expression))
    ,seq($._crypto_4arg, parensComma($.expression, $.expression, $.expression, $.expression))
  ),

  _crypto_1arg: $ => token(choice(
    /CERT_ID/i,
    /KEY_ID/i,
    /KEY_GUID/i,
    /KEY_NAME/i,
    /ASYMKEY_ID/i,
    /DECRYPTBYKEY/i,
  )),

  _crypto_2arg: $ => token(choice(
    /HASHBYTES/i,
    /ENCRYPTBYKEY/i,
    /ENCRYPTBYCERT/i,
    /DECRYPTBYCERT/i,
    /ENCRYPTBYASYMKEY/i,
    /DECRYPTBYASYMKEY/i,
    /ENCRYPTBYPASSPHRASE/i,
    /DECRYPTBYPASSPHRASE/i,
    /SIGNBYASYMKEY/i,
    /SIGNBYCERT/i,
    /CERTPROPERTY/i,
    /ASYMKEYPROPERTY/i,
    /SYMKEYPROPERTY/i,
  )),

  _crypto_1or2: $ => token(choice(
    /CRYPT_GEN_RANDOM/i,
  )),

  _crypto_3arg: $ => token(choice(
    /VERIFYSIGNEDBYCERT/i,
    /VERIFYSIGNEDBYASYMKEY/i,
  )),

  _crypto_4arg: $ => token(choice(
    /IS_OBJECTSIGNED/i,
  )),
};
