var config = require('../config.json'), 
		callbackUrl, 
		childProcess = require('child_process'),
		phantomjs = require('phantomjs'),
		utilityModule = require('./utilityModule.js'),
		mongoose = require('mongoose'),
		connStr = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://127.0.0.1:27017/chalish-user-table",
		User = require('./user-model'),
		selectedGuid,
		chartData;

// checking the notes for tables, dates
exports.notes = function(req,res) {
	if (!req.session.oauthAccessToken)
		return res.redirect('/');	

	res.render('notes', {token: JSON.stringify(req.session.oauthAccessToken), noteList: null, notes: null, data: null, monthNamesArray: null});
};//end of exports.notes

exports.notesLoad = function(req, res) {
	// if notes is in the session,
	// else put it asynchronously
	if (req.session.notes)
	{
		res.writeHead(200, {'content-type': 'application/json'});
		res.write(JSON.stringify({notes: req.session.notes}));
		res.end('\n');
	}
	else {
		utilityModule.notesLoad(req.session.oauthAccessToken, function (err, notesLoad) {
			if (err) {
				req.session.error = err;
				console.log(err);
				return;
			}
			else if (!err && notesLoad) {
				//i am putting the data into the session so 
				//that the data is tied to the session.
				req.session.notes = notesLoad;
				res.writeHead(200, {'content-type': 'application/json'});
				res.write(JSON.stringify({notes: notesLoad}));
				res.end('\n');
			}
		});
	}
}

exports.getChart = function(req, res) {

	if (req.session.error) 
		req.session.error = null;

	selectedGuid = req.body.selectedGuid;

	if (!req.session.oauthAccessToken)
		return res.redirect('/');

	if(selectedGuid && selectedGuid != 0) {
		utilityModule.getChartData(req.session.oauthAccessToken, selectedGuid, function (err, chartData) {
			if (err) {
				req.session.error = err.message;
				console.log('OOORRRROSPULAR!');
			}
			res.writeHead(200, {'content-type': 'application/json'});
			res.write(JSON.stringify(err.message, chartData));
			res.end('\n');
		});
  }//end of if selectedGuid
}

// after login button pressed.
// check the DB for the matching password.
exports.login = function(req, res) {
  console.log(req.body.email);

  mongoose.connect(connStr, function(err) {
    if (err) console.log(err);
    else console.log("Successfully connected to MongoDB");
  });

  // save user to database
  User.findOne({ email: req.body.email }, function(err, user) {
    if (err) console.log(err);

    if (user instanceof User) {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (err) req.session.error = err;
        //we set the session info back here.
        req.session.email = user.email;
        req.session.oauthAccessToken = user.oauthAccessToken;
        mongoose.connection.close();
        res.redirect('/');
      });
    }
    else {
      req.session.error = "Couldn't find the user";
      mongoose.connection.close();
      res.redirect('/');
    }
  });
};

// home page
exports.index = function(req, res) {
  if(req.session.oauthAccessToken) {
    res.redirect('/notes');
  } else {
    res.render('index');
  }
};

// OAuth
exports.oauth = function(req, res) {
  var client = new Evernote.Client({
    consumerKey: config.API_CONSUMER_KEY,
      consumerSecret: config.API_CONSUMER_SECRET,
      sandbox: config.SANDBOX
  });
	
	callbackUrl = "http://" + req.headers.host + "/oauth_callback";
  client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      console.log('what');
      console.log(error);
      req.session.error = JSON.stringify(error);
      res.redirect('/');
    }
    else { 
      // store the tokens in the session
      req.session.oauthToken = oauthToken;
      req.session.oauthTokenSecret = oauthTokenSecret;
      // redirect the user to authorize the token
      res.redirect(client.getAuthorizeUrl(oauthToken));
    }
  });	
};


// OAuth callback
exports.oauth_callback = function(req, res) {
  console.log('hu?');
  var client = new Evernote.Client({
    consumerKey: config.API_CONSUMER_KEY,
      consumerSecret: config.API_CONSUMER_SECRET,
      sandbox: config.SANDBOX
  });

  client.getAccessToken(
      req.session.oauthToken, 
      req.session.oauthTokenSecret, 
      req.param('oauth_verifier'), 
      function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        if(error) {
          console.log('error');
          console.log(error);
          res.redirect('/');
        } else {
          // store the access token in the session
          req.session.oauthAccessToken = oauthAccessToken;
          req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
          req.session.edamShard = results.edam_shard;
          req.session.edamUserId = results.edam_userId;
          req.session.edamExpires = results.edam_expires;
          req.session.edamNoteStoreUrl = results.edam_noteStoreUrl;
          req.session.edamWebApiUrlPrefix = results.edam_webApiUrlPrefix;
          // Since we have successfully authorized with Evernote,
          // Let's ask the User his e-mail, and a password to create
          // a user for him in Evernote.
          // Have to create a new page for this.
					
					// 11/15/2013 Setting the email to 'create' so that
					// the login form won't show.
					req.session.email = 'create';
          res.render('newUser');
        }
      });
}

//oauth callback calls to create a new user.
exports.createUser = function(req,res) {

  var newUser;


  mongoose.connect(connStr, function(err) {
    if (err) console.log(err);
    else console.log("Successfully connected to MongoDB");
  });

  req.session.email = req.body.email;

  // create a user a new user
  newUser = new User({
    email: req.session.email,
          password: req.body.password,
          oauthAccessToken: req.session.oauthAccessToken,
          oauthAccessTokenSecret: req.session.oauthAccessTokenSecret,
          edamShard: req.session.edamShard,
          edamUserId: req.session.edamUserId,
          edamExpires: req.session.edamExpires,
          edamNoteStoreUrl: req.session.edamNoteStoreUrl,
          edamWebApiUrlPrefix: req.session.edamWebApiUrlPrefix
  });

  newUser.save(function(err) {
    if (err) console.log(err);
    else	console.log('Account Creation Successful');
  });
  res.redirect('/notes');
};

// Clear session
exports.clear = function(req, res) {
  req.session.destroy();
  res.redirect('/');
};
