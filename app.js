// Module dependencies and Variables
var express = require('express'),
		routes = require('./routes'),
		http = require('http'),
		path = require('path'),
		app = express();

// Configurations
app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());

	app.use(express.methodOverride());
	app.use(express.cookieParser('secret'));
	app.use(express.session());
	app.use(function(req, res, next) {
		res.locals.session = req.session;
		next();
	});

	app.use(app.router);
	app.use(require('less-middleware')({src: __dirname + '/public'}));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/notes', routes.notes);
app.get('/oauth', routes.oauth);
app.get('/oauth_callback', routes.oauth_callback);
app.get('/clear', routes.clear);
app.get('/login', routes.login);
app.get('/createUser', routes.createUser);

app.post('/notes', function (req, res) {
	if (req.session.error){
		req.session.error = null;
	}
	routes.notes(req, res);
});

// Run
http.createServer(app).listen(app.get('port'), function(){

	console.log("Express server listening on port " + app.get('port'));
});
