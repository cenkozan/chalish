function removeNote(id) {
	$.ajax('/removeNote', {
			type: 'GET',
			dataType: 'json',
			success: function (data) {
				$('.noteList').remove();
				$('#bar').before('<div class="noteList"></div>');
				$('.noteList').append('<p>Number of notes: ' + data.noteList.length + '</p>');
				arrangeNoteList(data.noteList);
			}
	});
}
function arrangeNoteList(noteList) {
	$(noteList).each( function() {
		var e = $("<a />", {
				class: "del",
				href: "/#",
				onclick: "removeNote('" + this.guid + "');return false;"
		});
		$('.noteList').append(e);
		$('.noteList').append(" ");
		$('.noteList').append('<a class="notename" href="/#" data-guid=' + this.guid + '>' + this.name + '</a>');
	});
}
$(document).ready(function() {
	$('.chosen').change(function() {
		$('[name=addToList]').prop('disabled', true);
	});
	$('.chosen').prop('disabled', true);
	$('.input').prop('disabled', true);
	$.ajax('/notesLoad', {
			type: 'GET',
			dataType: 'json',
			success: function (data) {
				var options='';
				$(data.notes).each( function() {
					$('.chosen').append('<option value="' + this.guid + '">' + this.title + '</option> \n');
				});
				$('.chosen').prop('disabled', false);
				$('.chosen').chosen();
				$('.input').prop('disabled', false);
				$('.spinner').hide();
			}
	});
	$('[name=addToList]').click(function (event) {
		var selectedGuid = $('.chosen :selected').val(), selectedName = $('.chosen :selected').text();
		$.post('/addNoteToList', {'selectedGuid': selectedGuid, 'selectedName': selectedName}, function(data) {
			if (data.error) {
				$('.error').remove();
				$('.center').append('<div class="error"> <p> Error: ' + data.error + '</p> </div>');
				$('.error p').click(function(){
					data.error = null;
					$('.error').hide(); // hide the overlay
				});
			}
			else{
				$('.noteList').remove();
				$('#bar').before('<div class="noteList"></div>');
				$('.noteList').append('<p>Number of notes: ' + data.noteList.length + '</p>');
				arrangeNoteList(data.noteList);          }
		});
	});
	var getChartEvent = function (event) {
		//Disabling the controls
		$('.chosen').prop('disabled', true);
		$('.input').prop('disabled', true);
		$('.spinner').show();
		var selectedGuid = $('.chosen :selected').val();
		var selectedName = $('.chosen :selected').text();
		if (this.tagName == 'A') {
			var selectedGuid = event.target.getAttribute('data-guid');
			var selectedName = $(this).text();
			event.preventDefault();
		}
		else if (this.tagName == 'DIV') {
			var selectedGuid = $('.chosen :selected').val();
			var selectedName = $('.chosen :selected').text();
		}
		$.post('/getChart', {'selectedGuid': selectedGuid}, function(data) {
			if (data.error) {
				$('.error').remove();
				$('.center').append('<div class="error"> <p> Error: ' + data.error + '</p> </div>');
				$('.error p').click(function(){
					$('.error').hide(); // hide the overlay
				});
				$('#bar').hide();
				$('.chosen').prop('disabled', false);
				$('.input').prop('disabled', false);
				$('[name=addToList]').hide();
			}
			else{
				$('.error').remove();
				$('#bar').show();
				var chart = new Highcharts.Chart({
						chart:   { zoomType: 'xy', renderTo: 'bar' },
						title:   { text: selectedName },
						subtile: { text: 'Averages included' },
						xAxis:   { categories: data.chartData.monthNamesArray },
						yAxis: [{
								title: {
									text: 'Number of Works Done',
									style: { color: '#4572A7' }
								}
						},{
							title: {
								text: 'Average',
								style: { color: '#AA4643' }
							},
							opposite: true
						}],
						tooltip: { shared: true },
						legend: { layout: 'vertical', align: 'left', x: 40,
							verticalAlign: 'top', y: 40, floating: true,
							backgroundColor: '#FFFFFF'
						},
						series: [{
								name: 'Number of Works Done',
								color: '#4572A7',
								type: 'column',
								data: data.chartData.workData
						},{
							name: 'Average',
							type: 'spline',
							color: '#AA4643',
							data: data.chartData.averageData,
							marker: { enabled: false },
							dashStyle: 'shortdot'
						}]
				});
				$('[name=addToList]').show();
				$('.chosen').prop('disabled', false);
				$('.input').prop('disabled', false);
			}
			$('.spinner').hide();
			$('html, body').animate({ scrollTop: $('div#bar')[0].scrollHeight }, 50);
			if (this.tagName == 'A') {
				return false;
			}
		});
	}
	$('[name=action]').click(getChartEvent);    
	$('.notename').click(getChartEvent);    
});
