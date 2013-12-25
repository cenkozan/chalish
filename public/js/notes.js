$(document).ready(function() {
  function checkVariable() {
    if(session.noteList){
      var options;
      alert(noteList.length);
      alert(data.notes[452].title);
      data.notes.each(function() {
        alert(this);
      });
      for (var i = 0; i < data.notes.length; i++) {
        alert('i: ', i);
        options.append($("<option />").val(data.notes[i].guid).text(data.notes[i].title));
        alert(options);
        $(".select").append(options);
      }
    }
  }
  setTimeout("checkVariable()",1000);
  
/*  $.ajax('/notesLoad', {
    type: 'GET',
    dataType: 'json',
    success: function(data) {
    }
  });*/
});

if (workData) {
  $.getScript('/libs/highcharts.js', function(){
    $.getScript('/libs/exporting.js', function(){
      $(document).ready(function() {
        var chart = new Highcharts.Chart({
          chart: {
            zoomType: 'xy',
            renderTo: 'bar'
          },
          title: {
            text: 'Work Done Per Month'
          },
          subtile: {
            text: 'Averages included'
          },
          xAxis: {
            categories: monthNamesArray
          },
          yAxis: [{
            title: {
              text: 'Number of Works Done',
              style: {
                color: '#4572A7'
              }
            }
            },{
            title: {
              text: 'Average',
              style: {
                color: '#AA4643'
              }
            },
            opposite: true
          }],
          tooltip: {
            shared: true
          },
          legend: {
            layout: 'vertical',
            align: 'left',
            x: 40,
            verticalAlign: 'top',
            y: 40,
            floating: true,
            backgroundColor: '#FFFFFF'
          },
          series: [{
            name: 'Number of Works Done',
            color: '#4572A7',
            type: 'column',
            data:workData
            },{
            name: 'Average',
            type: 'spline',
            color: '#AA4643',
            data:averageData,
            marker: {
              enabled: false
            },
            dashStyle: 'shortdot'
          }]
        });
      });
    });
  });
}
