'use strict';
/* jshint -W030 */
/**
 * Module dependencies
 */

var express = require('express'),
  
  api_jobs = require('./routes/jobs'),
  api_strc_query = require('./routes/strc_query'),
  api_raw_query = require('./routes/raw_query'),
  path = require('path'),
  cors = require('cors'),
  flash = require('connect-flash'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  uuid = require('node-uuid'),
  expressValidator = require('express-validator'),
  connect_restreamer = require('connect-restreamer'),
  httpProxy = require('http-proxy');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var db = require('./db');
var security = require('./security');
var register = require('./routes/register');
var config = require('./config');
if (config.session_store) {
    var RedisStore = require("connect-redis")(express);
	var redis = require("redis").createClient();
}
/**
 * Configuration
 */

//local configuration, in production the fornt end server will handle the proxy 
var proxy = httpProxy.createServer(
	express.bodyParser(),
	require('connect-restreamer')()
	);

proxy.listen(8005);

//
// Listen for the `error` event on `proxy`.
proxy.on('error', function (err, req, res) {
	
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});


//configuration of the environment
// all environments
app.set('port', process.env.PORT || config.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
//app.use(cors());
app.use(expressValidator());

app.use(express.methodOverride());

var session_config = { secret: 'keyboard cat' };

if (config.session_store) { 
			
			session_config['store'] = new RedisStore({ host: config.redis.host, port: config.redis.port, client: redis } ); 
			}
app.use(express.session(session_config));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
app.use(flash());
app.use(passport.initialize());
//app.use(express.static(path.join(__dirname, '../clients/client_paudm/src')));
app.use(express.static(path.join(__dirname, '../clients/client_cosmohub/src/cosmohub_app')));
app.use('/common_modules', express.static(path.join(__dirname, '../clients/client_common')));
app.use('/security', express.static(path.join(__dirname, '../clients/security_app')));
app.use('/query', express.static(path.join(__dirname, '../clients/query_app')));
app.use('/results', express.static(path.join(__dirname, '../clients/results_app')));
app.use('/lib', express.static(path.join(__dirname, '../clients/client_lib')));
app.use('/bower_components', express.static(path.join(__dirname, '../clients/bower_components')));
app.use('/css', express.static(path.join(__dirname, '../clients/css')));
app.use(app.router);


db.connectDatabase(config);
     // Socket.io Communication
  // Sync work only with two-phases commit disabled in postgresql
if (config.sync){
	io.sockets.on('connection', require('./routes/socket'));
}

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}


/**
 * Routes
 */

// serve index and view partials
var proxy_function_secured = function(req,res){
	security.ensureAuthenticated(req,res).then( function(data){ proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })},function(err){
		return res.send(403,"not authorized");});
	
	};
//proxy route
//database exploration

app.get('/api_python/tb/:table',proxy_function_secured);
app.get('/api_python/db_list',require('connect-restreamer')(),proxy_function_secured);

//catalogs groups (DES,Euclid,etc..)
app.get('/api_python/groups',require('connect-restreamer')(),proxy_function_secured);
app.get('/api_python_public/groups',function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});


// user CRUD operation
app.get('/api_python/user',proxy_function_secured);
app.get('/api_python/personal_area',require('connect-restreamer')(),proxy_function_secured);
app.delete('/api_python/user',proxy_function_secured);
app.put('/api_python/user',require('connect-restreamer')(),proxy_function_secured);
//catalog info
app.get('/api_python/catalogs',proxy_function_secured);
app.get('/api_python/catalog/:Name',proxy_function_secured);


//user job-query related info
app.get('/api_python/jobs',proxy_function_secured);
app.get('/api_python/jobs_counter',require('connect-restreamer')(),proxy_function_secured);

//users counter

app.get('/api_python/users_counter',proxy_function_secured);

//downloads readme
app.get('/api_python/download_readme/:id/:user_id/:token',href_conversion,proxy_function_secured);
app.get('/api_python/download_prebuilt/:id/:user_id/:token',href_conversion,proxy_function_secured);
app.get('/api_python/download_query/:id/:user_id/:token',href_conversion,proxy_function_secured);


function href_conversion(req,res,next) {
//get id and token as parameter and put them as header value to behave in the standard way
debugger;
req.headers['apikey'] = req.params['token'] ;
req.headers['user_id']=req.params['user_id'] ;

req.url =  req.url.split('/')[0]+'/'+req.url.split('/')[1]+'/'+req.url.split('/')[2]+'/'+req.url.split('/')[3]

next();
}

//raw query and check query syntax
app.post('/api_python/check_query',require('connect-restreamer')(),function(req,res){
	console.log("run a check query");
	proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});

app.post('/api_python/query',require('connect-restreamer')(),proxy_function_secured);
app.post('/api_python/batch_query',require('connect-restreamer')(),proxy_function_secured);

//register
app.post('/api_python/register',require('connect-restreamer')(),function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});


//forgot password

app.get('/api_python/validation',function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});

//email validation

app.get('/api_python/forgot_password/:email',function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});

//personal area api

app.get('/api_python/personal_area',security.ensureAuthenticated,function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});
app.put('/api_python/personal_area',require('connect-restreamer')(),security.ensureAuthenticated,function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});


// Jobs API
app.get('/api_node/jobs/:id',security.ensureAuthenticated,  api_jobs.list);
app.get('/api_node/jobs/:id/:all',security.ensureAuthenticated, api_jobs.list);
app.get('/api_node/jobs',security.ensureAuthenticated,api_jobs.list);
app.get('/api_node/qc/:id',security.ensureAuthenticated, api_jobs.qc_list);
app.get('/api_node/job_traceback/:id', api_jobs.job_tr_list);
app.get('/api_node/prods', security.ensureAuthenticated,api_jobs.prod_list);
//app.get('/api_node/jobs/prod/:id', security.ensureAuthenticated, api_jobs.job_prod_list);
// redirect all others to the index (HTML5 history)


//plots

app.get('/plots/:job_id/:plot_name',require('connect-restreamer')(),function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});
//logs

app.get('/logs/:log_name',function(req,res){proxy.web(req, res,{ target: config.api_python.host+':'+config.api_python.port })});
//structured query API

app.get('/api_node/strc_query',security.ensureAuthenticated, api_strc_query.structure_query)

//raw query

app.post('/api_node/raw_query', api_raw_query.raw_query)

//login/logout/register points

app.post('/api_node/logout',register.logout);
app.post('/api_node/register',register.register);
app.post('/signup/check/username',register.check_username);
app.post('/api_node/login', register.login);



/**
 * Start Server
 */

server.listen(app.get('port'), '0.0.0.0', 511, function () {
  console.log('Express server listening on port ' + app.get('port'));
  /*var open = require('open');
  open('http://localhost:' + app.get('port') + '/');*/
});