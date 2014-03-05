var Evernote = require('evernote').Evernote,
		config = require('../config.json'), 
		callbackUrl, 
		childProcess = require('child_process'),
		phantomjs = require('phantomjs'),
		utilityModule = require('./utilityModule.js'),
		mongoose = require('mongoose'),
		connStr = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://127.0.0.1:27017/chalish-user-table",
		User = require('./user-model'),
		currentUser,
		selectedGuid,
		selectedName,
		chartData;

// checking the notes for tables, dates
exports.notes = function(req,res) {
	if (!req.session.oauthAccessToken)
		return res.redirect('/');	

	console.log('user note list: ', currentUser.noteList);

	req.session.noteList = currentUser.noteList;
	console.log('user note list in session: ', req.session.noteList);

	res.render('notes', {token: JSON.stringify(req.session.oauthAccessToken), noteList: null, notes: null, data: null, monthNamesArray: null});
};//end of exports.notes

// when the user clicks the red x,
// delete the note from the noteList,
// no need to re-sort. re-sort is only
// at adding note.
exports.removeNote = function(req, res) {
	// remove the note from user's note list.
	// with ajax.
	var guid = req.body.guid, currentUserNoteListBeforeDataOut, findIndexByGuid, i, length, index, guidIndex;
	currentUserNoteListBeforeDataOut = currentUser.noteList;
	findIndexByGuid = function (array) {
		for (i = 0, length = array.length; i < length; i++) {
			if (array[i] === guid) {
				guidIndex = i;
				break;
			}
		}
	};
	currentUser.noteList.splice(findIndexByGuid(currentUser.noteList), 1);
	mongoose.connect(connStr, function(err) {
		if (err) {
			json = JSON.stringify({error: 'There is a system error, dev has been notified', noteList: null});
			console.log('There is a DB error: ', err.message);
			//the currentuser.notelist is being taken to its original form
			currentUser.noteList = currentUserNoteListBeforeDataOut;
			return;
		}
		currentUser.save(function(err) {
			if (err) {
				json = JSON.stringify({error: err.message, noteList: null});
				console.log('there is an error: ', err.message);
				//the currentuser.notelist is being taken to its original form
				currentUser.noteList = currentUserNoteListBeforeDataOut;
			}
			else {
				req.session.noteList = currentUser.noteList;
				json = JSON.stringify({error: null, noteList: currentUser.noteList});
				console.log('User\'s note list succesfully saved.');
				mongoose.connection.close();
			}
			res.writeHead(200, {'content-type': 'application/json'});
			res.write(JSON.stringify({noteList: req.session.noteList}));
			res.end('\n');
		});
	});
}

// adds the selected note to noteList,
// so that the user can choose a note from the list,
// without waiting all notes being loaded from evernote.
exports.addNoteToList = function(req, res) {
	var count, i, newItem = true, json, errorMessage, currentUserNoteListBeforeDataIn;
	selectedGuid = req.body.selectedGuid;
	selectedName = req.body.selectedName;
	//Check if the noteList already has the note, if not add it.
	for (count = currentUser.noteList.length, i = 0; i < count; i++) {
		if (selectedGuid == currentUser.noteList[i].guid) {
			console.log('new item is false');
			newItem = false;
			break;
		}
	}
	if (newItem) {
		mongoose.connect(connStr, function(err) {
			if (err) {
				json = JSON.stringify({error: 'There is a system error, dev has been notified', noteList: null});
				console.log('there is a DB error: ', err.message);
				return;
			}
			// Adding the selected note to the user and saving.
			// If error, roll back to previous noteList
			currentUserNoteListBeforeDataIn = currentUser.noteList;
			currentUser.noteList.push( {guid: selectedGuid, name: selectedName} );
			//sort the note List Array by name
			//before saving it.
			currentUser.noteList.sort(function (a,b){  
				console.log(a.name);
				console.log(b.name);
				return a.name > b.name ? 1:-1;
			});
			// save after sorting is done
			currentUser.save(function(err) {
				if (err) {
					currentUser.noteList = currentUserNoteListBeforeDataIn;
					json = JSON.stringify({error: err.message, noteList: null});
					console.log('there is an error: ', err.message);
				}
				else {
					req.session.noteList = currentUser.noteList;
					json = JSON.stringify({error: null, noteList: currentUser.noteList});
					console.log('User\'s note list succesfully saved.');
					mongoose.connection.close();
				}
				res.writeHead(200, {'content-type': 'application/json'});
				res.write(json);
				res.end('\n');
			});
		});
	}
	else {
		errorMessage = 'This note is already in your list';
		req.session.error = errorMessage;
		json = JSON.stringify({error: errorMessage, noteList: null});
		res.writeHead(200, {'content-type': 'application/json'});
		res.write(json);
		res.end('\n');
	}
}

// gets all the notes from the Evernote account.
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

	var json;

	if(selectedGuid && selectedGuid != 0) {
		utilityModule.getChartData(req.session.oauthAccessToken, selectedGuid, function (err, chartData) {
			if (err) {
				req.session.error = err.message;
				json = JSON.stringify({error: err.message, chartData: null});
				console.log('there is an error: ', err);
			}
			else {
				console.log('chartdata: ', chartData);
				json = JSON.stringify({error: null, chartData: chartData});
				//res.writeHead(200, {'content-type': 'application/json'});
				//var json = JSON.stringify({error: null, chartData: chartData});
				//res.write(json);
				//res.end('\n');
			}
			res.writeHead(200, {'content-type': 'application/json'});
			res.write(json);
			res.end('\n');
		});
  }//end of if selectedGuid
}

// after login button pressed.
// check the DB for the matching password.
// save email, oauthAccessToken, and noteList to the session.
exports.login = function(req, res) {
  console.log(req.body.email);

  mongoose.connect(connStr, function(err) {
    if (err) console.log(err);
    else console.log("Successfully connected to MongoDB");
  });

  // find user in database
  User.findOne({ email: req.body.email }, function(err, user) {
    if (err) console.log(err);

    if (user instanceof User) {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (err) req.session.error = err;
				//since this is the correct user, let's hold his data,
				//this is for saving his note List.
				currentUser = user;
        //we set the session info back here.
        req.session.email = user.email;
        req.session.oauthAccessToken = user.oauthAccessToken;
				req.session.noteList = user.noteList;
				console.log('here is the notelist:' , req.session.noteList);
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
          edamWebApiUrlPrefix: req.session.edamWebApiUrlPrefix,
					noteList: []
  });

  newUser.save(function(err) {
    if (err) {
			console.log(err);
			mongoose.connection.close();
		}
    else	{
			console.log('Account Creation Successful');
			mongoose.connection.close();
		}
  });

	currentUser = newUser;

  res.redirect('/notes');
}

// Clear session
exports.clear = function(req, res) {
  req.session.destroy();
  res.redirect('/');
};
