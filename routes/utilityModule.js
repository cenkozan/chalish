var xmlsimple = require('xml-simple');
var xml2js = require('xml2js');
var moment = require('moment');
var fs = require('fs');
var nodexmllite = require('node-xml-lite');

var extractPreviousYearsData = function (dates) {
	var previousYearData = [];
	return previousYearData;
}

var monthsAndNumberOfWorksDone = function (dates, monthNamesArray, average) {
	//console.log('dates: ', JSON.stringify(dates));
	var toReturn = new Array(12), average;
	/*toReturn[0][0] = monthNamesArray[0];
		toReturn[0][1] = 0;*/
	for(var k = 11; k >= 0; k--){
		toReturn[k] = 0;
		//toReturn[k] = [];
		//toReturn[k][0] = monthNamesArray[k];
		//toReturn[k][1] = 0;
	}	var numberOfDatePairs = dates.length;
	console.log('number of date pairs: ', numberOfDatePairs);
	for (var i = 11; i >= 0; i--) {
		for (var j = numberOfDatePairs - 1; j >= 0; j--) {
			//Here we take the ending date, we are calculating the 
			//number of works for the ending dates; so [i][1].
			//console.log('heyoo: ', dates[j][1]);
			//console.log('month to be parsed:', monthNamesArray[i]);
			//console.log('finish date of task: ', dates[j][1].format('MMM'));
			if (dates[j][1].format('MMM') == monthNamesArray[i]) {
				console.log('yanimdaki kiz tas');
				toReturn[i]++;
			}
		}
	}
	if (average) {
		for (var i = 11; i >= 0; i--) {
			average += toReturn[i];
			average = average/12;
		}
		console.log(JSON.stringify(average));
		return average;
	} else {
		console.log(JSON.stringify(toReturn));
		return toReturn;
	}
}

var processXML = function (noteContent, callback) {
	//console.log(noteContent);
	//var parser = new xml2js.Parser();
	//console.log(callback.toString().trim());
	try {
		//noteContent = noteContent.toString().replace( new RegExp( "\>[\n\t ]+\<" , "g" ) , "><" );
		var parsed = nodexmllite.parseString(noteContent);
		//console.log(parsed.childs.length);
		//Variables to be used in algorithm.
		//start date and end date have to be adjacent for 
		//my algorithm to work, algorithmStart will look for this condition.
		var table, i,j,k,l, rowLength, columnLength, table, dates = [], dateLength = 0, firstDateColumn, secondDateColumn, firstDateColumnFound = false, secondDateColumnFound = false, algorithmStart, dateColumn1, dateColumn2, dateFound, columnData, firstRosChilds, secondRowChilds, thirdRowChilds;
		//end variables to be used in algorithm.

		console.log('length: ', parsed.childs.length);

		firstRowChilds = parsed.childs;
		for(l = firstRowChilds.length - 1; l>= 0; l--) {
			console.log();
			secondRowChilds = firstRowChilds[l];
			console.log('secondRowsChilds row: ', l);
			console.log('secondRowsChilds: ', secondRowChilds);
			console.log('second rows length: ', secondRowChilds.childs.length);

			thirdRowChilds = secondRowChilds.childs;
			for (i = thirdRowChilds.length - 1; i >= 0; i--) {
				console.log('helllloo: ', i);
				console.log('thirdRowChilds.childs[i]: ', thirdRowChilds[i]);
				if(thirdRowChilds[i].childs)
					console.log('thirdRowChilds[i].childs: ', thirdRowChilds[i].childs);
				console.log('printing: ', parsed.childs[i].childs[0].name);
				//for(var j = parsed.childs[i].length
				if(thirdRowChilds[i].childs && thirdRowChilds[i].childs[0].name == 'table') {
					console.log('there is a table');
					//console.log(parsed.childs[i].childs[0].childs);
					table = thirdRowChilds[i].childs[0].childs;
					console.log('tableeee: ', table);
					rowLength = table.length;
					for(j = 0; j < rowLength; j++){
						//Reset firstDateColumnFound if algorithmStart 
						//is not set.  Two columns have to be adjacent for the algorithmStart
						//console.log('row: ' + j);
						if (!algorithmStart) {
							firstDateColumnFound = false;
						}

						//if the table contains only 1 column, return false
						columnLength = table[j].childs.length;
						if (columnLength < 2) {
							return "There are not enough number of columns.  Chalish requires at least 2 rows, and columns containing a start date, and an end date";
						}
						else if (algorithmStart) {
							//table is found.
							//it has two adjacent date columns.
							//so we can read from the table 
							//because we know the positions of the dates.
							//we will only take the rows that has both Date values full.
							////console.log('basliyor, row: ' + k);
							//console.log(firstDateColumn);
							//console.log(secondDateColumn);
							//console.log('firstDateColumn: ', table[j].childs[firstDateColumn]);
							dateColumn1 = checkColumnIfDate(table[j].childs[firstDateColumn]);
							////console.log('dateColumn1: ' + JSON.stringify(dateColumn1));
							//console.log('secondDateColumn: ', table[j].childs[secondDateColumn]);
							dateColumn2 = checkColumnIfDate(table[j].childs[secondDateColumn]);
							////console.log('dateColumn2: ' + JSON.stringify(dateColumn2));
							//var dateColumnFound1 = null, dateColumnFound2 = null; 
							if (dateColumn1 && dateColumn2) {
								//since both are full, they are eligible for taking place
								//in the graph, so add them to the Dates Array.
								dates[++dateLength] = [];
								dates[dateLength][0] = dateColumn1;
								dates[dateLength][1] = dateColumn2;
								////console.log('datelength: ' + dateLength);
							}
							////console.log('bitiyor');
							////console.log(dateLength);
						}
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
										dates[0] = [];
										dates[0][0] = dateFound;
										//continue is used so it doesn't enter the condition below.
										continue;
									}
								}
								if (firstDateColumnFound && !secondDateColumnFound) {
									////console.log('vat');
									//checking if date, if it is 
									//set secondDateColumnFound, secondDateColumn
									if (dateFound = checkColumnIfDate(columnData)) {
										secondDateColumnFound = true;
										secondDateColumn = k;
										dates[0][1] = dateFound;
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

		}//end of loop for l
	}
	catch(err) {
		callback("There is a problem with the note you selected, please try again with another note", null);
		console.log(err.stack);
		return;
	}
	//});
	//console.log('printing dates: ', JSON.stringify(dates));
callback(null, dates);
}//end of processXML

var checkColumnIfDate =  function (columnData) {
	//Data can be found in two ways in the table.
	// 1)columnData.span['\#'] 2)columnData['\#']
	//Check if the data is a Date.
	//find the first columnData with the date.
	////console.log('buraya mi');
	//console.log('printing out column data: ', columnData);
	var dateFound = null, date = null;
	//console.log('printing column: ', columnData);
	//console.log('printing data: ', columnData.childs[0].childs[0]);
	if(columnData.childs[0].childs && columnData.childs[0].childs[0]) {
		if (columnData.childs[0].childs[0].indexOf('/') >= 0 || columnData.childs[0].childs[0].indexOf(' ') >= 0 && (date = returnIfDate(columnData.childs[0].childs[0]))) {
			//console.log('spanli: ', date);
			dateFound = date;
		}
	}
	else if (columnData.childs && columnData.childs[0]) {
		if (columnData.childs[0].indexOf('/') >= 0 || columnData.childs[0].indexOf(' ') >= 0 && (date = returnIfDate(columnData.childs[0]))) {
			//console.log('spanli: ', date);
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

	////console.log('hic cikti mi peki buradan?');
	////console.log(dateFound);
	return dateFound;
}

var returnIfDate = function (check) {
	//console.log('entering');
	//console.log('check: ', check);
	var date = moment(check, ["D/M/YY", "MMM D YYYY", "MMM D, YYYY", "dddd, MMMM D, YYYY"]);
	//console.log('printing moment date:', date);
	if (date.isValid()) {
		//console.log('alla alla: ', date);
		return date;
	}
	else {
		return null;
	}
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
module.exports.extractPreviousYearsData = extractPreviousYearsData;
module.exports.monthsAndNumberOfWorksDone = monthsAndNumberOfWorksDone;
