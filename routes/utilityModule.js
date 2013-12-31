//This file is used for extracting and manupilating Date Data from Evernote notes.


var	moment = require('moment'),
		fs = require('fs'),
		nodexmllite = require('node-xml-lite'),
    config = require('../config.json'),
		Evernote = require('evernote').Evernote, 
		async = require('async'),
		notes, token, client, sandbox, 
		selectedGuid, dates, 
		client, noteStore,
		monthNamesArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		notes = [], sortFunction, numberOfWorksPerMonth,
		note_filter, filter, offset, maxNotes,
		resultSpec, totalNoteLength;

// Returns data necessary for highcharts if note is appropriate
// returns error if not 
var getChartData = function (token, selectedGuid, toReturn) {
	console.log('token: ', token);
	console.log('selectedGuid', selectedGuid);
	getNoteStore(token).getNoteContent(token, selectedGuid, function(error, noteContent){
		if (error) console.log('fuck this shit: ', error);
		processXML(noteContent, function callback(err, dates) {
			if (err){
				return toReturn(err, null);
			}
			else {
				sortFunction = function (a,b){  
					return a.StartDate.valueOf() - b.StartDate.valueOf();  
				}; 
				dates.sort(sortFunction);
				//We extract previous years' data 
				//Get their average 
				//Average array starts with the average
				//Pushes to the view too as another Axis.
				extractPreviousYearsAverage(dates, function callback(error, previousYearsAverage, thisYearsData) {
					if (err){
						toReturn(err, null);
					}
					else {
						numberOfWorksPerMonth = monthsAndNumberOfWorksDone(thisYearsData, monthNamesArray);
						console.log('numberof works done per month= ', JSON.stringify(numberOfWorksPerMonth));
						averages = calculateAverages(previousYearsAverage, numberOfWorksPerMonth);
						console.log('averages: ', JSON.stringify(averages));
						toReturn(null, { monthNamesArray: monthNamesArray, workData: numberOfWorksPerMonth, averageData: averages } );
					} 
				});
			}
		});
	});
}

// an Evernote client for common use
var getNoteStore = function (token) {
	console.log('enter  here');
	console.log(noteStore);
	if (typeof noteStore !== 'object') {
		console.log('enters here');
		client = new Evernote.Client({ token: token, sandbox: config.SANDBOX});
		return client.getNoteStore();
	}
	else {
		console.log('no, enters here');
		return noteStore;
	}
}


// returns all the notes in the evernote account sorted by name
var notesLoad = function(token, toReturn) {
	notes = [];

	filter = new Evernote.NoteFilter();
	filter.order = 'TITLE';
	filter.ascending = 'false';
	offset = 0;
	maxNotes = '250';
	resultSpec = new Evernote.NotesMetadataResultSpec({includeTitle : 'true'});

	async.doWhilst(
		function (callback) {
			console.log('deneme');
			console.log('offset: ', offset);
			getNoteStore(token).findNotesMetadata (token,  filter, offset, maxNotes, resultSpec, function (error, returnedData) {
				if (error) {
					console.log('error: ', error);
					toReturn(error, null);
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
				callback(error);
			});
		},
		function () {
			return totalNoteLength > notes.length;
		},
		function (err) {
			if (err) {
				toReturn(err, null);
			}
			else if (totalNoteLength == notes.length) {
				notes.sort(function(a, b){
					a = a.title.toLowerCase(); b = b.title.toLowerCase();
					if(a < b) return -1;
					if(a > b) return 1;
					return 0;
				});
				toReturn(null, notes);
			}
		}
	);
}

//Extracts previous years' data, and return their average of work monthly. 
// 1) Extract the dates that are different from this year.
// 2) Divident = Number of works finished before this year
// 3) DividedBy = The number of months passed since the first date in the array
var extractPreviousYearsAverage = function (dates, callback) {
	try {
		var previousYearsDates, thisYearsDates, divider, yearDifference, forEachLength = 0;
		dates.forEach(function(element) {
			forEachLength++;
		});
		previousYearsDates = dates.filter(function (element, index, array) {
			return (element.EndDate.format('YYYY') != moment().format('YYYY'));
		});
		thisYearsDates = dates.filter(function (element, index, array) {
			return (element.EndDate.format('YYYY') == moment().format('YYYY'));
		});
		yearDifference = moment().format('YYYY') - dates[0].EndDate.format('YYYY');
    console.log('yearDifference: ', yearDifference);
		divider = yearDifference > 0 ? yearDifference * 12 + (12 - dates[0].EndDate.format('M')) : 12 - dates[0].EndDate.format('M');
    console.log('divider: ',divider);
    console.log('previousYearsDates.length: ', previousYearsDates.length);
    console.log('previousYearsDates.length/divider: ', Math.floor(previousYearsDates.length/divider));
		return callback(null, Math.floor(previousYearsDates.length/divider), thisYearsDates);
	} catch (e) {
		return callback(e);
	}
	//});
}

//This method is called with the previous years' average and 
//this years work data.  Initial element of the returned array
//will be the previous years' average. With every month data,
//average will be recalculated, and pushed into the array that
//will be returned.
var calculateAverages = function (previousYearsAverage, thisYearsData) {
  var toReturn = [];
  thisYearsData.forEach(function (element) {
    toReturn.push(Math.floor((previousYearsAverage + element)/2));
  });
  return toReturn;
}

//Returns the works done per month.
var monthsAndNumberOfWorksDone = function (dates, monthNamesArray) {
	var toReturn = [];
	for (var i=0; i <= 11; i++) {
		toReturn[i] = 0;
	}
	numberOfDatePairs = dates.length;
	monthNamesArray.forEach(function (monthName, arraku) {
		dates.forEach(function (datePair) {
			if (datePair.EndDate.format('MMM') == monthName) {
				toReturn[arraku]++;
			}
		});
	});
	return toReturn;
}

// Returns Date Data from the selected Note Content
var processXML = function (noteContent, callback) {
	try {
		var parsed, dates = [], tables = [], tableLen, tableChildTr, firstDateColumn, secondDateColumn, firstDateColumnFound = false, secondDateColumnFound = false, algorithmStart, fillDateArray; 
		parsed = nodexmllite.parseString(noteContent);
		//console.log(JSON.stringify(parsed));
		//It used to get the LATEST TABle in the note.
		//Changing it to run for every table in the note. 
		// 12/26/2013
		function checkEveryChild(data) {
			if (data.name == 'table') {
				//console.log(JSON.stringify(data));
				tables.push(data);
			}
			else if (data.childs) {
				data.childs.forEach(function (element) {
					checkEveryChild(element);
				});
			}
		}
		checkEveryChild(parsed);

		//for each of the table in the tables array.
		//if the note has more than one table.
		tableLen = tables.length;
		console.log('tableLen is :', tableLen);
		if (tableLen  > 0) {
			for (var i =tableLen-1; i >= 0; i--) {
				console.log('table[i]: ', i);
				//Table is found. But the direct child of table doesn't start with <tr> necessarilly.
				//So we have to check if the name of the child is tr in a while loop.
				function checkTableChildIsTr(data) {
					if (data.childs[0].name == 'tr') {
						tableChildTr = data;
					}
					else if (data.childs) {
						checkTableChildIsTr(data.childs[0]);
					}
				}
				checkTableChildIsTr(tables[i]);
				//Check every column of the table for 
				//two adjacent date columns.
				if (tableChildTr) {
					console.log('how many rows: ', tables[i].childs.length);
					tables[i].childs.forEach( function (row, rowIndex) {
						console.log('row index is equal to: ', rowIndex);
						// Checking if the table has less than 2 columns.  2 columns are needed. 
						// One is the Date Start, other is Date End Column.
						if (row.childs.length < 2) {
							return;
							//throw new Error("There are not enough number of columns.  Chalish requires at least 2 Columns that contain both a start date, and an end date.");
						}
						// AlgorithmStart checks if two adjacent Date columns are found in the table.
						// If there are, then no need to check again, move on to updating dates array
						// from the Date Start and Date End Columns.
						if (!algorithmStart) {
							firstDateColumnFound = false;
							//For each Column in the Table
							console.log('row childs length: ', row.childs.length);
							row.childs.every(function (columnData, columnIndex) {
								console.log('column index is equal to: ', columnIndex);

								if (!firstDateColumnFound) {
									if (dateFound = checkColumnIfDate(columnData)) {
										firstDateColumnFound = true;
										firstDateColumn = columnIndex;
										//as long as the algorithmStart is not satisfied,
										//it will be safe to overwrite the 0th element 
										//of the date array.  When algorithmStart is satisfied,
										//it won't enter to this block of code anymore.
										dates[0] = {StartDate:dateFound, EndDate:null};
										return true;
									}
								}
								if (firstDateColumnFound && !secondDateColumnFound) {
									//checking if date, if it is 
									//set secondDateColumnFound, secondDateColumn
									if (dateFound = checkColumnIfDate(columnData)) {
										secondDateColumnFound = true;
										secondDateColumn = columnIndex;
										dates[0].EndDate = dateFound;
										//stopping the search for two adjacent 
										//date columns, because they are found.
										algorithmStart = true;
										return false;
									}
								}
								return true;
							}); //end of for every child in table to to check if 
							//two adjacent columns
						} // end of if (! algorithm start)
						// We have found two adjacent Date Columns.
						// We know their column numbers.
						// From now on, we will check if the following rows
						// have date columns too, and will add them to the 
						// date array if so
						else {
							dateColumn1 = checkColumnIfDate(row.childs[firstDateColumn]);
							dateColumn2 = checkColumnIfDate(row.childs[secondDateColumn]);
							if (dateColumn1 && dateColumn2) {
								//since both are full, they are eligible for taking place
								//in the graph, so add them to the Dates Array.
								dates.push({StartDate: dateColumn1, EndDate: dateColumn2});
							}
						} //end of else (algorithmStart)
					});//end of forEach tables[i].childs (rows)
				}//end of if tablechildtr
			}//end of for tables
			console.log('why EXIT SO FAST MOTHERFUCKER!!!!');
		}
		else {
			throw new Error("There is no table in the note you have selected, please try again with another note.");
		}
		if (dates.length == 0)
			throw new Error("Something wrong with the code. Date array is empty");
		console.log('printing out dates array: ', JSON.stringify(dates));
		callback(null, dates);
	} catch (e) {
		console.log(e.stack);
		callback(e, null);
	}
}

// The Date Data in the column sometimes don't appear 
// at the initial column. Have to check for the last child
// for the date data.
var checkColumnIfDate = function (columnData) {
	var checkIfDate;
	function findTheLastChild(element) {
		if (!element.childs)
			return element;
		else
			return findTheLastChild(element.childs[0]);
	}
	checkIfDate = findTheLastChild(columnData);
	return returnIfDate(checkIfDate);
}

var returnIfDate = function (check) {
	if (typeof check === 'string') {
		//console.log('check data: ', check);
		var date = moment(check.trim());
		//console.log('date', date);
		if (date && date.isValid()) {
			//console.log('hell yeah');
			return date;
		}
		else {
			console.log('noooo');
			return null;
		}
	}
	else {
		return null;
	}
}

module.exports.extractPreviousYearsAverage = extractPreviousYearsAverage;
module.exports.monthsAndNumberOfWorksDone = monthsAndNumberOfWorksDone;
module.exports.calculateAverages = calculateAverages;
module.exports.notesLoad = notesLoad;
module.exports.getChartData = getChartData;
