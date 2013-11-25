var async = require('async')
  , log = require('../../log')
  , sendgrid = require('sendgrid')
  , sift = require('sift');

function SendgridEmailProvider(config) {
    this.config = config;
    this.client = sendgrid(config.SENDGRID_API_USER, config.SENDGRID_API_KEY);
}

SendgridEmailProvider.prototype.send = function(emailObj, callback) {
	sendgrid.send(new sendgrid.Email(emailObj), callback);
};

module.exports = SendgridEmailProvider;