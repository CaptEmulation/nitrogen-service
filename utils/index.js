var fs = require('fs')
  , log = require('../log')
  , mongoose = require('mongoose');

var dateDaysFromNow = function(days) {
    var date = new Date();
    date.setDate(new Date().getDate() + days);

    return date;
};

var handleError = function(res, err) {
    if (err === 400) return sendFailedResponse(res, 400, err);
    if (err === 401) return sendFailedResponse(res, 401, err);
    if (err === 403) return sendFailedResponse(res, 403, err);
    if (err === 404) return sendFailedResponse(res, 404, err);
    if (err) return sendFailedResponse(res, 400, err);
};

var ipFromRequest = function(req) {
    var ipParts = req.ip.split(":");
    if (ipParts.length)
    	return ipParts[0];
    else
    	return req.ip;
};

var parseQuery = function(req) {
    var query = {};
    if (req.query.q) {
        query = JSON.parse(req.query.q);
    }

    return query;
};

var parseOptions = function(req) {
    var options = {};

    if (req.query.options) {
        options = JSON.parse(req.query.options);
    }

    if (!options.limit || options.limit > 10000) options.limit = 10000;

    return options;
};

var pipeFile = function(filename) {
    return function(req, res) {
        fs.exists(filename, function(exists) {
            if (!exists) return log.error('pipeFile: path ' + filename + ' not found.');

            fs.createReadStream(filename).pipe(res);
        });
    }
};

var sendFailedResponse = function(res, statusCode, err) {
    res.send(statusCode, { error: err });
};

var stringEndsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
};

var stringStartsWith = function(s, prefix) {
    return s.substr(0, prefix.length) === prefix;
};

// convert dates to Date objects and string objectIds to objectIds
var translateQuery = function(obj, options) {
    for (var prop in obj) {
        if (typeof obj[prop] === "object")

            // recursively handle subobjects
            obj[prop] = translateQuery(obj[prop], options);

        else if (options.objectIdFields && options.objectIdFields.indexOf(prop) != -1) {

            if (Object.prototype.toString.call(obj[prop]) === '[object Array]') {
                obj[prop] = obj[prop].map(function(objectIdString) {
                    return mongoose.Types.ObjectId.fromString(objectIdString);
                });
            } else {
                obj[prop] = mongoose.Types.ObjectId.fromString(obj[prop]);
            }

        } else if (options.dateFields && options.dateFields.indexOf(prop) != -1) {

            obj[prop] = new Date(Date.parse(obj[prop]));

        }
    }

    return obj;
};

module.exports = {
    dateDaysFromNow: dateDaysFromNow,
    ipFromRequest: ipFromRequest,
    handleError: handleError,
    parseQuery: parseQuery,
    parseOptions: parseOptions,
    pipeFile: pipeFile,
    sendFailedResponse: sendFailedResponse,
    stringEndsWith: stringEndsWith,
    stringStartsWith: stringStartsWith,
    translateQuery: translateQuery
};