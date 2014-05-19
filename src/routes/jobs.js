/*
 * Serve JSON to our AngularJS client
 */



/*
 * GET users listing.
 */
"use strict";
/* jshint -W098 */
/* jshint -W003 */
/* jshint -W009 */
/* jshint -W117 */

var q = require('q');
var db = require('../db');
var config = require('../config');
var query = require('../lib/query_jobs');
var data_functions = require('../lib/data_mod.js');
//jobs rest api

//parameter all defined the recursive level of query:0 no recursive level. 1: one depth level query indefinite: 99 available depth query
module.exports.list = function(req, res)
	{
	query_jobs(req.params.id,req.params.all).then(function(val) 
		{
			res.send(val);
		});  
	};
	
//quality control rest api
module.exports.qc_list = function(req, res){
	
	query_QC(req.params.id).then (function(val) 
		{
		res.send(val);
		});
	};
	
//quality control rest api
module.exports.job_tr_list = function(req, res){
	console.log("jobtraceback api");
	query_traceback(req.params.id).then (function(val) 
		{
		res.send(val);
		});
	};
//production list
	
module.exports.prod_list = function(req, res)
	{

	query_prods().then(function(val) 
		{
			res.send(val);
		});  
	};
	
	
	
// function for production query
function query_prods()
	{  
		var deferred = q.defer();
		db.client_pau("production").select().then  
		(
			function(resp) 
			{
				console.log(resp);
				deferred.resolve(resp);
			}, 
			function(err) 
			{
				
				deferred.resolve([]);
			}
		); 
	return deferred.promise;
	}  


// function for quality_controls query
function query_QC(id)
	{  
		var deferred = q.defer();
		db.client_pau("quality_control").select().where('job_id',id).andWhere('ref', 'not like', 'general').then  
		(
			function(resp) 
			{
				console.log(resp);
				deferred.resolve(resp);
			}, 
			function(err) 
			{
				
				deferred.resolve([]);	
			}
		); 
	return deferred.promise;
	}  

// function for quality_controls query
function query_traceback(id)
	{  
		var deferred = q.defer();
		db.client_job("tag").select().where('job_id',id).andWhere('name', 'last_traceback').then  
		(
			function(resp) 
			{
				console.log(resp);
				
				deferred.resolve(resp);
			}, 
			function(err) 
			{
				
				deferred.resolve([]);	
			}
		); 
	return deferred.promise;
	}  

function query_jobs(id,all)
{  
	var deferred = q.defer();
	console.log("entra");
	if (id === undefined) 
	{	//select all job with super_id null
			if (config.job.client === "pg")
			{
			db.client_job('job as p').select(db.client_job.raw('*,  array(select parent_job_id from dependency where child_job_id = p.id) as dep, (select count(*)  from job a where a.super_id = p.id) as nbr')).whereNull('p.super_id').then
			(query.quality_control).then(deferred.resolve, console.log);	
			}
			else {
			//sqlite db
			db.client_job('job as p').select(db.client_job.raw('*,  (select group_concat(parent_job_id) from dependency where child_job_id = p.id) as dep, (select count(*)  from job a where a.super_id = p.id) as nbr')).whereNull('p.super_id')
			.then(data_functions.list_to_array).then
			(query.quality_control).then(deferred.resolve, console.log);				
			}
		//jobs[21].dep.split(',').length
	}
	else 
	{
		if (all === '1' || all ==='99') 
		{	//select all job with one level depth for the given job id
			//if db backend is postgres query will be sql recursive enabled if sqlite the recursion is given at server level (it takes much more time)
			if (config.job.client === "pg")
			{
				
				db.client_job.raw(query.recursive_query(id,parseInt(all))).then
				( 
					function(resp) 
					{
						
						query.quality_control(resp.rows).then(deferred.resolve,console.log);
					}
				);
			}
			else
			{
				query.flat_tree_dict(id, 0,parseInt(all), function (treeSet) 
				{
					query. quality_control(treeSet).then(deferred.resolve,console.log);
				});
			}

		}
		if (all === '0') 
		{   
			db.client_job('job').where("id",id).select().then
				( query.quality_control).then(deferred.resolve, console.log);
		}

	}
return deferred.promise;
}
 
// function for quality_controls query
