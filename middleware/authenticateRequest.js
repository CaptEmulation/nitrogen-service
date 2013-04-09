var passport = require('passport')
  , services = require('../services');

module.exports = function(req, res, next) {
    var auth = passport.authenticate(['bearer'], { session: false });
    auth(req, res, function() {

        // opportunistically update the last connection details for this principal.
        if (req.user) {
            services.principals.updateLastConnection(req.user, req.connection.remoteAddress);
        }

        next();
    });

};