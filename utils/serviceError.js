var util = require('util');

var ServiceError = function(details) {
    Error.captureStackTrace(this, this);
    for(var key in details) {
        this[key] = details[key];
    }
};

util.inherits(ServiceError, Error);

module.exports = ServiceError;
