exports.findAll = function(req, res) {
	res.send([{type: 'proximity'}, {type: 'location'}])
}

exports.findById = function(req, res) {
	res.send([{type: 'proximity'}])
}