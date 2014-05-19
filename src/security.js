// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
'use strict';
/* jshint -W117 */


var passport = require('passport'), 
        LocalStrategy = require('passport-local').Strategy;
var db = require('./db');
var q = require('q');
var passwordHash = require('password-hash');
var config = require('./config');


module.exports.ensureAuthenticated = function (req, res, next, err) {
	var deferred = q.defer();

	
  	findById(req.headers.user_id,req.headers.apikey).then(
  		function(data) {

	  	deferred.resolve()},
	  	function(err){

		  	
		  	deferred.reject();
		  	 //return next(new Error("Couldn't find user: " + err));
	  	} )
	    console.log('finished');
		return deferred.promise;
};
var users = [];
module.exports.users = function(){return users;};
module.exports.set_users = function(api_key,id,role){
		console.log('pushusers');
		console.log(users);
		users.push({api_key: api_key, role: role, id : id})};
module.exports.remove_users = function(id,api_key,role){ 

	var deferred = q.defer();

	
	users.forEach(function(x,index) { if (x.id == id && x.api_key == api_key) users.splice(index,1)})

	deferred.resolve()

	return deferred.promise;
	};

module.exports.findById = findById;

function findById(id,api_key) {
	var deferred = q.defer();

	users.forEach(function (x) {
		if (x.id == id && x.api_key == api_key) deferred.resolve(); 
		console.log("inside");})

	deferred.reject();

	return deferred.promise;
	//return false;
}

function findByUsername(username, fn) 
{
        db.client_pau("user").select().where('email',username).then  
        (
                function(resp) 
                {        

                
                if (resp.length > 0)
                        {
                        //users.push(resp[0]);
 
                        return fn(null, resp[0]);
                        }
                else
                        {
                        return fn(null, null);
                        }
                }, 
                function(err) 
                {
                        
                        return fn(null, null);
                }
        ); 
}



// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
	
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {


  findById(id, function (err, user) {
    done(err, user);
  });
});

var salt = config.salt;
// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
module.exports.strategy  = passport.use(new 
        LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      
      findByUsername(username, function(err, user) {

        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }



        var userHash = require('crypto').createHash('sha512').update(password+salt).digest('hex');
        if (userHash  != user.password) { return done(null, false, { message: 'Invalid password' }); }
        if (!user.enabled) { return done(null, false, { message: 'User not validated' }); }
        return done(null, user);
      });
    });
  }
));
