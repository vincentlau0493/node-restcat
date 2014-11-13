var Restcat = require('./lib/restcat');
var Auth = require('./lib/authentication');
//factory
exports.create = function(option) {
	return new Restcat(option);
}

exports.generateAuth = function(callback){
	return new Auth(callback);
}


exports.configure = function(config) {
	for(var c in config) {
		Restcat[c] = config[c];
	}
}

//extend method
//extend middleware