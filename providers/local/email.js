function NullEmailProvider(config) {
}

NullEmailProvider.prototype.send = function(email, callback) {
	return callback();
};

module.exports = NullEmailProvider;