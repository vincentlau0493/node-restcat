var express = require('express');
var router = express.Router();
var url = require('url');
var db = require('./db');
var clone = require('clone');
var basicAuth = require('basic-auth');
module.exports = Restcat;


/*config:
 * 
 * @querySet -- model get(MODEL)
 * @catteryName -- restful url(String)
 * @allowMethods -- allow requesting method(Array)
 * @filtering -- (Object)
 * @ordering -- (Array)
 * @foreignKeys -- (Array) {fieldName: String, keyName: String, cattery: Restcat, options:Array}\
 **@authentication -- (Authentication)
 */

 //bundle: meta, objects


function Restcat(config) {

	this.catteryName = config.catteryName;
	this.querySet = config.querySet;
	this.model = config.model;
	this.foreignKeys = config.foreignKeys || [];

	this.authentication = config.authentication || false;
	this.authorization = config.authorization || false;


	this._conditionsCopy = clone(this.querySet._conditions); //store default condition
}



Restcat.prototype.objGet = function(self,query,fn) {
	
	var flag = JSON.parse(JSON.stringify(query));
	if (typeof flag == "object") {
		// console.log(flag);
		var execFn = db.getAll(self,query);
		execFn.call(self.querySet,function(err, results){
			if (err) return console.error('Restcat Error: getAll fails');

			var data = results.map(function(d){
				return self.dehydrate(d.toObject(),self); //dehydrate
			});
			//init condition
			self.querySet._conditions = clone(self._conditionsCopy);
			fn(data);
		});	

	} else {
		//is id
		db.getById(self,query,function(err,result){
			if (err) return console.error('Restcat Error: getById fails');

			// var data = self.dehydrate(result.toObject(),self);
			var data = result.map(function(d){
				return self.dehydrate(d.toObject(),self); //dehydrate
			})[0];
			// console.log(data);
			self.querySet._conditions = clone(self._conditionsCopy);
			fn(data);

		});


	}



}


Restcat.prototype.objUpdate = function(data){
	return data;
}

Restcat.prototype.objCreate = function(data){
	return data;
}


Restcat.prototype.dehydrate = function(data,self) {
	// console.log('proto-',data);
	// console.log(self.catteryName)	
	if (self.foreignKeys.length == 0) {
		var done = true;
	} else {
		var done = false;
	}
	
	for(var i=0;i<self.foreignKeys.length;i++){

		var keyName = self.foreignKeys[i].keyName;
		var fieldName = self.foreignKeys[i].fieldName;
		var foreignId = data[keyName];
		var cattery = self.foreignKeys[i].cattery;

		if (foreignId) {

			cattery.objGet(cattery,foreignId,function(result){
				// console.log(result);
				data[fieldName] = result;
				// console.log('callback-', data)
				done = true;
			})

		} else {
			data[fieldName] = null;
			done = true;
		}

	}
	while(!done) {
	  require('deasync').runLoopOnce();
	}
	return data;

	

}

// Restcat.prototype.authenticate = function(req) {
// 	//GET: always grants crendential
// 	if (req.method == "GET") return true;
// 	//OTHERS: authenticate
// 	return function (req, res, next) {
// 		function unauthorized(res) {
// 			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
// 			return errorHandler('Unauthorized',401,res);
// 		};
// 		var user = basicAuth(req);
// 		console.log(user);
// 		if (!user || !user.name || !user.pass) {
// 			return unauthorized(res);
// 		};
// 		if (callback(user.name,user.pass)) {
// 			//success
// 			return next();
// 		} else {
// 			//failure
// 			return unauthorized(res);
// 		};
// 	};
// }

Restcat.prototype.authorize = function(req) {

	return false;

}


function errorHandler(err,statusCode,res) {
	var error = {};
	error.error = err || 'SERVER ERROR: RESTCAT PROBLEM';
	error.statusCode = statusCode || 500;
	res.json(error);
}

// function auth(restcat) {

// 	if (restcat.authentication) {
// 		return function(req,res,next){
// 			//check authentication
// 			var isAuth = restcat.authentication.isAuthenticated(req, res);
// 			console.log('isAuth',isAuth);
// 			if (isAuth) return next();
// 			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			
// 			return errorHandler('Anthentication Fails',401,res);
// 		}
// 	} else {
// 		return function(req,res,next){
// 			return next();
// 		}
// 	}
// }

function auth(restcat) {
	// console.log(restcat.authentication.authenticate);
	if (restcat.authentication) return restcat.authentication.authenticate.bind(restcat.authentication);

	return function(req,res,next){
		return next();
	}
}


Restcat.prototype.register = function() {
	var bundle;
	var namespace = Restcat.namespace || '';
	var self = this;
	var requestUrl = namespace + '/' + this.catteryName + '/';
	//get all
	router.get(requestUrl,auth(self), function(req, res) {
		bundle = {};
		bundle.meta = self.generateMeta(req,self);
		var query = req.query;
		self.objGet(self,query,function(results){

			bundle.objects = results;
			res.json(bundle);

		})
	});


	//get by id
	router.get(requestUrl+':id',auth(self), function(req, res) {
		bundle = {};
		var objectId = req.params.id;

		self.objGet(self,objectId,function(result){
			bundle = result;
			res.json(bundle);
		})
	});


	//create a document
	router.post(requestUrl,auth(self), function(req, res) {
		// console.log(req);
		var postData = req.body;
		postData = self.objCreate(postData);

		self.model.create(postData, function(err,result){
			if (err) return console.error('Restcat Error: create fails');
			// console.log(result);
			res.json(result);
		})
	});


	//update document
	router.post(requestUrl+':id',auth(self), function(req, res) {
		// console.log(url.parse(req.url));
		var objectId = req.params.id;
		var postData = req.body;
		postData = self.objUpdate(postData);

		self.model.findByIdAndUpdate(objectId, { $set: postData}, function (err, result) {
			if (err) return console.error('Restcat Error: update fails');;
			// console.log(result);
			res.json(result);
		});

	});

	return router;
}






Restcat.prototype.generateMeta = function(req,self) {

		var meta = {
			limit: 20,
			next: null,
			offset: 0,
			previous: null,
			total: null
		}
		var queryCopy = clone(req.query) || {};
		delete queryCopy.offset;
		delete queryCopy.limit;
		delete queryCopy.format;
		delete queryCopy.sort;

		var done = false;

		self.querySet.count(queryCopy, function( err, count){
			// console.log( "Number:", count );
			meta.total = count;
			done = true;
		});
		while(!done) {
			require('deasync').runLoopOnce();
		}

		var pathObj = url.parse(req.url);

		var query = pathObj.query || '';
		//limit
		var limitMatches = query.match(/limit=(\d+)/i);
		if (limitMatches) {
			//modify limit value
			var limit = parseInt(limitMatches[1],10);
			meta.limit = limit;
		}
		//offset
		var offsetMatches = query.match(/offset=(\d+)/i);
		if (offsetMatches) {
			//modify offset value
			var offset = parseInt(offsetMatches[1],10);

			//must be positive
			meta.offset = offset;
		}

		var nextOffset = meta.offset + meta.limit;
		var preOffset = meta.offset - meta.limit;


		var queryObj = {};
		var queryArray = [];
		query.split('&').map(function(d){
			if (!d.match(/(.*)=(.*)/)) return d;

			var k = d.match(/(.*)=(.*)/)[1];
			var v = d.match(/(.*)=(.*)/)[2];
			queryObj[k] = v;
			return d;
		});

		//generate next url
		queryObj.offset = nextOffset;
		queryObj.limit = meta.limit

		for(var k in queryObj) {
			queryArray.push(k + '=' + queryObj[k]);
		}
		// console.log('nextOffset',nextOffset);
		// console.log('total',meta.total);
		if (nextOffset < meta.total) {
			meta.next = pathObj.pathname + '?' + queryArray.join('&');
		} else {
			meta.next = null;
		}


		//generate previous url
		if (preOffset >= 0) {
			queryObj.offset = preOffset;
			queryArray.length = 0; //init
			for(var k in queryObj) {
				queryArray.push(k + '=' + queryObj[k]);
			}
			meta.previous = pathObj.pathname + '?' + queryArray.join('&');		
				
		} else {
			meta.previous = null;
		}
		return meta;
}





