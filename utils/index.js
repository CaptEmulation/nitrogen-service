var dateDaysFromNow = function(days) {
    var date = new Date();
    date.setDate(new Date().getDate() + days);

    return date;
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

    return translateDatesToNative(query);
};

var parseOptions = function(req) {
    var options = {};

    if (req.query.options) {
        options = JSON.parse(req.query.options);
    }

    if (!options.limit || options.limit > 1000) options.limit = 1000;

    return options;
};

var handleError = function(res, err) {
    if (err === 400) return sendFailedResponse(res, 400, err);
    if (err === 401) return sendFailedResponse(res, 401, err);
    if (err === 403) return sendFailedResponse(res, 403, err);
    if (err) return sendFailedResponse(res, 500, err);
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

var translateDatesToNative = function(obj) {
    for (var prop in obj) {
        if (typeof obj[prop] === "object")
        // recursively handle subobjects
            obj[prop] = translateDatesToNative(obj[prop]);
        else if (typeof obj[prop] === "string" &&
                 obj[prop].match(/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/)) {
            obj[prop] = new Date(Date.parse(obj[prop]));
        }
    }

    return obj;
};

module.exports = {
    dateDaysFromNow: dateDaysFromNow,
    ipFromRequest: ipFromRequest,
    parseQuery: parseQuery,
    parseOptions: parseOptions,
    handleError: handleError,
    sendFailedResponse: sendFailedResponse,
    stringEndsWith: stringEndsWith,
    stringStartsWith: stringStartsWith,
    translateDatesToNative: translateDatesToNative
};