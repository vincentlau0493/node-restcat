# node-restcat
This library provides a REST interface based on mongoose and express.js, which is inspired by Tastypie of django.


## Getting started

First of all, please make sure your express and mongoose have been properly installed. In your shell, install with npm:

```sh
npm install restcat
```

Configure mongoose schemas in your code:
```javascript
//models/index.js
//------------------------------

var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	username: String,
	password: String
});
exports.user = mongoose.model('User', userSchema);

var blogSchema = new mongoose.Schema({
	title: String,
	content: String,
	created: { type: Date, default: Date.now },
	isExist: { type: Boolean, default: true },
	authorId: mongoose.Schema.Types.ObjectId
});
exports.blog = mongoose.model('Blog', blogSchema);

```

Create a file called cattery.js(whatever you want to name) from root directory, for configuration of restful api.

```javascript
//cattery.js
//------------------------------

var restcat = require('restcat');
var model = require('./model');

//configure restcat, for url called
restcat.configure({namespace:'/restful/api'});

var userCattery = restcat.create({
	catteryName:'userlist', //configure specified url
	querySet: model.user.find({}), //querySet with no filter
	model:model.user //model
});

var blogCattery = restcat.create({
	catteryName: 'bloglist',
	querySet: model.blog.find({isExist:true}), //querySet with existed blogs
	model: model.blog,
});

exports.blog = blogCattery;
exports.user = userCattery;

```

After deploying model and restcat, invoke in app.js.

```javascript
//app.js
//------------------------------

var http = require('http');
var express = require('express');
var mongoose = require('mongoose');

//bring in cattery.js
var cattery = require('./cattery');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

var app = express();
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	//register router
	app.use(cattery.blog.register());
	app.use(cattery.user.register());
});

http.createServer(app).listen(3000, function() {
	console.log("Express server listening on port 3000");
});
```

Then you can excute the following queries:

```
GET http://localhost:3000/restful/api/userlist/
GET http://localhost:3000/restful/api/bloglist/            #for getting all blogs
GET http://localhost:3000/restful/api/bloglist/:id
POST http://localhost:3000/restful/api/bloglist/           #for creating blog
POST http://localhost:3000/restful/api/bloglist/:id        #for updating blog

GET http://localhost:3000/restful/api/bloglist/?title=Restcat      #for getting blogs with specified title, and this query set will base on the one you defined in cattery.js
GET http://localhost:3000/restful/api/bloglist/?limit=3     #for getting first three blogs
GET http://localhost:3000/restful/api/bloglist/?limit=3&offset=3     #for getting three blogs beginning at 4 (offset means skip)
```


## Options

#### catteryName (Required)
Generates the url referring to certain model based on cattery name.


#### querySet (Required)
The initiated query set you want to be queried.
###### example:

```javascript

querySet: collection.find({}) //find all the data

/* OR */
querySet: collection.find({outdate: false}) //find the data which isn't outdated

```

#### model (Required)
The collection or table referring to this cattery.

#### foreignKeys (Optional)
Provides relative infomation for foreignkeys, and the result will show the foreign tables recusively

###### example:

```javascript
foreignKeys: [
	{
		fieldName: 'user',  //the attribute name you like to display in the result data
		keyName: 'authorId', //the foreign key field
		cattery: userCattery  //the cattery referring to the foreign table or collection, which must be defined before this cattery
	}
]
```
It can be more than one foreign key in one collection or table, so this option would be an array.

#### authentication (Optional)
Add authentication for accessing to the data this cattery referring to.

###### generate authentication instance

```javascript
// cattery.js
// assuming you require restcat module
//-----------------------------------------
var oAuth = restcat.generateAuth();  //default name and pass are 'admin' for authentication, and authentication would be checked only when the request method isn't 'GET'

/* OR */
var oAuth = restcat.generateAuth(function(username, password){

	// code goes here...
	// check user and password through database
	// return value must be BOOL (if username and password match database, return true. Otherwise, return false) 

});

```
###### example

```javascript
// cattery.js
// assuming you require restcat module
//-----------------------------------------

var users = {
	root: 'root', //name: pass
	foo: 'bar' 
}

// define authentication instance
var oAuth = restcat.generateAuth(function(user, pass){
	if(users[user] && users[user] == pass)
		return true;

	return false;
});


var userCattery = restcat.create({
	catteryName:'userlist', //configure specified url
	querySet: model.user.find({}), //querySet with no filter
	model:model.user, //model
	authentication: oAuth
});

```

###### overwrite authenticate method

The authentication for each cattery or each route can be varied.

```
###### example

```javascript
// cattery.js
// assuming you require restcat module
//-----------------------------------------

var basicAuth = require('basic-auth'); // npm install basic-auth, for parsing header authorization

var users = {
	root: 'root', //name: pass
	foo: 'bar' 
}

// define authentication instance
var blogOAuth = restcat.generateAuth(function(user, pass){
	if(users[user] && users[user] == pass)
		return true;

	return false;
});

//redefine the authenticate middleware
blogOAuth.authenticate = function(req, res, next) {
	
	//always allows for GET
	if (req.method == "GET") return next();

	function unauthorized(res) {
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.send(401);
	};

	var user = basicAuth(req);
	if (!user || !user.name || !user.pass) {
		return unauthorized(res);
	};

	// authCheck is the property of auth instance, which is the parameter of generateAuth
	if (this.authCheck(user.name,user.pass)) { 
		return next();
	} else {
		return unauthorized(res);
	};
}

var blogCattery = restcat.create({
	catteryName: 'bloglist',
	querySet: model.entity.find({isExist:true}), //find exist
	model: model.entity,
	authentication:blogOAuth
});

```





