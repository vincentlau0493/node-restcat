var Sleepycat = require('./lib/sleepycat');

//factory
exports.create = function(option) {
	return new Sleepycat(option);
}

exports.configure = function(config) {
	for(var c in config) {
		Sleepycat[c] = config[c];
	}
}