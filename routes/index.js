var Evernote = require('evernote').Evernote;

var config = require('../config.json');
var callbackUrl = "http://localhost:3000/oauth_callback";

var fs = require('fs');
var sys = require('sys');
var xml2js = require('xml2js');

// checking the notes for tables, dates
exports.check = function(req,res) {
	fs.readFile('a.txt', function(err, data) {
		console.log(data);
		parser = new xml2js.Parser();
		parser.addListener('close', function(result) {
			console.dir(result);
			console.log('Done.');
		});
		parser.parseString(data);
		/*parser.parse(data, function(err, parsed) {
			console.log(parsed);
			console.log(parsed.length);
			var parse=0, i;
			for(i=0; i < parsed.length; i++){
			console.log(parsed[i]);
			}
			})*/
	});
	res.redirect('/');
}

// home page
exports.index = function(req, res) {
	if(req.session.oauthAccessToken) {
		var token = req.session.oauthAccessToken;
		var client = new Evernote.Client({
			token: token,
				sandbox: config.SANDBOX});
		var note_store = client.getNoteStore();

		var note_filter = new Evernote.NoteFilter();
		//note_filter.order = 'UPDATED';
		//note_filter.ascending = 'false';
		var filter 		= req.query.filter || note_filter;
		var offset 		= req.query.offset || 0;
		var maxNotes 		= req.query.maxNotes || '100';
		var resultSpec = new Evernote.NotesMetadataResultSpec({includeTitle : 'true', includeContentLength: 'true', includeNotebookGuid: 'true'});
		//var resultSpec 		= req.query.resultSpec || '';

		note_store.findNotesMetadata(token,  filter, offset, maxNotes, resultSpec, function(notes){

			if(notes.totalNotes === 0){
				console.log('You have 0 notes in your Evernote Account. Chalish requires you have notes in your Evernote account.');
			} else {

				console.log('Printing out the notes ');
				console.log(notes);
				console.log(notes.totalNotes);
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
				}
			}
			res.render('index');

		});

		/*note_store.listNotebooks(token, function(notebooks){
			req.session.notebooks = notebooks;
			res.render('index');
			});*/
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

	client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret, results){
		if(error) {
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
					req.session.oauthAccessTtokenSecret = oauthAccessTokenSecret;
					req.session.edamShard = results.edam_shard;
					req.session.edamUserId = results.edam_userId;
					req.session.edamExpires = results.edam_expires;
					req.session.edamNoteStoreUrl = results.edam_noteStoreUrl;
					req.session.edamWebApiUrlPrefix = results.edam_webApiUrlPrefix;
					res.redirect('/');
				}
			});
};

// Clear session
exports.clear = function(req, res) {
	req.session.destroy();
	res.redirect('/');
};
