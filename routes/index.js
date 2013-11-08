var Evernote = require('evernote').Evernote, config = require('../config.json'), callbackUrl = "http://localhost:3000/oauth_callback", childProcess = require('child_process'), phantomjs = require('phantomjs'), utilityModule = require('./utilityModule.js'), mongoose = require('mongoose'), connStr = "mongodb://127.0.0.1:27017/chalish-user-table", User = require('./user-model'), env, mongo, mongourl;
//binPath = phantomjs.path;

// deploying project to AF. 
// Create connection string for mongodb.
if(process.env.VCAP_SERVICES){
	env = JSON.parse(process.env.VCAP_SERVICES);
	mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
	mongo = {
		"hostname":"127.0.0.1",
		"port":27017,
		"username":"",
		"password":"",
		"name":"",
		"db":"chalish-user-table"
	}
}

generate_mongo_url = function(obj){
	obj.hostname = (obj.hostname || 'localhost');
	obj.port = (obj.port || 27017);
	obj.db = (obj.db || 'test');
	if(obj.username && obj.password){
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
	else{
		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
}

mongourl = generate_mongo_url(mongo);


// checking the notes for tables, dates
exports.notes = function(req,res) {

	if (!req.session.oauthAccessToken)
		return res.redirect('/');

	var token = req.session.oauthAccessToken, 
			client = new Evernote.Client({
				token: token,
			sandbox: config.SANDBOX}),
			note_store = client.getNoteStore(),
			selectedGuid = req.body.select, 
			dates, 
			monthNamesArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 
			sortFunction,
			numberOfWorksPerMonth;

	console.log('selectedGuid: ', selectedGuid);
	//console.log('req.body.select: ', req.body.select);

	// If comming from the notes screen & a Note has been selected.
	// In this case, note will have a table, and chalish will create
	// chart from this table.
	if(selectedGuid && selectedGuid != 0) {
		note_store.getNoteContent(token, selectedGuid, function(noteContent){
			//console.log(noteContent);
			utilityModule.processXML2(noteContent, function callback(err, dates) {
				if (err){
					req.session.error = err;
					res.render('notes', {monthNamesArray: null, data: null});
				}
				else {
						sortFunction = function (a,b){  
							return a.StartDate.valueOf() - b.StartDate.valueOf();  
						}; 
						dates.sort(sortFunction);
						//console.log(JSON.stringify(dates));
						//We extract previous years' data 
            //Get their average 
            //Average array starts with the average
            //Pushes
						//to the view too as another Axis.
						utilityModule.extractPreviousYearsAverage(dates, function callback(error, previousYearsAverage, thisYearsData) {
              if (err){
                req.session.error = err;
                res.render('notes', {monthNamesArray: null, data: null});
              }
              else {
                //console.log(thisYearsData);
                numberOfWorksPerMonth = utilityModule.monthsAndNumberOfWorksDone(thisYearsData, monthNamesArray);
                console.log('numberof works done per month= ', JSON.stringify(numberOfWorksPerMonth));
                averages = utilityModule.calculateAverages(previousYearsAverage, numberOfWorksPerMonth);
                console.log('averages: ', JSON.stringify(averages));
                res.render('notes', {monthNamesArray: JSON.stringify(monthNamesArray), workData: JSON.stringify(numberOfWorksPerMonth), averageData: JSON.stringify(averages)});
              } 
            });
        }
      });
    });	

  }
  // If not, chalish will search the notes with the tables in them.
  // Check the else statement below.
  // September 18, 2013  /  Changing this.
  // Notes will be automatically searched, ones with 
  // tables will be in the select list.
  else {

    console.log('enters here');
    //req.session.note_store = note_store;

    var note_filter = new Evernote.NoteFilter();
    //note_filter.order = 'UPDATED';
    //note_filter.ascending = 'false';
    var filter 		= req.query.filter || note_filter;
    var offset 		= req.query.offset || 0;
    var maxNotes 		= req.query.maxNotes || '100';
    var resultSpec = new Evernote.NotesMetadataResultSpec({includeTitle : 'true'});
    //var resultSpec 		= req.query.resultSpec || '';

    note_store.findNotesMetadata(token,  filter, offset, maxNotes, resultSpec, function(returnedData) {;

      if(returnedData.totalNotes === 0){
        console.log('You have 0 notes in your Evernote Account. Chalish requires you have notes in your Evernote account.');
      } else {
        var notes = returnedData.notes;
        res.render('notes', {notes: notes, data: null, monthNamesArray: null});
        req.session.notes = notes;
        /*console.log(notes.totalNotes);
          var metadataList = new Evernote.NotesMetadataList();
          metadataList = notes;
          var note = new Evernote.NoteMetadata();
          note = notes.notes;
          req.session.note = note;
          console.log(note);
          for (var i = 0; i < metadataList.totalNotes; i++) {
          console.log(note[i].guid);
          note_store.getNoteContent(token, note[i].guid, function(callback){
          console.log(callback);
          });
          }*/

        //for now, read from a file, for offline, and speed reasons
        //console.log('processing');
        //returns starts and end dates in an array.
      }
    });
  }
  /*note_store.listNotebooks(token, function(notebooks){
    req.session.notebooks = notebooks;
    res.render('index');
    });*/
};//end of exports.check

// after login button pressed.
// check the DB for the matching password.
exports.login = function(req, res) {
  console.log('hier hier');
  console.log(req.body.email);

  mongoose.connect(mongourl, function(err) {
    if (err) console.log(err);
    else console.log("Successfully connected to MongoDB");
  });


  //testUser = new User({
  //email: 'cok1@ko.com',
  //password: 'Password123',
  //oauthAccessToken: 'a',
  //oauthAccessTokenSecret: 'a',
  //edamShard: 'a',
  //edamUserId: 'a',
  //edamExpires: 'a',
  //edamNoteStoreUrl: 'a',
  //edamWebApiUrlPrefix: 'a'
  //});

  // save user to database
  //testUser.save(function(err) {
  //if (err) throw err;
  //// fetch user and test password verification
  //var kanka = new User();
  User.findOne({ email: req.body.email }, function(err, user) {
    console.log('gut gut');
    if (err) console.log(err);

    console.log('is user instance of User?: ', user instanceof User);
    if (user instanceof User) {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (err) req.session.error = err;
        console.log('User authenticated: ', user.email);
        //we set the session info back here.
        req.session.email = user.email;
        req.session.oauthAccessToken = user.oauthAccessToken;
        mongoose.connection.close();
        res.redirect('/');
      });
    }
    else {
      req.session.error = "couldnt find the user";
      mongoose.connection.close();
      res.redirect('/');
    }
    // test the entered password with the hash in the DB
    //// test a failing password
    //user.comparePassword('123Password', function(err, isMatch) {
    ////if (err) throw err;
    //console.log('123Password:', isMatch); // -&gt; 123Password: false
    //});
  });
  //});


};

// home page
exports.index = function(req, res) {
  if(req.session.oauthAccessToken) {
    console.log('connection already');
    res.redirect('/notes');
  } else {
    console.log('connection not ready');
    //req.session.error =  null;
    res.render('index');
    //res.redirect('notes');
    //res.redirect('highcharts');
  }
};

// OAuth
exports.oauth = function(req, res) {
  console.log('hahahahaha');
  var client = new Evernote.Client({
    consumerKey: config.API_CONSUMER_KEY,
      consumerSecret: config.API_CONSUMER_SECRET,
      sandbox: config.SANDBOX
  });
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
          res.render('newUser');
        }
      });
}

//oauth callback calls to create a new user.
exports.createUser = function(req,res) {

  var newUser;


  mongoose.connect(mongourl, function(err) {
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
