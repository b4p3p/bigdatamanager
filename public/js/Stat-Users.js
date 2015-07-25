"use strict";

function UsersCtrl() {};

UsersCtrl.$cmbUsers = null;
UsersCtrl.$restoreButton = null;
UsersCtrl.$statButton = null;

UsersCtrl.data = null;
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
    datasetStrokeWidth: 2,
    //Boolean - Whether to fill the dataset with a colour
    datasetFill: true,
    //String - A legend template
    legendTemplate: ""
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

    DataCtrl.getFromUrl(DataCtrl.FIELD.DATAFILTER, queryString, function(doc) {
        UsersCtrl.data = doc.data;
        UsersCtrl.filteredData = doc.data;
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

UsersCtrl.drawCharts = function() //Tutte le statistiche
{
    UsersCtrl.filterData();

    UsersCtrl.drawTimeLine();
};

UsersCtrl.filterData = function()
{
    console.log("CALL: filterData");

    UsersCtrl.maxDate = null;
    UsersCtrl.minDate = null;

    async.filter(UsersCtrl.data,
        function(obj, next){
            var cond = UsersCtrl.selectedUsers.indexOf(obj.user);
            if(cond)
            {
                var date = new Date(obj.date);
                if(!UsersCtrl.maxDate) UsersCtrl.maxDate = date;
                if(!UsersCtrl.minDate) UsersCtrl.minDate = date;
                UsersCtrl.maxDate = UsersCtrl.maxDate > date ? UsersCtrl.maxDate : date;
                UsersCtrl.minDate = UsersCtrl.minDate < date ? UsersCtrl.minDate : date;
            }
            next(cond);
        },
        function(results) {
            UsersCtrl.filteredData = results;
        }
    );
};

UsersCtrl.handleModeClick = function($radio)
{
    console.log("CALL: handleModeClick");
    UsersCtrl.drawTimeLine();
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

    var ctx = document.getElementById(UsersCtrl.timeLineID).getContext("2d");
    UsersCtrl.timeLineChart = new Chart(ctx);
    UsersCtrl.timeLineLine = UsersCtrl.timeLineChart.Line(
        dataset,
        UsersCtrl.lineOptions
    );
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

    if (UsersCtrl.filteredData == null || UsersCtrl.filteredData.length == 0) return [];

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
    console.log("CALL: getDataset");

    var ris = [];
    _.each(UsersCtrl.selectedUsers, function(user, index){

        async.filter(UsersCtrl.filteredData,
            function(obj, next){
                var cond = objCond.containUser(obj.user) &&
                    objCond.containTag(obj.tag);
                if(cond)
                {
                    var date = new Date(obj.date);
                    if(!timeLineCtrl.maxDate) timeLineCtrl.maxDate = date;
                    if(!timeLineCtrl.minDate) timeLineCtrl.minDate = date;
                    timeLineCtrl.maxDate = timeLineCtrl.maxDate > date ? timeLineCtrl.maxDate : date;
                    timeLineCtrl.minDate = timeLineCtrl.minDate < date ? timeLineCtrl.minDate : date;
                }
                next(cond);
            },
            function(results) {
                timeLineCtrl.filteredData = results;
            }
        );
    var dataset= UsersCtrl.getDatasetValue(user);

        ris[index] = {
            label: "Tweets time line",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: dataset
        };
    });

    return ris;
};

UsersCtrl.getDatasetValue = function (user)
{
    console.log("CALL: getDatasetValue");

    if (UsersCtrl.filteredData == null || UsersCtrl.filteredData.length == 0) return [];

    var ris = [];

    var dataset = _.groupBy(UsersCtrl.filteredData, function(obj){
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
