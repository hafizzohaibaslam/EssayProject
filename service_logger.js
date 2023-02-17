const log4js = require('log4js');
log4js.configure('./config/log4js.json');
const logger = log4js.getLogger("default");
const loggerIngestion = log4js.getLogger("ingestion");



module.exports.logger = logger;
module.exports.loggerIngestion = loggerIngestion;


/* Levels of the Log4js
  ALL: new Level(Number.MIN_VALUE, "ALL"),
  TRACE: new Level(5000, "TRACE"),
  DEBUG: new Level(10000, "DEBUG"),
  INFO: new Level(20000, "INFO"),
  WARN: new Level(30000, "WARN"),
  ERROR: new Level(40000, "ERROR"),
  FATAL: new Level(50000, "FATAL"),
  MARK: new Level(9007199254740992, "MARK"), // 2^53
  OFF: new Level(Number.MAX_VALUE, "OFF")
*/