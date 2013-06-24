$(function () {
  
  $(document).ready(function() {
    barChart();
    //pieChart();
  });

});

function barChart() {
  var chart;
  chart = new Highcharts.Chart({
      chart: {
          renderTo: 'bar',
          type: 'column'
      },
      title: {
          text: 'Dates'
      }
      xAxis: {
          categories: ['Jan', 'Feb', 'March', 'Grapes', 'Bananas']
      },
      tooltip: {
          formatter: function() {
              return ''+
                  this.series.name +': '+ this.y +'';
          }
      },
      credits: {
          enabled: false
      },
      series: [{
          name: 'John',
          data: [5, 3, 4, 7, 2]
      }, {
          name: 'Jane',
          data: [2, -2, -3, 2, 1]
      }, {
          name: 'Joe',
          data: [3, 4, 4, -2, 5]
      }]
  });
}

function pieChart() {
  var chart;
  chart = new Highcharts.Chart({
    chart: {
        renderTo: 'pie',
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false
    },
    title: {
        text: 'Browser market shares at a specific website, 2010'
    },
    tooltip: {
        formatter: function() {
            return '<b>'+ this.point.name +'</b>: '+ this.percentage +' %';
        }
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        }
    },
    series: [{
        type: 'pie',
        name: 'Browser share',
        data: [
            ['Firefox',   45.0],
            ['IE',       26.8],
            {
                name: 'Chrome',
                y: 12.8,
                sliced: true,
                selected: true
            },
            ['Safari',    8.5],
            ['Opera',     6.2],
            ['Others',   0.7]
        ]
    }]
  });
}





