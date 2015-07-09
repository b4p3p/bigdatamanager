"use strict";

function timeLineCtrl() {};

timeLineCtrl.timeLineID = "";
timeLineCtrl.$timeLine = null;
timeLineCtrl.timeLineChart = null;
timeLineCtrl.timeLineLine = null;
timeLineCtrl.$timeLineContainer = null;

timeLineCtrl.$radioDays = null;
timeLineCtrl.$radioWeeks = null;
timeLineCtrl.$radioMonths = null;

timeLineCtrl.$filterButton = null;
timeLineCtrl.$restoreButton = null;

timeLineCtrl.$cmbUsers = null;
timeLineCtrl.$cmbTags = null;

timeLineCtrl.tags = null;
timeLineCtrl.selectedTags = null;
timeLineCtrl.data = null;
timeLineCtrl.filteredData = null;
timeLineCtrl.users = null;
timeLineCtrl.selectedUsers = null;

timeLineCtrl.maxDate = null;
timeLineCtrl.minDate = null;

timeLineCtrl.lineOptions = {
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


timeLineCtrl.initGUI = function ()
{
    console.log("CALL: initGUI");

    timeLineCtrl.$radioDays = $('#radioDays');
    timeLineCtrl.$radioWeeks = $('#radioWeeks');
    timeLineCtrl.$radioMonths = $('#radioMonths');

    timeLineCtrl.$cmbUsers = $('#cmbUsers');
    timeLineCtrl.$cmbTags = $('#cmbTags');

    timeLineCtrl.$filterButton = $('#cmbFilter');
    timeLineCtrl.$restoreButton = $('#cmbRestore');

    timeLineCtrl.$timeLineContainer = $('#timeLineContainer');
    timeLineCtrl.$timeLine = $('#timeLine');
    timeLineCtrl.timeLineID = "timeLine";
};

timeLineCtrl.getData = function()
{
    console.log("CALL: getData");
    async.parallel({
        data: function(next)
        {
            DataCtrl.getField( function(doc){
                timeLineCtrl.data = doc;
                timeLineCtrl.data_day = doc;
                timeLineCtrl.filteredData = doc;
                next(null, doc);
            }, DataCtrl.FIELD.DATA);
        },
        stat: function(next)
        {
            "use strict";
            DataCtrl.getField( function(doc){
                timeLineCtrl.tags = doc.data.allTags;
                next(null, doc);
            }, DataCtrl.FIELD.STAT );
        },
        users: function (next)
        {
            DataCtrl.getField( function(doc){
                timeLineCtrl.users = doc;
                next(null, doc);
            }, DataCtrl.FIELD.USERS, 50);
        }},
        function(err, results) {
            timeLineCtrl.initComboTags();
            timeLineCtrl.initComboUsers();
            timeLineCtrl.removeWait();
        }
    );
};

timeLineCtrl.initComboTags = function()
{
    console.log("CALL: initComboTags");

    _.each(timeLineCtrl.tags, function(obj){
        DomUtil.addOptionValue(timeLineCtrl.$cmbTags, obj);
    });
    timeLineCtrl.$cmbTags.selectpicker('refresh');
};

timeLineCtrl.initComboUsers = function()
{
    console.log("CALL: initComboUsers");

    var obj = null;
    for (var i = 0; i < 50 && i < timeLineCtrl.users.length; i++ )
    {
        obj = timeLineCtrl.users[i];
        DomUtil.addOptionValue(timeLineCtrl.$cmbUsers, obj.user, obj.sum);
    }
    timeLineCtrl.$cmbUsers.selectpicker('refresh');
};

//timeLineCtrl.loadData = function()
//{
//    console.log("CALL: loadData");
//    $.ajax({
//        type: "get",
//        crossDomain: true,
//        dataType: "json",
//        url: "/gettimeline",
//        success: function (data) {
//            timeLineCtrl.data_day = data;
//            timeLineCtrl.data = data;
//            timeLineCtrl.drawTimeLine();
//        },
//        error: function (xhr, status, error) {
//            console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
//            console.error("     Status: " + status + " " + xhr.status);
//            console.error("     Error: " + error);
//        }
//    });
//};

timeLineCtrl.drawTimeLine = function ()
{
    console.log("CALL: drawTimeLine");

    var dataset = timeLineCtrl.lineData();
    var scale = 20;

    timeLineCtrl.$timeLineContainer.removeClass('hidden');
    timeLineCtrl.$timeLineContainer.css("overflow-x", "auto");

    if(timeLineCtrl.$radioWeeks.is(':checked'))
        scale = 50;
    if(timeLineCtrl.$radioMonths.is(':checked'))
        scale = 100;

    $("#" + timeLineCtrl.timeLineID).width(scale * dataset.datasets[0].data.length);

    var hc = $('body > .container').height();
    var htop = $('#formType').height();
    var hmin = hc - htop;
    $("#" + timeLineCtrl.timeLineID).css('max-height', hmin);

    var ctx = document.getElementById(timeLineCtrl.timeLineID).getContext("2d");
    timeLineCtrl.timeLineChart = new Chart(ctx);
    timeLineCtrl.timeLineLine = timeLineCtrl.timeLineChart.Line(
        dataset,
        timeLineCtrl.lineOptions
    );
};

timeLineCtrl.lineData = function ()
{
    console.log("CALL: lineData");
    return {
        labels: timeLineCtrl.getLabels(),
        datasets: timeLineCtrl.getDataset()
    };
};

//Dichiaro funzioni vuote
timeLineCtrl.selectLabelDate = function (date) {};
timeLineCtrl.selectStepDate = function(date) {};

timeLineCtrl.setFuncNextDate = function ()
{
    if(timeLineCtrl.$radioDays.is(':checked'))
    {
        timeLineCtrl.selectLabelDate = function (date) { return date.toShortDate();};
        timeLineCtrl.selectStepDate = function(date) { return date.nextDay();};
    }
    if(timeLineCtrl.$radioWeeks.is(':checked'))
    {
        timeLineCtrl.selectLabelDate = function (date) { return date.toShortWeek();};
        timeLineCtrl.selectStepDate = function(date) { return date.nextWeek();};
    }
    if(timeLineCtrl.$radioMonths.is(':checked'))
    {
        timeLineCtrl.selectLabelDate = function (date) { return  date.getMonthString() + "-" + date.getFullYear()};
        timeLineCtrl.selectStepDate = function(date) { return date.nextMonth()};
    }

};

/**
 * Usa la prima regione per vedere i tag disponibili
 * @returns {Array}
 */
timeLineCtrl.getLabels = function ()
{
    console.log("CALL: getLabels");

    if (timeLineCtrl.filteredData == null || timeLineCtrl.filteredData.length == 0) return [];

    var ris = [];
    var min = timeLineCtrl.minDate;

    while (min < timeLineCtrl.maxDate) {
        ris.push( timeLineCtrl.selectLabelDate(min) );
        min = timeLineCtrl.selectStepDate(min);
    }

    //GVE
    ris.push( timeLineCtrl.selectLabelDate(min) );
    min = timeLineCtrl.selectStepDate(min);
    if(timeLineCtrl.$radioDays.is(':checked')){
        ris.push( timeLineCtrl.selectLabelDate(min) );
        min = timeLineCtrl.selectStepDate(min);}


    return ris;
};

timeLineCtrl.getDataset = function ()
{
    console.log("CALL: getDataset");

    var dataset= timeLineCtrl.getDatasetValue();

    var ris = [];
    ris[0] = {
        label: "Tweets time line",
        fillColor: "rgba(151,187,205,0.2)",
        strokeColor: "rgba(151,187,205,1)",
        pointColor: "rgba(151,187,205,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(151,187,205,1)",
        data: dataset
    };

    return ris;
};

timeLineCtrl.getDatasetValue = function ()
{
    console.log("CALL: getDatasetValue");

    if (timeLineCtrl.filteredData == null || timeLineCtrl.filteredData.length == 0) return [];

    var ris = [];

    var dataset = _.groupBy(timeLineCtrl.filteredData, function(obj){
        return timeLineCtrl.selectLabelDate( new Date(obj.date));
    });
    var min = timeLineCtrl.minDate;

    //Inserisco le date mancanti
    while (min <= timeLineCtrl.maxDate) {
        var key = timeLineCtrl.selectLabelDate(min);
        if (dataset[key] == null)
            ris.push(0);
        else
            ris.push(dataset[key].length);
        min = timeLineCtrl.selectStepDate(min);
    }
    //GVE
    ris.push(0);
    if(timeLineCtrl.$radioDays.is(':checked')) ris.push(0);
    return ris;
};

timeLineCtrl.removeWait = function ()
{
    console.log("remove wait");

    $("#spinner").addClass("hidden");
    $(".timecontent").removeClass("hidden");
};

timeLineCtrl.handleModeClick = function(radio)
{
    console.log("CALL: handleModeClick");

    timeLineCtrl.$filterButton.removeAttr("disabled");
    timeLineCtrl.$restoreButton.prop("disabled", true);
};

timeLineCtrl.clearCanvas = function()
{
    timeLineCtrl.$timeLineContainer.replaceWith(
        '<div id="timeLineContainer" class="timecontent hidden">' +
        '<canvas id="timeLine"></canvas>' +
        '</div>');

    timeLineCtrl.$timeLineContainer = $('#timeLineContainer');
    timeLineCtrl.$timeLine = $('#timeLine');
};

timeLineCtrl.clickFilter = function()
{
    console.log("CALL: clickFilter");

    var $imgFilter = $("#img-filter");
    $imgFilter.removeClass("glyphicon glyphicon-filter");
    $imgFilter.addClass("fa fa-spinner fa-spin");

    setTimeout( function(){

        timeLineCtrl.setFuncNextDate();
        timeLineCtrl.clearCanvas();

        timeLineCtrl.selectedTags = DomUtil.getSelectedCombo(timeLineCtrl.$cmbTags);
        timeLineCtrl.selectedUsers = DomUtil.getSelectedCombo(timeLineCtrl.$cmbUsers);

        if(timeLineCtrl.selectedTags.length == 0)
            DomUtil.selectAll(timeLineCtrl.$cmbTags);

        if(timeLineCtrl.selectedUsers.length == 0)
            DomUtil.selectAll(timeLineCtrl.$cmbUsers);

        $('.selectpicker').selectpicker('refresh');

        var conditions = new ObjConditions(
            null,
            null,
            timeLineCtrl.$cmbTags,
            null,
            timeLineCtrl.$cmbUsers);

        timeLineCtrl.filterData(conditions);

        $imgFilter.removeClass("fa fa-spinner fa-spin");
        $imgFilter.addClass("glyphicon glyphicon-filter");

        timeLineCtrl.$restoreButton.removeAttr("disabled");
        timeLineCtrl.$filterButton.prop("disabled", true);
        timeLineCtrl.drawTimeLine();
    }, 50);
};

timeLineCtrl.filterData = function(objCond)
{
    timeLineCtrl.maxDate = null;
    timeLineCtrl.minDate = null;

    async.filter(timeLineCtrl.data,
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
};

timeLineCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");

    var $imgRestore = $("#img-restore");
    $imgRestore.removeClass("glyphicon glyphicon-remove");
    $imgRestore.addClass("fa fa-spinner fa-spin");

    $imgRestore.removeClass("fa fa-spinner fa-spin");
    $imgRestore.addClass("glyphicon glyphicon-remove");

    timeLineCtrl.clearCanvas();

    timeLineCtrl.filteredData = timeLineCtrl.data;

    DomUtil.deselectAll(timeLineCtrl.$cmbTags);
    DomUtil.deselectAll(timeLineCtrl.$cmbUsers);
    $('.selectpicker').selectpicker('refresh');

    timeLineCtrl.$filterButton.removeAttr("disabled");
    timeLineCtrl.$restoreButton.prop("disabled", true);
};
