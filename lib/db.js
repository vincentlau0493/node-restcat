exports.getAll = function(cattery,query) {
	//filter params
	var skip = query.offset;
	var limit = query.limit;
	var sort = query.sort || '';
	delete query.offset;
	delete query.limit;
	delete query.format;
	delete query.sort;

	return cattery.querySet.sort(sort).skip(skip).limit(limit).find(query).exec;


}

exports.getById = function(cattery,objectId,fn) {
	return cattery.querySet.find({_id:objectId},fn);
}

exports.total = function(cattery,query,fn) {

	//filter params
	var skip = query.offset;
	var limit = query.limit;
	var sort = query.sort || '';
	delete query.offset;
	delete query.limit;
	delete query.format;
	delete query.sort;

	return cattery.querySet.count(query,fn);


}

