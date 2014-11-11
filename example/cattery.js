var sleepycat = require('../');
var model = require('./model');

//configure sleepycat, (static variable)
sleepycat.configure({namespace:'/sleepycat'});


var userCattery = sleepycat.create({
	catteryName:'userlist',
	querySet: model.user.find({}), //find all
	model:model.user
});



userCattery.dehydrate = function(data,self){

	data.username = '|' + data.username + '|';
	return this.__proto__.dehydrate(data,self);

}


var postCattery = sleepycat.create({
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

});

//overwrite
postCattery.objUpdate = function(data){

	data.title = "* " + data.title;

	return this.__proto__.objUpdate(data);
}

postCattery.dehydrate = function(data,self){

	var formatedTime = (data.created.getMonth() + 1) + '/' + data.created.getDate() + '/' +  data.created.getFullYear();
	data.created = formatedTime;
	return this.__proto__.dehydrate(data,self);

}

exports.post = postCattery;
exports.user = userCattery;



