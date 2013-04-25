module.exports.stringEndsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
};

module.exports.ipFromRequest = function(req) {
    var ipParts = req.ip.split(":");
    if (ipParts.length)
    	return ipParts[0];
    else
    	return req.ip;
};

module.exports.parseQuery = function(req) {
    var query = {};
    if (req.query.q) {
        query = JSON.parse(req.query.q);
    }

    return query;
};

module.exports.parseOptions = function(req) {
    var options = {};

    if (req.query.options) {
        options = JSON.parse(req.query.options);
    }

    if (!options.limit || options.limit > 1000) options.limit = 1000;

    return options;
}
