var express = require('express');
var router = express.Router();
var url = require('url');
var db = require('./db');
var clone = require('clone');
module.exports = Sleepycat;


/*config:
 *
 * querySet -- model get(MODEL)
 * catteryName -- restful url(String)
 * allowMethods -- allow requesting method(Array)
 * filtering -- (Object)
 * ordering -- (Array)
 * foreignKeys -- (Array) {fieldName: String, keyName: String, cattery: Sleepycat, options:Array}
 */

 //bundle: meta, objects


function Sleepycat(config) {

	this.catteryName = config.catteryName;
	this.querySet = config.querySet;
	this.model = config.model;
	this.foreignKeys = config.foreignKeys || [];
	this._conditionsCopy = clone(this.querySet._conditions); //store default condition
}


Sleepycat.prototype.objGet = function(self,query,fn) {
	
	var flag = JSON.parse(JSON.stringify(query));
	if (typeof flag == "object") {
		// console.log(flag);
		var execFn = db.getAll(self,query);
		execFn.call(self.querySet,function(err, results){
			if (err) return console.error('Sleepycat Error: getAll fails');

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
			if (err) return console.error('Sleepycat Error: getById fails');

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


Sleepycat.prototype.objUpdate = function(data){

	return data;

}

Sleepycat.prototype.objCreate = function(data){

	return data;

}


Sleepycat.prototype.dehydrate = function(data,self) {
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

Sleepycat.prototype.authenticate = function() {

}


Sleepycat.prototype.register = function() {
	var bundle = {};
	var namespace = Sleepycat.namespace || '';
	var self = this;
	var requestUrl = namespace + '/' + this.catteryName + '/';
	//get all
	router.get(requestUrl, function(req, res) {
		//copy the original conditions
		bundle.meta = self.generateMeta(req);
		var query = req.query;
		self.objGet(self,query,function(results){

			bundle.objects = results;
			res.json(bundle);

		})
	});


	//get by id
	router.get(requestUrl+':id', function(req, res) {
		// console.log(url.parse(req.url));
		var objectId = req.params.id;

		self.objGet(self,objectId,function(result){
			bundle = result;
			res.json(bundle);
		})
	});


	//create a document
	router.post(requestUrl, function(req, res) {
		// console.log(req);
		var postData = req.body;
		postData = self.objCreate(postData);

		self.model.create(postData, function(err,result){
			if (err) return console.error('Sleepycat Error: create fails');
			console.log(result);
			res.json(result);
		})
	});


	//update document
	router.post(requestUrl+':id', function(req, res) {
		// console.log(url.parse(req.url));
		var objectId = req.params.id;
		var postData = req.body;
		postData = self.objUpdate(postData);

		self.model.findByIdAndUpdate(objectId, { $set: postData}, function (err, result) {
			if (err) return console.error('Sleepycat Error: update fails');;
			console.log(result);
			res.json(result);
		});

	});

	return router;
}






Sleepycat.prototype.generateMeta = function(req) {

		var meta = {
			limit: 20,
			next: null,
			offset: 0,
			previous: null,
			total: null
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
		meta.next = pathObj.pathname + '?' + queryArray.join('&');

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




