var Evernote = require('evernote').Evernote;

var config = require('../config.json');
var callbackUrl = "http://localhost:3000/oauth_callback";

var fs = require('fs');
var sys = require('sys');
var xml2js = require('xml2js');
var xmlsimple = require('xml-simple');
var moment = require('moment');

// checking the notes for tables, dates
exports.check = function(req,res) {
	var table = false;
	fs.readFile('a.txt', function(err, xml) {
		//console.log(data);
		parser = new xml2js.Parser();
		xmlsimple.parse(xml, function(err, parsed) {
			var topKeys = Object.keys(parsed);
			console.log(parsed);

			//Variables to be used in algorithm.
			var i,j,k,l, middleKeys;
			var dates = [];
			var dateLength = 0;
			var firstDateRow, firstDateColumn, secondDateColumn;
			var firstDateColumnFound = false, secondDateColumnFound = false;
			//start date and end date have to be adjacent for my algorithm to work
			var algorithmStart;
			//end variables to be used in algorithm.


			//xml returned
			//checking for a table.
			for (i = 0; i < topKeys.length; i++) {
				middleKeys = parsed[topKeys[i]];
				console.log(middleKeys);
				for(j=0; j < middleKeys.length; j++){
					//Checking for a table.
					if(Object.keys(middleKeys[j]) == 'table') {

						console.log('printing out' + middleKeys[j]);
						table = middleKeys[j].table;

						console.log('printing out table' + table);
						var dateFound;

						//For all the rows
						for(k = 0; k < table.tr.length; k++){
							//Reset firstDateColumnFound if algorithmStart 
							//is not set.  Two columns have to be adjacent for the algorithmStart
							console.log('giriyor');
							if(!algorithmStart) {
								firstDateColumnFound = false;
							}
							//if the table contains only 1 column, return false
							if(table.tr[k].td.length < 2) {
								return "There are not enough number of columns.  Chalish requires at least 2 rows, and columns containing a start date, and an end date";
							}
							else {
								//For all the columns
								for (l = 0; l < table.tr[k].td.length; l++) {
									console.log('giriyor');
									console.log(table.tr[k].td);
									var columnData = table.tr[k].td[l];
									//console.log(columnData);
									//if algorithmStart is true, than read the date from the rows,
									//and store them in the dates array, if they are both filled and they
									//are both Dates.
									if(algorithmStart){
										var a = 0;
										//	if(

										console.log('cikiyor');
									}
									else {
										//Checking for two adjacent columns containing dates.
										//If they are not adjacent, this is not an acceptable row 
										//for the algorithm.
										//Check the first column with a date in it.
										//if(!firstDateColumnFound) {
										//checking if date, if it is 
										//set firstDateColumnFound,firstDateRow,firsDateColumn
										console.log(columnData);
										if(dateFound = checkColumnIfDate(columnData)) {
											console.log('buraya niye girmiyor?');

											firstDateColumnFound = true;
											firstDateRow = k;
											firstDateColumn = l;
											dates[dateLength] = [];
											dates[dateLength, dateLength] = dateFound;
										}
										//}
										if(firstDateColumnFound && !secondDateColumnFound) {
											//checking if date, if it is 
											//set secondDateColumnFound, secondDateColumn
											if(dateFound = checkColumnIfDate(columnData)) {
												secondDateColumnFound = true;
												secondDateColumn = l;
												dates[dateLength][dateLength + 1] = dateFound;
												algorithmStart = true;
												console.log('buraya da giriyor');
											}
										}
									}
								}//end of for all the columns
							}//end of else
							table = true;

							//finish
							//console.log(middleKeys[j]);
							return true;
						}//end of for all the rows
					}//end of if table
				}
			}//end of for topkeys
		});//end of xmlsimple.parse());


	});// end of fs.readFile()
	res.render('index');
}//end of exports.check

checkColumnIfDate = function(columnData) {
	//Data can be found in two ways in the table.
	// 1)columnData.span['\#'] 2)columnData['\#']
	//Check if the data is a Date.
	//find the first columnData with the date.
	//console.log(columnData);
	var dateFound, date;
	if (columnData.span && columnData.span['\#']) {
		//console.log(columnData.span['\#']);
		if (date = returnIfDate(columnData.span['\#'])) {
			dateFound = date;
		}
		//console.log('row: ' + k + ' ,columnData: ' + l);
	}
	if (columnData['\#']){
		if (date = returnIfDate(columnData['\#'])) {
			dateFound = date;
		}
	}
	console.log('hic cikti mi peki buradan?');
	console.log(dateFound);
	return dateFound;

}

returnIfDate = function(check) {
	var date = moment(check);
	if (date.isValid()) {
		return date;
	}
	else {
		return null;
	}
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
		//res.render('index');
		res.redirect('check');
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
