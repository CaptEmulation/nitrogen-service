var passport = require('passport')
  , services = require('../services')
  , utils = require('../utils');

module.exports = function(req, res, next) {
    var auth = passport.authenticate(['bearer'], { session: false });
    req.pause();
    auth(req, res, function(err) {
        if (err) return res.send(401, { error: err });

        req.resume();
        // opportunistically update the last connection details for this principal.
        if (req.user && req.ips) {
            services.principals.updateLastConnection(req.user, utils.ipFromRequest(req));
        }

        next();
    });
};
