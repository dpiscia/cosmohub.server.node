var q = require('q');

/**
 * Description
 * @method list_to_array
 * @param {} result
 * @return MemberExpression
 */
module.exports.list_to_array = function(result)
	{  
		var deferred = q.defer();
		result.map(function(x){ 
			if(x.dep != null) 
				x.dep = String(x.dep).split(',').map(function(y){ return parseInt(y);}); //x.dep = x.dep.slipt(','); 
			else x.dep = [];
			return x;})
			
		
		deferred.resolve(result);
		return deferred.promise;
	}  