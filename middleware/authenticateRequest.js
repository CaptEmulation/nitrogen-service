var passport = require('passport');

module.exports = function(req, res, next) {
//    if (req.user) { return next() } // already authenticated via session cookie
    passport.authenticate(['bearer'], { session: false })(req, res, next);
};