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
