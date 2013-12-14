var socketio = require('socket.io'), Evernote = require('evernote').Evernote, 
		utilityModule = require('./utilityModule.js'), async = require('async'),
		token, client, sandbox, config = require('../config.json'), note_store,
		selectedGuid, dates, 
		monthNamesArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], notes = [], sortFunction, numberOfWorksPerMonth, io, 
		note_filter, filter, offset, maxNotes, resultSpec, totalNoteLength;

exports.socketServer = function (server) {

	io = socketio.listen(server);
	io.set('log level', 1);

	io.sockets.on('connection', function (socket) {
		console.log('heyooo, someone connected asdfdf');

		socket.on('requestNotes', function(data) {
			console.log('here is da data: ', data);
			token = data.token;
			client = new Evernote.Client({ token: token, sandbox: config.SANDBOX});
			note_store = client.getNoteStore();
			//console.log('enters here');
			//req.session.note_store = note_store;

			filter = new Evernote.NoteFilter();
			filter.order = 'TITLE';
			filter.ascending = 'false';
			offset = 0;
			maxNotes = '250';
			resultSpec = new Evernote.NotesMetadataResultSpec({includeTitle : 'true'});

			console.log('buraya geliyor mu?');

			async.doWhilst(
				function (callback) {
					console.log('deneme');
					console.log('offset: ', offset);
					note_store.findNotesMetadata (token,  filter, offset, maxNotes, resultSpec, function (error, returnedData) {
						if (error) {
							console.log('error: ', error);
							callback(error);
						}
						totalNoteLength = returnedData.totalNotes;
						offset = offset + returnedData.notes.length;
						console.log('offset: ', offset);
						console.log('totalNoteLength: ', totalNoteLength);
						console.log('returnedData notes length: ', returnedData.notes.length);
						function pushArray (element, index, array) {
							notes.push(element);
						}
						returnedData.notes.forEach(pushArray);
						//notes.push(returnedData.notes);
						console.log('buraya geldi: ', notes.length);
						callback(error);
					});
				},
				function () {
					console.log('burada. totalnotelength ve notes.length = ', totalNoteLength, notes.length);
					return totalNoteLength > notes.length;
				},
				function (err) {
					if (totalNoteLength == notes.length) {
						console.log('total number of notes: ', totalNoteLength);
						console.log('total number of notes: ', notes.length);
						notes.sort(function(a, b){
							a = a.title.toLowerCase(); b = b.title.toLowerCase();
							if(a < b) return -1;
							if(a > b) return 1;
							return 0;
						});
						console.log('emitting, hell yeah');
						socket.emit('noteLoad', {notes: JSON.stringify(notes)});
						socket.disconnect();
					}
				}
			);
			//io.sockets.on('connection', function(socket) {
			//socket.emit('noteLoad', {my: 'object' });
			//console.log('someone connected');
			//});

			//req.session.on('connection', function (err, socket, session) {
			//socket.emit('noteLoad', 'object');
			//});

			//var resultSpec 		= req.query.resultSpec || '';

			//note_store.findNotesMetadata(token,  filter, offset, maxNotes, resultSpec, function(error, returnedData) {

				//console.log('returned data: ', JSON.stringify(returnedData));
				//console.log('error: ', error);
				//if (error) {
					//console.log('errroooorrrr: ', error.message);
					//return;
				//}
				//if(returnedData.totalNotes === 0){
					//console.log('You have 0 notes in your Evernote Account. Chalish requires you have notes in your Evernote account.');
				//} else {
					//currentNoteLength = returnedData.notes.length;
					//var notes = returnedData.notes;
					//console.log('notes length: ', notes.length);
			
			//res.render('notes', {notes: notes, data: null, monthNamesArray: null});
			//req.session.notes = notes;
				//}
			//});
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

		});


		//var token = req.session.oauthAccessToken, client = new Evernote.Client({ token: token, sandbox: config.SANDBOX}), note_store = client.getNoteStore(), selectedGuid = req.body.select, dates, monthNamesArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], sortFunction, numberOfWorksPerMonth;

		//console.log('selectedGuid: ', selectedGuid);
		//console.log('req.body.select: ', req.body.select);

		// If comming from the notes screen & a Note has been selected.
		// In this case, note will have a table, and chalish will create
		// chart from this table.
		if(selectedGuid && selectedGuid != 0) {
			note_store.getNoteContent(token, selectedGuid, function(err, noteContent){
				//console.log('here goes the notecontent: ', noteContent);
				utilityModule.processXML2(noteContent, function callback(err, dates) {
					if (err){
						socket.emit('noteLoad', {error: err});
						//req.session.error = err;
						//res.render('notes', {monthNamesArray: null, data: null});
						return;
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
		else {

		}//end of else
		/*note_store.listNotebooks(token, function(notebooks){
			req.session.notebooks = notebooks;
			res.render('index');
			});*/

	});
};
