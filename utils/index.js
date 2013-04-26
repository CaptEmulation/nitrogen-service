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

module.exports = {
    ipFromRequest: ipFromRequest,
    parseQuery: parseQuery,
    parseOptions: parseOptions,
    handleError: handleError,
    sendFailedResponse: sendFailedResponse,
    stringEndsWith: stringEndsWith
};