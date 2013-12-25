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
		console.log(noteContent);
		processXML2(noteContent, function callback(err, dates) {
			if (err){
				return toReturn(err, null);
				//res.render('notes', {monthNamesArray: null, data: null});
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
				//Pushes to the view too as another Axis.
				extractPreviousYearsAverage(dates, function callback(error, previousYearsAverage, thisYearsData) {
					if (err){
						toReturn(err, null);
						//req.session.error = err;
						//res.render('notes', {monthNamesArray: null, data: null});
					}
					else {
						//console.log(thisYearsData);
						numberOfWorksPerMonth = monthsAndNumberOfWorksDone(thisYearsData, monthNamesArray);
						console.log('numberof works done per month= ', JSON.stringify(numberOfWorksPerMonth));
						averages = calculateAverages(previousYearsAverage, numberOfWorksPerMonth);
						console.log('averages: ', JSON.stringify(averages));
						toReturn(null, { monthNamesArray: monthNamesArray, workData: numberOfWorksPerMonth, averageData: averages } );
						//res.render('notes', {monthNamesArray: JSON.stringify(monthNamesArray), workData: JSON.stringify(numberOfWorksPerMonth), averageData: JSON.stringify(averages)});
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
				//notes.push(returnedData.notes);
				//console.log('buraya geldi: ', notes.length);
				callback(error);
			});
		},
		function () {
			//console.log('burada. totalnotelength ve notes.length = ', totalNoteLength, notes.length);
			return totalNoteLength > notes.length;
		},
		function (err) {
			if (err) {
				toReturn(err, null);
			}
			else if (totalNoteLength == notes.length) {
				//console.log('total number of notes: ', totalNoteLength);
				//console.log('total number of notes: ', notes.length);
				notes.sort(function(a, b){
					a = a.title.toLowerCase(); b = b.title.toLowerCase();
					if(a < b) return -1;
					if(a > b) return 1;
					return 0;
				});
				//console.log('emitting, hell yeah');
				toReturn(null, notes);
				//socket.emit('noteLoad', {notes: JSON.stringify(notes)});
				//socket.disconnect();
				//res.writeHead(200, {'content-type': 'text/json' });
				//res.write(JSON.stringify({ notes: notes}));
				//res.end('\n');
			}
		}
	);
}

//Extracts previous years' data, and return their average of work monthly. 
// 1) Extract the dates that are different from this year.
// 2) Divident = Number of works finished before this year
// 3) DividedBy = The number of months passed since the first date in the array
var extractPreviousYearsAverage = function (dates, callback) {
	//domain.run(function (){
	try {
		var previousYearsDates, thisYearsDates, divider, yearDifference, forEachLength = 0;
		//console.log('huloooooogggg!!!!');
		//console.log('dates.length: ', dates.length);
		dates.forEach(function(element) {
			forEachLength++;
		});
		//console.log('foreachlength: ', forEachLength);
		previousYearsDates = dates.filter(function (element, index, array) {
			//console.log(element.EndDate.format('YYYY'));
			return (element.EndDate.format('YYYY') != moment().format('YYYY'));
		});
		thisYearsDates = dates.filter(function (element, index, array) {
			//console.log(element.EndDate.format('YYYY'));
			return (element.EndDate.format('YYYY') == moment().format('YYYY'));
		});
		//console.log(previousYearsDates.length);
		//console.log(thisYearsDates.length);
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
  //toReturn.push(previousYearsAverage);
  //console.log('previousYearsAverage: ', previousYearsAverage);
  thisYearsData.forEach(function (element) {
    //console.log('element: ', element);
    toReturn.push(Math.floor((previousYearsAverage + element)/2));
  });
  return toReturn;
}

//If Average is not true, returns the works done per month.
//If Average is true, returns their average.
var monthsAndNumberOfWorksDone = function (dates, monthNamesArray) {
	//console.log('Entering months method, dates: ', JSON.stringify(dates));
	var toReturn = [];
	for (var i=0; i <= 11; i++) {
		toReturn[i] = 0;
	}
	/*toReturn[0][0] = monthNamesArray[0];
		toReturn[0][1] = 0;*/
	//for(k = 11; k >= 0; k--){
	//toReturn[k] = 0;
	//toReturn[k] = [];
	//toReturn[k][0] = monthNamesArray[k];
	//toReturn[k][1] = 0;
	//}	
	numberOfDatePairs = dates.length;
	//console.log('number of date pairs: ', numberOfDatePairs);
	//console.log(monthNamesArray[6]);
	monthNamesArray.forEach(function (monthName, arraku) {
		//console.log(monthName);
		//console.log(arraku);
		dates.forEach(function (datePair) {
			//console.log(datePair.EndDate.format('MMM'));
			if (datePair.EndDate.format('MMM') == monthName) {
				//console.log('niye girmiyor');
				//console.log(arraku);
				//console.log(toReturn[arraku]);
				toReturn[arraku]++;
				//console.log(toReturn[arraku]);
			}
		});
	});
	//for (i = 11; i >= 0; i--) {
	//for (j = numberOfDatePairs - 1; j >= 0; j--) {
	//Here we take the ending date, we are calculating the 
	//number of works for the ending dates; so [i][1].
	//console.log('heyoo: ', dates[j][1]);
	//console.log('month to be parsed:', monthNamesArray[i]);
	//console.log('finish date of task: ', dates[j][1].format('MMM'));
	//if (dates[j].EndDate.format('MMM') == monthNamesArray[i]) {
	//console.log('yanimdaki kiz tas');
	//toReturn[i]++;
	//}
	//}
	//}
	//console.log(JSON.stringify(toReturn));
	return toReturn;
}

var formatStructure = function (table) {
	console.log('table childs length: ', table.childs.length);
	//console.log(JSON.stringify(table));
}

var processXML2 = function (noteContent, callback) {
	try {
		var parsed, dates = [], table, tableChildTr, firstDateColumn, secondDateColumn, firstDateColumnFound = false, secondDateColumnFound = false, algorithmStart; 
		parsed = nodexmllite.parseString(noteContent);
		//console.log(parsed);
		function checkEveryChild(data) {
			//console.log(data.name);
			//console.log(data.childs);
			if (data.name == 'table') {
				table = data;
			}
			else if (data.childs) {
				data.childs.forEach(function (element) {
					checkEveryChild(element);
				});
			}
		}
		checkEveryChild(parsed);
		//Table is found. But the direct child of table doesn't start with <tr> necessarilly.
		//So we have to check if the name of the child is tr in a while loop.
		//console.log(JSON.stringify(table));
		function checkTableChildIsTr(data) {
			if (data.childs[0].name == 'tr') {
				console.log('true true: ', data.childs[0].name);
				tableChildTr = data;
			}
			else if (data.childs) {
				checkTableChildIsTr(data.childs[0]);
				//jdata.childs.forEach(function (element) {
					//checkTableChildIsTr(element);
				//});
			}
		}
		checkTableChildIsTr(table);
		console.log('true that: ', tableChildTr.childs.length);
		//Check every column of the table for 
		//two adjacent date columns.
		if (tableChildTr) {
			formatStructure(table);
			//For each Row in the Table
			table.childs.forEach(function (row, index) {
				// Checking if the table has less than 2 columns.  2 columns are needed. 
				// One is the Date Start, other is Date End Column.
				if (row.childs.length < 2) {
					throw new Error("There are not enough number of columns.  Chalish requires at least 2 rows, and columns containing a start date, and an end date");
				}
				// AlgorithmStart checks if two adjacent Date columns are found in the table.
				// If there are, then no need to check again, move on to updating dates array
				// from the Date Start and Date End Columns.
				if (!algorithmStart) {
					firstDateColumnFound = false;
					//For each Column in the Table
					row.childs.every(function (columnData, index) {
						//console.log('\n');
						//console.log('columndData: ', JSON.stringify(columnData));
						if (!firstDateColumnFound) {
							if (dateFound = checkColumnIfDate2(columnData)) {
								firstDateColumnFound = true;
								firstDateColumn = index;
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
							if (dateFound = checkColumnIfDate2(columnData)) {
								secondDateColumnFound = true;
								secondDateColumn = index;
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
					//console.log('algorithm starta giriyor');
					dateColumn1 = checkColumnIfDate2(row.childs[firstDateColumn]);
					//console.log('dateColumn1: ' + JSON.stringify(dateColumn1));
					dateColumn2 = checkColumnIfDate2(row.childs[secondDateColumn]);
					//console.log('dateColumn2: ' + JSON.stringify(dateColumn2));
					if (dateColumn1 && dateColumn2) {
						//since both are full, they are eligible for taking place
						//in the graph, so add them to the Dates Array.
						dates.push({StartDate: dateColumn1, EndDate: dateColumn2});
					}

				} //end of else (algorithmStart)
			}); //end of forEach row in table
			console.log('printing out dates array: ', JSON.stringify(dates));
			callback(null, dates);
		}//end of if table
		else {
			throw new Error("There is no table in the note you have selected, please try again with another note.");
		}
	} catch (e) {
		callback(e);
	}
}


var checkColumnIfDate2 = function (columnData) {
	var checkIfDate;
	function findTheLastChild(element) {
		//console.log('element: ', element);
		if (!element.childs)
			return element;
		else
			return findTheLastChild(element.childs[0]);
	}
	checkIfDate = findTheLastChild(columnData);
	//console.log('here it is: ', checkIfDate);
	//console.log('type of data: ', typeof checkIfDate);
	return returnIfDate(checkIfDate);
}

var returnIfDate = function (check) {
	if (typeof check === 'string') {
		//var date = moment(check.trim(), ["m/d/yy", "mmm d yyyy", "mmmm d, yyyy", "dddd, mmmm d, yyyy"]);
		var date = moment(check.trim());
		//console.log('printing moment date:', date);
		if (date && date.isValid()) {
			//console.log('alla alla: ', date);
			return date;
		}
		else {
			return null;
		}
	}
	else {
		return null;
	}
}

var processXML = function (noteContent, callback) {

	//console.log(noteContent);
	//var parser = new xml2js.Parser();
	try {
		//console.log(parsed.childs.length);

		//Variables to be used in algorithm.
		//start date and end date have to be adjacent for 
		//my algorithm to work, algorithmStart will look for this condition.
		var parsed, i,j,k,l, len, rowLength, 
				columnLength, table, dates = [], dateLength = 0, 
				firstDateColumn, secondDateColumn, firstDateColumnFound = false, secondDateColumnFound = false, 
				algorithmStart, dateColumn1, dateColumn2, dateFound, columnData, 
				firstRowChilds, secondRowChilds, thirdRowChilds;

		parsed = nodexmllite.parseString(noteContent);

		console.log('parsed length: ', parsed.childs.length);

		//Going through the rows to look for a table.
		//If there is a table, it's written in the name for 
		//the 3rd child from the root. So 2 more iterations from
		//parsed.childs
		firstRowChilds = parsed.childs;
		for(l = firstRowChilds.length - 1; l>= 0; l--) {
			console.log('First row childs: ', JSON.stringify(firstRowChilds));
			secondRowChilds = firstRowChilds[l];
			//console.log('secondRowsChilds row: ', l);
			//console.log('secondRowsChilds: ', secondRowChilds);
			//console.log('second rows length: ', secondRowChilds.childs.length);

			thirdRowChilds = secondRowChilds.childs;
			for (i = thirdRowChilds.length - 1; i >= 0; i--) {
				//console.log('Going back to row 0 from: ', i);
				//console.log('thirdRowChilds.childs[i]: ', thirdRowChilds[i]);
				if(thirdRowChilds[i].childs)
					console.log('thirdRowChilds length: ', thirdRowChilds[i].childs.length);
				console.log('thirdRowChilds[i].childs: ', JSON.stringify(thirdRowChilds[i].childs));
				//for(var j = parsed.childs[i].length

				//Since table is found, we can use the table data to extract the dates,
				if (thirdRowChilds[i].childs[0].name)
					console.log('HIEYEYHFFFJ', thirdRowChilds[i].childs[0].name);
				if(thirdRowChilds[i].childs && thirdRowChilds[i].childs[0].name == 'table') {
					//console.log('there is a table');
					//console.log(parsed.childs[i].childs[0].childs);
					table = thirdRowChilds[i].childs[0].childs;
					//console.log('tableeee: ', table);
					rowLength = table.length;
					for(j = 0; j < rowLength; j++){
						//Reset firstDateColumnFound if algorithmStart 
						//is not set.  Two columns have to be adjacent for the algorithmStart
						//console.log('IMPORTANT table\'s row: ' + j);
						if (!algorithmStart) {
							firstDateColumnFound = false;
						}

						//if the table contains only 1 column, return false
						columnLength = table[j].childs.length;
						if (columnLength < 2) {
							return "There are not enough number of columns.  Chalish requires at least 2 rows, and columns containing a start date, and an end date";
						}
						//The Table is found.
						//It has two adjacent date columns.
						//So we can read from the table 
						//Because we know the positions of the dates.
						//We will only take the rows that has both Date values full.
						else if (algorithmStart) {
							console.log('basliyor, row: ' + j);
							//console.log(firstDateColumn);
							//console.log(secondDateColumn);
							//console.log('firstDateColumn: ', JSON.stringify(table[j].childs[firstDateColumn]));
							dateColumn1 = checkColumnIfDate(table[j].childs[firstDateColumn]);
							//console.log('dateColumn1: ' + JSON.stringify(dateColumn1));
							//console.log('secondDateColumn: ', JSON.stringify(table[j].childs[secondDateColumn]));
							dateColumn2 = checkColumnIfDate(table[j].childs[secondDateColumn]);
							//console.log('dateColumn2: ' + JSON.stringify(dateColumn2));
							if (dateColumn1 && dateColumn2) {
								//since both are full, they are eligible for taking place
								//in the graph, so add them to the Dates Array.
								//dates[++dateLength] = [];
								//dateLength++;
								dates.push({StartDate: dateColumn1, EndDate: dateColumn2});
								//dates[dateLength].StartDate = dateColumn1;
								//dates[dateLength].EndDate = dateColumn2;
								console.log('datelength: ' + dates.length);
							}
							////console.log('bitiyor');
							////console.log(dateLength);
						}
						//We are checking if there are two adjacent Date columns (the for
						//below only checks for the columns, not the rows)
						//If so, we will set the algorithmStart variable, the IF
						//statement above will run all the algorithm by itself.
						else {
							//console.log('hereeeeee');
							//For all the columns
							////console.log('here important, printin out length of row: ' +table.tr[k].td.length );
							for (k = 0; k < columnLength; k++) {

								////console.log('column: ' + l);
								////console.log('printing out column data: ' + JSON.stringify(table.tr[k].td));

								columnData = table[j].childs[k];
								//console.log('column data: ', columnData);
								//if algorithmStart is true, than read the date from the rows,
								//and store them in the dates array, if they are both filled and they
								//are both Dates.
								//Checking for two adjacent columns containing dates.
								//If they are not adjacent, this is not an acceptable row 
								//for the algorithm.
								//Check the first column with a date in it.
								//checking if date, if it is 
								//set firstDateColumnFound,firstDateRow,firsDateColumn


								////console.log('printing out columndata: ' + JSON.stringify(columnData));

								////console.log('buraya niye girmiyor?');

								//!firstDateColumnFound is used for not entering the same condition again
								if (!firstDateColumnFound) {
									if (dateFound = checkColumnIfDate(columnData)) {
										firstDateColumnFound = true;
										//firstDateRow = j;
										firstDateColumn = k;
										//as long as the algorithmStart is not satisfied,
										//it will be safe to overwrite the 0th element 
										//of the date array.  When algorithmStart is satisfied,
										//it won't enter to this block of code anymore.
										//dates[0] = [];
										//console.log('error atiyor');
										//console.log(dates[0]);
										dates[0] = {StartDate:dateFound, EndDate:null};
										//try {
										//dates[0].StartDate = dateFound;
										//} catch (e) {
										//console.log(e);
										//}
										////console.log('error atmiyior.');
										//continue is used so it doesn't enter the condition below.
										continue;
									}
								}
								if (firstDateColumnFound && !secondDateColumnFound) {
									////console.log('vat');
									//checking if date, if it is 
									//set secondDateColumnFound, secondDateColumn
									if (dateFound = checkColumnIfDate(columnData)) {
										//console.log('2 error atiyor');
										//console.log('2 error atmiyor');
										secondDateColumnFound = true;
										//console.log('2 error atmiyor');
										secondDateColumn = k;
										//console.log('2 error atmiyor');
										dates[0].EndDate = dateFound;
										//console.log('2 error atmiyor');
										//stopping the search for two adjacent 
										//date columns, because they are found.
										algorithmStart = true;
										////console.log('buraya da giriyor');
									}
								}
							}//end of for all the columns
						}//end of else
					}//end of for all the rows
					table = true;
				}//end of if table
				//since table is already found, no need to continue.
				if (table == true) {
					break;
				}

			}//end of loop for i
			if (table == true) {
				break;
			}
		}//end of loop for l
		callback(null, dates);
	}
	catch(err) {
		console.log(err.stack);
		return callback("There is a problem with the note you selected, please try again with another note");
	}
	//});
	//console.log('printing dates: ', JSON.stringify(dates));
}//end of processXML

var checkColumnIfDate =  function (columnData) {
	//Data can be found in two ways in the table.
	// 1)columnData.span['\#'] 2)columnData['\#']
	//Check if the data is a Date.
	//find the first columnData with the date.
	////console.log('buraya mi');
	//console.log('printing out column data: ', columnData);
	var dateFound = null, date = null;
	//console.log('printing column: ',JSON.stringify(columnData));

	//console.log('printing data: ', JSON.stringify(columnData));
	//console.log('printing data\'s data: ', columnData.childs[0].childs[0].childs[0]);

	// Have to find out the content's place here. It's always moving below.
	// Nothing to do but to add the all statements 
	// from below to the upper if statements.
	// Someone better can fix this if he/she knows how to.
	if (columnData.childs && columnData.childs[0].childs && columnData.childs[0].childs[0].childs && columnData.childs[0].childs[0].childs[0]) {
		//console.log('PRINTING HEYOO: ', returnIfDate(columnData.childs[0].childs[0].childs[0]));
		if (columnData.childs[0].childs[0].childs[0].indexOf('/') >= 0 || columnData.childs[0].childs[0].childs[0].indexOf(' ') >= 0 && (date = returnIfDate(columnData.childs[0].childs[0].childs[0]))) {
			//console.log('3lu: ', date);
			dateFound = date;
		}
	}
	else if (columnData.childs && columnData.childs[0].childs && columnData.childs[0].childs[0]) {
		//console.log('what the heck?, checking if date: ', returnIfDate(columnData.childs[0].childs[0]));
		if (columnData.childs[0].childs[0].indexOf('/') >= 0 || columnData.childs[0].childs[0].indexOf(' ') >= 0 && (date = returnIfDate(columnData.childs[0].childs[0]))) {
			//console.log('2li: ', date);
			dateFound = date;
		}
	}
	else if (columnData.childs && columnData.childs[0]) {
		if (columnData.childs[0].indexOf('/') >= 0 || columnData.childs[0].indexOf(' ') >= 0 && (date = returnIfDate(columnData.childs[0]))) {
			//console.log('1li: ', date);
			dateFound = date;
		}
	}
	////console.log('row: ' + k + ' ,columnData: ' + l);
	else if(columnData) {
		//console.log('direk');
		if (columnData.indexOf('/') >= 0 || columnData.indexOf(' ') >= 0 && (date = returnIfDate(columnData))) {
			//console.log('direk: ', date);
			dateFound = date;
		}
	}

	////console.log('Date Found: ', dateFound);
	return dateFound;
}

//console.log(JSON.stringify(parsed));
//console.log(parsed.length);

////console.log(data);
//parser = new xml2js.Parser();
//xmlsimple.parse(content, function (err, parsed) {

/*
	 topKeys = Object.keys(parsed);
//console.log('geldim');

//xml returned
//checking for a table.
for (i = 0; i < topKeys.length; i++) {
//console.log('geldim2');
middleKeys = parsed[topKeys[i]];
//console.log(middleKeys);
for(j=0; j < middleKeys.length; j++){
//Checking for a table.
if (Object.keys(middleKeys[j]) == 'table') {

////console.log('printing out' + JSON.stringify(middleKeys[j]));
table = middleKeys[j].table;

////console.log('printing out table' + JSON.stringify(table));

//For all the rows
////console.log('how many rows: ' + table.tr.length);
}//end of for middlekeys
if (table) {
break;
}
} //end of for topkeys
////console.log('dates array: ' + JSON.stringify(dates));		
dateString = JSON.stringify(dates);
//Date Array is ready
//Moving onto highcharts
//I have the dates now, find the min of the start dates.

//console.log('at the end of processXML, dates array: ', JSON.stringify(dates));

//var graphStartDate, graphStartMonth, graphStartYear;

//var content = fs.readFileSync('a.txt', "UTF-8");
//var monthNamesArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], xAxis = monthNamesArray.unshift('Prev. Av.'), graphStartMonth = dates[0][0].format('MMM'), graphStartYear = dates[0][0].format('YYYY'), previousYearData = null;
//here we check the matching month name, we don't take the preceding months

/*if (moment().format('YYYY') > graphStartYear) {
//console.log('burasi mi heyooo');
previousYearData = extractPreviousYearsData(dates);
}
else {*/
//console.log('printing dates: ', dates);
//JSON.stringify(dates);
//monthsAndNumberOfWorksDone(dates);
//return dates;
//}

//while (monthNamesArray[0] != graphStartMonth) {
//	monthNamesArray.shift();
//}

//console.log(monthNamesArray);


//and lastly, pass the parameters to view.


//	});//end of xmlsimple.parse());


module.exports.processXML = processXML;
module.exports.processXML2 = processXML2;
module.exports.extractPreviousYearsAverage = extractPreviousYearsAverage;
module.exports.monthsAndNumberOfWorksDone = monthsAndNumberOfWorksDone;
module.exports.calculateAverages = calculateAverages;
module.exports.notesLoad = notesLoad;
module.exports.getChartData = getChartData;
