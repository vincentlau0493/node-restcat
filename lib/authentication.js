var basicAuth = require('basic-auth');
module.exports = Authentication;

/*
** @param callback -> function(user, pass)
*/

function Authentication(callback){
	this.callback = callback || function(user, pass){
		console.log(user,pass);
		return (user=="admin" && pass=="admin");
	};
}

Authentication.prototype.authenticate = function(req, res, next){
	//GET: always grants crendential
	// if (req.method == "GET") return next();
	// console.log(this);
	function unauthorized(res) {
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.send(401);
	};
	var user = basicAuth(req);
	console.log(user);
	// console.log(req.method);

	if (!user || !user.name || !user.pass) {
		return unauthorized(res);
	};

	if (this.callback(user.name,user.pass)) {
		return next();
	} else {
		return unauthorized(res);
	};

}

