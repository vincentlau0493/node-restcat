var restcat = require('../');
var model = require('./model');

//configure restcat, (static variable)
restcat.configure({
	namespace:'/restcat',
	debug: true
});


//authentication instance
var oAuth = restcat.authGenerator('authentication'); // default-> user:admin, pass:admin
var generalAuthorization = restcat.authGenerator('authorization');


var userCattery = restcat.create({
	catteryName:'userlist',
	querySet: model.user.find({}), //find all
	model:model.user
});



userCattery.dehydrate = function(data,self){

	data.username = '|' + data.username + '|';
	return this.__proto__.dehydrate(data,self);

}


var postCattery = restcat.create({
	catteryName: 'postlist',
	querySet: model.entity.find({isExist:true}), //find exist
	model: model.entity,
	foreignKeys: [
		{
			fieldName: 'user',
			keyName: 'authorId',
			cattery: userCattery
		}
	],
	authentication:oAuth,
	authorization: generalAuthorization

});

//overwrite
postCattery.objUpdate = function(data){
	data.title = "* " + data.title;
	return this.__proto__.objUpdate(data);
}

//overwrite
postCattery.objCreate = function(data){
	data.title =data.title + ' |new';
	return this.__proto__.objUpdate(data);
}

postCattery.dehydrate = function(data,self){

	var formatedTime = (data.created.getMonth() + 1) + '/' + data.created.getDate() + '/' +  data.created.getFullYear();
	data.created = formatedTime;
	return this.__proto__.dehydrate(data,self);

}

exports.post = postCattery;
exports.user = userCattery;



