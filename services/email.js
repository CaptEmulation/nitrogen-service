var config = require('../config');

var send = function(email, callback) {
    config.email_provider.send(email, callback);
};

module.exports = {
    send: send
};