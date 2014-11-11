var Restcat = require('./lib/restcat');

//factory
exports.create = function(option) {
	return new Restcat(option);
}

exports.configure = function(config) {
	for(var c in config) {
		Restcat[c] = config[c];
	}
}