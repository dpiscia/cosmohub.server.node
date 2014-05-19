"use strict";

var q = require('q');
var db = require('../db');
var config = require('../config');


//api/str_query/:table/:fields/:clauses/:limit
module.exports.structure_query = function(req, res)
	{

	
	var table = req.query.table;
	console.log(req.query.fields);
	var fields = req.query.fields;
	console.log(req.query.clauses);
	var clauses= req.query.clauses;
	if (clauses == null) clauses = "" 
	else clauses = req.query.clauses.split(',');

	//if (clauses == null) clauses = ""

	var limit = req.query.limit;
	var command = "select "+fields+" from "+table;

	for (var i=0; i < clauses.length; i++)
		{
		if (i===0 && clauses[0] != "") command = command+" where ";
		command = command+" "+clauses[i];
		}
	command = command+" limit "+limit;

	query(command).then(function(val) 
		{
			res.send(val);
		});  
	
	};
	
	
// strucutred query
function query(text)
	{  
		var deferred = q.defer();
		db.client_pau.raw(text).then  
		(
			function(resp) 
			{
				if (config.job.client === "pg"){
					
					deferred.resolve(resp.rows);
					}
				else {
					console.log(resp[0]);
					deferred.resolve(resp[0]);					
					}
			}, 
			function(err) 
			{
				console.log(err.message);
			}
		); 
	return deferred.promise;
	}  	
	
	

	