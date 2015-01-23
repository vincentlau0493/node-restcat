module.exports = Authorization;


function Authorization(){};

Authorization.prototype.authorize = function(req, res, next){
	//default
	return next(); //always pass
}

