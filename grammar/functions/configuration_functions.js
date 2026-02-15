//https://learn.microsoft.com/en-us/sql/t-sql/functions/configuration-functions-transact-sql?view=sql-server-ver16
module.exports = {
  configuration_functions: $ => $._config_global_var,

  _config_global_var: $ => token(prec(1, choice(
    '@@DATEFIRST',
    '@@DBTS',
    '@@LANGID',
    '@@LANGUAGE',
    '@@LOCK_TIMEOUT',
    '@@MAX_CONNECTIONS',
    '@@MAX_PRECISION',
    '@@NESTLEVEL',
    '@@OPTIONS',
    '@@REMSERVER',
    '@@SERVERNAME',
    '@@SERVICENAME',
    '@@SPID',
    '@@TEXTSIZE',
    '@@VERSION',
  ))),
};
