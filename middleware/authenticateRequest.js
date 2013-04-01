var passport = require('passport');

module.exports = function(req, res, next) {
    console.log("AUTH headers: " + JSON.stringify(req.headers));
    if (req.user) { return next() } // already authenticated via session cookie
    passport.authenticate(['bearer'], { session: false })(req, res, next);
};