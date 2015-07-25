"use strict";

function UsersCtrl() {};

UsersCtrl.$cmbUsers = null;
UsersCtrl.$restoreButton = null;
UsersCtrl.$statButton = null;

UsersCtrl.data = null;
UsersCtrl.filteredUserData = null;
UsersCtrl.users = null;
UsersCtrl.selectedUsers = null;

UsersCtrl.maxDate = null;
UsersCtrl.minDate = null;

UsersCtrl.$formType = null;
UsersCtrl.$radioDays = null;
UsersCtrl.$radioWeeks = null;
UsersCtrl.$radioMonths = null;
UsersCtrl.$timeLineContainer = null;
UsersCtrl.$canvasTimeLine = null;
UsersCtrl.timeLineID = null;
UsersCtrl.timeLineChart = null;
UsersCtrl.timeLineLine = null;
UsersCtrl.lineOptions = {
    barValueSpacing: 1,
    animation: false,
    ///Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines: true,
    //String - Colour of the grid lines
    scaleGridLineColor: "rgba(0,0,0,.05)",
    //Number - Width of the grid lines
    scaleGridLineWidth: 1,
    //Boolean - Whether to show horizontal lines (except X axis)
    scaleShowHorizontalLines: true,
    //Boolean - Whether to show vertical lines (except Y axis)
    scaleShowVerticalLines: true,
    //Boolean - Whether the line is curved between points
    bezierCurve: true,
    //Number - Tension of the bezier curve between points
    bezierCurveTension: 0.4,
    //Boolean - Whether to show a dot for each point
    pointDot: true,
    //Number - Radius of each point dot in pixels
    pointDotRadius: 4,
    //Number - Pixel width of point dot stroke
    pointDotStrokeWidth: 1,
    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius: 2,
    //Boolean - Whether to show a stroke for datasets
    datasetStroke: true,
    //Number - Pixel width of dataset stroke
    datasetStrokeWidth: 3,
    //Boolean - Whether to fill the dataset with a colour
    datasetFill: true,
    multiTooltipTemplate: function(valuesObject){
                              if(valuesObject.value != 0)
                                return valuesObject.label + ": " + valuesObject.value;
                                }

    //legendTemplate: '<div>'
    //                    +'<% for (var i=0; i<datasets.length; i++) { %>'
    //                        +'<div>'
    //                            +'<div style=\"background-color:<%=datasets[i].strokeColor%>; width:15px; height:15px; display:inline-block; margin-right:8px\";></div>'
    //                            +'<% if (datasets[i].label) { %><%= datasets[i].label %><% } %>'
    //                        +'</div>'
    //                    +'<% } %>'
    //                +'</div>'
};


UsersCtrl.getUsers = function (callback)
{
    console.log("CALL: getUsers");

    DataCtrl.getField( function(doc){
        UsersCtrl.users = doc;
        UsersCtrl.selectedUsers = doc;
        UsersCtrl.initGui();
    }, DataCtrl.FIELD.USERS );
};

UsersCtrl.initGui = function ()
{
    console.log("CALL: initGui");
    UsersCtrl.$restoreButton = $('#restoreButton');
    UsersCtrl.$statButton = $('#statButton');
    UsersCtrl.$cmbUsers = $('#cmbUsers');

    UsersCtrl.$formType = $('#formType');
    UsersCtrl.$radioDays = $('#radioDays');
    UsersCtrl.$radioWeeks = $('#radioWeeks');
    UsersCtrl.$radioMonths = $('#radioMonths');
    UsersCtrl.$timeLineContainer = $('#timeLineContainer');
    UsersCtrl.$canvasTimeLine = $('#timeLine');
    UsersCtrl.timeLineID = "timeLine";
    UsersCtrl.initComboUsers();
    $('.selectpicker').selectpicker('refresh');
};

UsersCtrl.initComboUsers = function()
{
    console.log("CALL: initComboUsers");

    var obj = null;
    for (var i = 0; i < 50 && i < UsersCtrl.users.length; i++ )
    {
        obj = UsersCtrl.users[i];
        DomUtil.addOptionValue(UsersCtrl.$cmbUsers, obj.user, obj.sum);
    }
};

UsersCtrl.clickStat = function ()
{
    console.log("CALL: clickStat");

    var $imgFilter = $("#img-filter");
    $imgFilter.removeClass("fa fa-bar-chart");
    $imgFilter.addClass("fa fa-spinner fa-spin");

    UsersCtrl.selectedUsers = DomUtil.getSelectedCombo(UsersCtrl.$cmbUsers);
    if( UsersCtrl.selectedUsers.length == 0 )
    {
        UsersCtrl.selectedUsers = UsersCtrl.users;
        DomUtil.selectAll(UsersCtrl.$cmbUsers);
        $('.selectpicker').selectpicker('refresh');
    }

    var conditions = new ObjConditions(
    null,
    null,
    null,
    null,
    UsersCtrl.$cmbUsers);

    var queryString = conditions.getQueryString();

    DataCtrl.getFromUrl(DataCtrl.FIELD.USERDATA, queryString, function(doc) {
        UsersCtrl.data = doc;
        UsersCtrl.filteredUserData = doc.data;
        UsersCtrl.maxDate = new Date(doc.properties.maxDate);
        UsersCtrl.minDate = new Date(doc.properties.minDate);

        UsersCtrl.drawCharts();
        $imgFilter.removeClass("fa fa-spinner fa-spin");
        $imgFilter.addClass("fa fa-bar-chart");
        UsersCtrl.$restoreButton.prop("disabled", false);
        UsersCtrl.$statButton.prop("disabled", true);
    });
};

UsersCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");
    DomUtil.deselectAll(UsersCtrl.$cmbUsers);
    $('.selectpicker').selectpicker('refresh');
    UsersCtrl.clearCanvas();
    UsersCtrl.$restoreButton.prop("disabled", true);
    UsersCtrl.$statButton.prop("disabled", false);
};

UsersCtrl.drawCharts = function()
{
    UsersCtrl.drawTimeLine();
    //TODO add statistics
};

UsersCtrl.drawTimeLine = function ()
{
    console.log("CALL: drawTimeLine");

    UsersCtrl.setFuncNextDate();
    UsersCtrl.clearCanvas();

    var dataset = UsersCtrl.lineData();
    var scale = 20;

    UsersCtrl.$formType.removeClass('hidden');
    UsersCtrl.$timeLineContainer.removeClass('hidden');
    UsersCtrl.$timeLineContainer.css("overflow-x", "auto");

    if(UsersCtrl.$radioWeeks.is(':checked'))
        scale = 50;
    if(UsersCtrl.$radioMonths.is(':checked'))
        scale = 100;

    $("#" + UsersCtrl.timeLineID).width(scale * dataset.datasets[0].data.length);

    var hc = $('body > .container').height();
    var htop = $('#formType').height();
    var hmin = hc - htop;
    $("#" + UsersCtrl.timeLineID).css('max-height', hmin);
    $("#" + UsersCtrl.timeLineID).css('min-height', "250px");
    $("#" + UsersCtrl.timeLineID).css('min-width', "250px");

    var ctx = document.getElementById(UsersCtrl.timeLineID).getContext("2d");
    UsersCtrl.timeLineChart = new Chart(ctx);
    UsersCtrl.timeLineLine = UsersCtrl.timeLineChart.Line(
        dataset,
        UsersCtrl.lineOptions
    );
    //var legend =  UsersCtrl.timeLineLine.generateLegend();
    //$('#timeLineContainer').append(legend);
};

UsersCtrl.clearCanvas = function()
{
    UsersCtrl.$formType.addClass('hidden');
    UsersCtrl.$timeLineContainer.replaceWith(
        '<div id="timeLineContainer" class="hidden">' +
        '<canvas id="timeLine"></canvas>' +
        '</div>');

    UsersCtrl.$timeLineContainer = $('#timeLineContainer');
    UsersCtrl.$timeLine = $('#timeLine');
};

//Dichiaro funzioni vuote
UsersCtrl.selectLabelDate = function (date) {};
UsersCtrl.selectStepDate = function(date) {};

UsersCtrl.setFuncNextDate = function ()
{
    console.log("CALL: setFuncNextDate");

    if(UsersCtrl.$radioDays.is(':checked'))
    {
        UsersCtrl.selectLabelDate = function (date) { return date.toShortDate();};
        UsersCtrl.selectStepDate = function(date) { return date.nextDay();};
    }
    if(UsersCtrl.$radioWeeks.is(':checked'))
    {
        UsersCtrl.selectLabelDate = function (date) { return date.toShortWeek();};
        UsersCtrl.selectStepDate = function(date) { return date.nextWeek();};
    }
    if(UsersCtrl.$radioMonths.is(':checked'))
    {
        UsersCtrl.selectLabelDate = function (date) { return  date.getMonthString() + "-" + date.getFullYear()};
        UsersCtrl.selectStepDate = function(date) { return date.nextMonth()};
    }

};

UsersCtrl.lineData = function ()
{
    console.log("CALL: lineData");
    return {
        labels: UsersCtrl.getLabels(),
        datasets: UsersCtrl.getDataset()
    };
};

/**
 * Usa la prima regione per vedere i tag disponibili
 * @returns {Array}
 */
UsersCtrl.getLabels = function ()
{
    console.log("CALL: getLabels");

    if (UsersCtrl.filteredUserData == null || UsersCtrl.filteredUserData.length == 0) return [];

    var ris = [];
    var min = UsersCtrl.minDate;

    while (min < UsersCtrl.maxDate) {
        ris.push( UsersCtrl.selectLabelDate(min) );
        min = UsersCtrl.selectStepDate(min);
    }

    //GVE
    ris.push( UsersCtrl.selectLabelDate(min) );
    min = UsersCtrl.selectStepDate(min);
    if(UsersCtrl.$radioDays.is(':checked')){
        ris.push( UsersCtrl.selectLabelDate(min) );
        min = UsersCtrl.selectStepDate(min);}

    return ris;
};

UsersCtrl.getDataset = function ()
{
    //console.log("CALL: getDataset");

    var color = colorUtil.generateColor(UsersCtrl.filteredUserData.length);
    var cont = -1;
    var ris = [];
    var dataset = null;
    _.each(UsersCtrl.filteredUserData, function(userObj, index){

        dataset = UsersCtrl.getDatasetValue(userObj);
            ris[index] = {
                label: userObj.user,
                fillColor: "rgba(151,187,205,0.2)",//colorUtil.ColorLuminance(color[index], 1),
                strokeColor: color[index],
                pointColor: color[index],
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: color[index],
                data: dataset
            };
    });

    return ris;
};

UsersCtrl.getDatasetValue = function (userObj)
{
    //console.log("CALL: getDatasetValue");

    if (userObj.data == null || userObj.data.length == 0) return [];

    var ris = [];

    var dataset = _.groupBy(userObj.data, function(obj){
        return UsersCtrl.selectLabelDate( new Date(obj.date));
    });
    var min = UsersCtrl.minDate;

    //Inserisco le date mancanti
    while (min <= UsersCtrl.maxDate) {
        var key = UsersCtrl.selectLabelDate(min);
        if (dataset[key] == null)
            ris.push(0);
        else
            ris.push(dataset[key].length);
        min = UsersCtrl.selectStepDate(min);
    }
    //GVE
    ris.push(0);
    if(UsersCtrl.$radioDays.is(':checked')) ris.push(0);
    return ris;
};

UsersCtrl.handleModeClick = function($radio)
{
    console.log("CALL: handleModeClick");
    UsersCtrl.drawTimeLine();
};
