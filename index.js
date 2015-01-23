var Restcat = require('./lib/restcat');
var Auth = require('./lib/authentication');
var Auth2 = require('./lib/authorization');
//factory
exports.create = function(option) {
	return new Restcat(option);
}

exports.authGenerator = function(type,callback){

	if ('authentication' == type.toLowerCase()) {
		return new Auth(callback);
	}
	if ('authorization' == type.toLowerCase()) {
		return new Auth2();
	}
	console.error("Can't find the auth type");


	
}


exports.configure = function(config) {
	for(var c in config) {
		Restcat[c] = config[c];
	}
}

//extend method
//extend middleware
//filter in,gt,lt