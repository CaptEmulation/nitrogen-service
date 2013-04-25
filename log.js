var config = require('./config')
  , Loggly = require('winston-loggly').Loggly
  , winston = require('winston');

var log = new (winston.Logger)();

if (config.loggly) {
    log.add(winston.transports.Loggly, config.loggly);
}

if (process.env.NODE_ENV != "production") {
    log.add(winston.transports.Console);
}

module.exports = log;
