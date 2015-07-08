Date.prototype.nextDay = function () {
    var d = new Date();
    d.setTime(this.getTime() + 1000 * 60 * 60 * 24 * 1);
    return d;
};

Date.prototype.toShortDate = function () {

    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day].join('/');

};

Date.prototype.toDBDate = function () {

    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    return [year, month, day].join('-');

};

timeLineCtrl = {};

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
timeLineCtrl.filteredDatas = null;
timeLineCtrl.users = null;
timeLineCtrl.selectedUsers = null;

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
    legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
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
                timeLineCtrl.filteredDatas = doc;
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

    timeLineCtrl.removeWait();

    //if (timeLineCtrl.timeLineChart != null)
    //    $("#" + timeLineCtrl.timeLineID).replaceWith('<canvas id="TimeLine"></canvas>');

    var difference = timeLineCtrl.getDifference(new Date(timeLineCtrl.data.properties.first),
        new Date(timeLineCtrl.data.properties.last));
    $("#" + timeLineCtrl.timeLineID).width(20 * difference);

    var ctx = document.getElementById(timeLineCtrl.timeLineID).getContext("2d");
    timeLineCtrl.timeLineChart = new Chart(ctx);
    timeLineCtrl.timeLineLine = timeLineCtrl.timeLineChart.Line(timeLineCtrl.lineData(), timeLineCtrl.lineOptions);

};

timeLineCtrl.getDifference = function (dateA, dateB)
{
    console.log("CALL: getDifference");

    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((dateA.getTime() - dateB.getTime()) / (oneDay)));
};

timeLineCtrl.lineData = function ()
{
    console.log("CALL: lineData");
    return {
        labels: timeLineCtrl.getLabels(),
        datasets: timeLineCtrl.getDataset()
    };
};

/**
 * Usa la prima regione per vedere i tag disponibili
 * @returns {Array}
 */
timeLineCtrl.getLabels = function ()
{
    console.log("CALL: getLabels");

    if (timeLineCtrl.data == null || timeLineCtrl.data.length == 0) return [];

    var ris = [];
    var d_ctrl = new Date(timeLineCtrl.data.properties.first);
    var last = new Date(timeLineCtrl.data.properties.last);

    while (d_ctrl < last) {
        ris.push(d_ctrl.toShortDate());
        d_ctrl = d_ctrl.nextDay();
    }
    return ris;
};

timeLineCtrl.getDataset = function ()
{
    console.log("CALL: getDataset");

    var ris = [];
    ris[0] = {
        width: 2000,
        label: "Tweets time line",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: timeLineCtrl.getDatasetValue()
    };
    return ris;
};

timeLineCtrl.getDatasetValue = function ()
{
    console.log("CALL: getDatasetValue");

    if (timeLineCtrl.data == null || timeLineCtrl.data.length == 0) return [];

    var ris = [];
    var d_ctrl = new Date(timeLineCtrl.data.properties.first);
    var last = new Date(timeLineCtrl.data.properties.last);

    while (d_ctrl < last) {
        if (timeLineCtrl.data.data[d_ctrl.toDBDate()] == null)
            ris.push(0);
        else
            ris.push(timeLineCtrl.data.data[d_ctrl.toDBDate()]);
        d_ctrl = d_ctrl.nextDay();
    }
    return ris;
};

timeLineCtrl.removeWait = function ()
{
    console.log("remove wait");

    $("#spinner").addClass("hidden");
    $(".content").removeClass("hidden");
};

timeLineCtrl.handleModeClick = function(radio)
{
    console.log("CALL: handleModeClick");

    timeLineCtrl.$filterButton.removeAttr("disabled");
    timeLineCtrl.$restoreButton.prop("disabled", true);
    if(radio.value == "days"){
        timeLineCtrl.drawTimeLine();
    }
    if(radio.value == "weeks"){
        timeLineCtrl.drawTimeLine();
    }
    if(radio.value == "months"){
        timeLineCtrl.drawTimeLine();
    }
};

timeLineCtrl.clickFilter = function()
{
    console.log("CALL: clickFilter");

    var $imgFilter = $("#img-filter");
    $imgFilter.removeClass("glyphicon glyphicon-filter");
    $imgFilter.addClass("fa fa-spinner fa-spin");

    var conditions = new ObjConditions(
        null,
        null,
        timeLineCtrl.$cmbTags,
        null,
        timeLineCtrl.$cmbUsers);

    var queryString = conditions.getQueryString();

    timeLineCtrl.selectedTags = DomUtil.getSelectedCombo(timeLineCtrl.$cmbTags);
    timeLineCtrl.selectedUsers = DomUtil.getSelectedCombo(timeLineCtrl.$cmbUsers);
    timeLineCtrl.drawTimeLine();

    $imgFilter.removeClass("fa fa-spinner fa-spin");
    $imgFilter.addClass("glyphicon glyphicon-filter");

    timeLineCtrl.$restoreButton.removeAttr("disabled");
    timeLineCtrl.$filterButton.prop("disabled", true);
};

timeLineCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");

    var $imgRestore = $("#img-restore");
    $imgRestore.removeClass("glyphicon glyphicon-remove");
    $imgRestore.addClass("fa fa-spinner fa-spin");

    $imgRestore.removeClass("fa fa-spinner fa-spin");
    $imgRestore.addClass("glyphicon glyphicon-remove");

    timeLineCtrl.$timeLineContainer.replaceWith('<div id="timeLineContainer" class="content hidden">');
    timeLineCtrl.$timeLine.replaceWith('<canvas class="content hidden" id="timeLine"></canvas>');
    timeLineCtrl.$timeLine = $('#timeLine');

    DomUtil.deselectAll(timeLineCtrl.$cmbTags);
    DomUtil.deselectAll(timeLineCtrl.$cmbUsers);
    $('.selectpicker').selectpicker('refresh');

    timeLineCtrl.$filterButton.removeAttr("disabled");
    timeLineCtrl.$restoreButton.prop("disabled", true);
};
