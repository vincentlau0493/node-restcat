var mongoose = require('mongoose');



var userSchema = new mongoose.Schema({
	username: String,
	password: String
});
exports.user = mongoose.model('User', userSchema);



var entitySchema = new mongoose.Schema({
	title: String,
	content: String,
	created: { type: Date, default: Date.now },
	isExist: { type: Boolean, default: true },
	authorId: mongoose.Schema.Types.ObjectId
});
exports.entity = mongoose.model('Entity', entitySchema);









