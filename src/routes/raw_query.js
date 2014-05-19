"use strict";

var q = require('q');
var db = require('../db');
var config = require('../config');



module.exports.raw_query = function(req, res)
	{

	
	var command = (req.body.query).replace(/\n$/, '');
	
	query(command).then(function(val) 
		{
			res.send(val);
		}).
		fail(function(err)
		{	
			
			res.send('400',err);
		});  
	
	};
	
	
// strucutred query
function query(text)
	{  
		var deferred = q.defer();
		var check_query;
		check_query = 'explain (format json)'+text ;
		console.log(check_query);
		db.client_pau.raw(check_query).then  
		(
			function(resp) 
			{	
					
					if (config.job.client === "pg"){
						console.log(resp.rows);
						
						return deferred.resolve({'result' : [JSON.parse(resp.rows[0]['QUERY PLAN'])]});
						}
					else {
						console.log(resp[0]);
						deferred.resolve(resp[0]);					
						}
				
			},
			function(err)
			{
							
				console.log(err.message);
				deferred.reject({'message': err.message.split(',')[0]});
			}

		); 
	return deferred.promise;
	}  	