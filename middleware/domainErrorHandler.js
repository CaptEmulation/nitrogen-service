var domain       = require('domain');

module.exports = function (req, res, next) {
    var d = domain.create();
    d.on('error', next);
    d.run(next);
};