$(function () {
	$(document).ready(function() {
		var chart = new Highcharts.Chart({
			chart: {
				renderTo: 'bar',
				type: 'column'
			},
			title: {
				text: 'Dates'
			},
			series: [{name: 'Dates', data:dates}]
		});
	})
});

