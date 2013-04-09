var passport = require('passport')
  , services = require('../services');

module.exports = function(req, res, next) {
    var auth = passport.authenticate(['bearer'], { session: false });
    auth(req, res, function() {

        // opportunistically update the last connection details for this principal.

        if (req.user) {
            req.user.last_connection = new Date();
            req.user.last_ip = req.ip;

            services.principals.update(req.user);
        }

        next();
    });

};