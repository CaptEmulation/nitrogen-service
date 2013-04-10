module.exports = function(req, res, next) {
    if (req.ip) return next();

    if (req.connection.remoteAddress) {
        req.ip = req.connection.remoteAddress;
        return next();
    }

    if (req.header('x-forwarded-for')) {
        var forwardedEntries = req.header('x-forwarded-for').split(":");
        if (forwardedEntries.length == 2) {
            req.ip = forwardedEntries[0];
        }
    }

    next();
};