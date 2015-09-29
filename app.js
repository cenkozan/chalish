// Module dependencies and Variables
var 
		express = require('express'),
		app = express(),
		bodyParser = require('body-parser'),
		cookieParser = require('cookie-parser'),
		config = require('./config.json'),
		errorhandler = require('errorhandler'),
		favicon = require('serve-favicon'),
		http = require('http'),
		path = require('path'),
		routes = require('./routes'),
		session = require('express-session');

// Configurations
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon('./public/images/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//app.use(express.methodOverride());
app.use(cookieParser('chalish secret cookie'));
app.use(session({secret: 'chalish secret session', resave:true, saveUninitialized:true}));
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {	
	app.use(errorhandler());
}

// Routes
app.get('/', routes.index);
app.get('/notes', routes.notes);
app.get('/oauth', routes.oauth);
app.get('/oauth_callback', routes.oauth_callback);
app.get('/newUser', routes.newUser);
app.get('/clear', routes.clear);
app.get('/notesLoad', routes.notesLoad);
app.get('/removeNote', routes.removeNote);

app.post('/login', function (req, res) {
	if (req.session.error){
		req.session.error = null;
	}
	console.log('email: ', req.body.email);
	routes.login(req, res);
});

app.post('/addNoteToList', function (req, res) {
	if (req.session.error){
		req.session.error = null;
	}
	routes.addNoteToList(req, res);
});

app.post('/createUser', function (req, res) {
	if (req.session.error){
		req.session.error = null;
	}
	routes.createUser(req, res);
});

app.post('/getChart', function (req, res) {
	if (req.session.error){
		req.session.error = null;
	}
	routes.getChart(req, res);
});


app.listen(process.env.PORT || config.port, function() {
	console.log("Express server listening on port " + config.port);
});

// Run
//http.createServer(app).listen(app.get('port'), function(){
	//console.log("Express server listening on port " + app.get('port'));
//});
