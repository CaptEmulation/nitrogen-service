var passport = require('passport')
  , services = require('../services')
  , utils = require('../utils');

module.exports = function(req, res, next) {
    var auth = passport.authenticate(['bearer'], { session: false });
    auth(req, res, function(err) {
        if (err) return res.send(401, { error: err });

        // opportunistically update the last connection details for this principal.
        if (req.user && req.ips) {
            services.principals.updateLastConnection(req.user, utils.ipFromRequest(req));
        }

        next();
    });
};
