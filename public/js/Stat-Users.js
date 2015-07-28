"use strict";

function UsersCtrl() {};

UsersCtrl.$cmbUsers = null;
UsersCtrl.$restoreButton = null;
UsersCtrl.$statButton = null;

UsersCtrl.data = null;
UsersCtrl.filteredUserData = null;
UsersCtrl.filteredStat = null;
UsersCtrl.users = null;
UsersCtrl.selectedUsers = null;
UsersCtrl.colors = [];

UsersCtrl.maxDate = null;
UsersCtrl.minDate = null;

UsersCtrl.$formType = null;
UsersCtrl.$radioDays = null;
UsersCtrl.$radioWeeks = null;
UsersCtrl.$radioMonths = null;
UsersCtrl.$timeLineContainer = null;
UsersCtrl.timeLineID = null;
UsersCtrl.timeLineChart = null;

UsersCtrl.$barChartContainer = null;
UsersCtrl.barChartID = null;
UsersCtrl.$divBar = null;
UsersCtrl.$AZbutton = null;
UsersCtrl.$ZAbutton = null;

UsersCtrl.$divMap = null;
UsersCtrl.$mapContainer = null;
UsersCtrl.mapChartID = null;

UsersCtrl.getUsers = function (callback)
{
    console.log("CALL: getUsers");

    var $imgFilter = $("#img-filter");
    $imgFilter.removeClass("fa fa-bar-chart");
    $imgFilter.addClass("fa fa-spinner fa-spin");
    DataCtrl.getField( function(doc){
        UsersCtrl.users = doc;
        UsersCtrl.selectedUsers = doc;
        UsersCtrl.initGui();
        $imgFilter.removeClass("fa fa-spinner fa-spin");
        $imgFilter.addClass("fa fa-bar-chart");
        $('.selectpicker').prop('disabled',false);
        $('.selectpicker').selectpicker('refresh');
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
    UsersCtrl.timeLineID = "timeLine";
    UsersCtrl.$AZbutton = $('#AZbutton');
    UsersCtrl.$ZAbutton = $('#ZAbutton');

    UsersCtrl.$divBar = $('#divBar');
    UsersCtrl.$barChartContainer = $('#barChartContainer');
    UsersCtrl.barChartID = "barChart";

    UsersCtrl.$divMap = $('#divMap');
    UsersCtrl.$mapContainer = $('#mapContainer');
    UsersCtrl.mapChartID = "mapChart";

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
        UsersCtrl.colors = colorUtil.generateColor(UsersCtrl.filteredUserData.length);
        UsersCtrl.maxDate = new Date(doc.properties.maxDate);
        UsersCtrl.minDate = new Date(doc.properties.minDate);

        DataCtrl.getField( function(docStat){
            UsersCtrl.filteredStat = docStat;
            UsersCtrl.drawCharts();

            $imgFilter.removeClass("fa fa-spinner fa-spin");
            $imgFilter.addClass("fa fa-bar-chart");
            UsersCtrl.$restoreButton.prop("disabled", false);
            UsersCtrl.$statButton.prop("disabled", true);
        }, DataCtrl.FIELD.STAT );
    });
};

UsersCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");

    DomUtil.deselectAll(UsersCtrl.$cmbUsers);
    $('.selectpicker').selectpicker('refresh');
    UsersCtrl.clearDiv();
    UsersCtrl.$restoreButton.prop("disabled", true);
    UsersCtrl.$statButton.prop("disabled", true);
};

UsersCtrl.drawCharts = function()
{
    UsersCtrl.clearDiv();

    UsersCtrl.$formType.removeClass('hidden');
    UsersCtrl.$timeLineContainer.removeClass('hidden');
    UsersCtrl.drawTimeLine();

    UsersCtrl.$divBar.removeClass('hidden');
    UsersCtrl.$barChartContainer.removeClass('hidden');
    UsersCtrl.$AZbutton.removeAttr("disabled");
    UsersCtrl.$ZAbutton.removeAttr("disabled");
    UsersCtrl.drawBarChart();

    UsersCtrl.$divMap.removeClass('hidden');
    UsersCtrl.$mapContainer.removeClass('hidden');
    UsersCtrl.drawMap();

    //TODO add statistics
};

UsersCtrl.clearDiv = function()
{
    console.log("CALL: clearDiv");

    UsersCtrl.$formType.addClass('hidden');
    UsersCtrl.$timeLineContainer.replaceWith(
        '<div id="timeLineContainer" class="hidden">' +
        '<div id="timeLine"></div>' +
        '</div>');
    UsersCtrl.$timeLineContainer = $('#timeLineContainer');

    UsersCtrl.$divBar.addClass('hidden');
    UsersCtrl.$barChartContainer.replaceWith(
        '<div id="barChartContainer" class="hidden">' +
        '<div id="barChart"></div>' +
        '</div>');
    UsersCtrl.$barChartContainer = $('#barChartContainer');
    UsersCtrl.$AZbutton.prop("disabled", true);
    UsersCtrl.$ZAbutton.prop("disabled", true);

    UsersCtrl.$divMap.addClass('hidden');
    UsersCtrl.$mapContainer.replaceWith(
        '<div id="mapContainer" class="hidden">' +
        '<div id="mapChart"></div>' +
        '</div>');
    UsersCtrl.$mapContainer = $('#mapContainer');
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

UsersCtrl.getDatasetValue = function (userObj)
{
    console.log("CALL: getDatasetValue");

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
    ris.push(0);
    return ris;
};

UsersCtrl.getDataset = function ()
{
    console.log("CALL: getDataset");

    var ris = [];
    ris = UsersCtrl.appendDate(ris);
    _.each(UsersCtrl.filteredUserData, function(userObj, index){
        var rowUser = UsersCtrl.getDatasetValue(userObj);
        _.each(rowUser, function(value, index){
            ris[index].push(value)
        });
    });
    return ris;
};

UsersCtrl.appendDate = function(ris)
{
    console.log("CALL: appendDate");
    var min = UsersCtrl.minDate;

    while (min <= UsersCtrl.maxDate) {
        //var date = UsersCtrl.selectLabelDate(min);
        //ris.push([date]);
        ris.push([new Date(min)]);
        min = UsersCtrl.selectStepDate(min);
    }
    ris.push([new Date(min)]);
    return ris;
};

UsersCtrl.ticks = function()
{
    console.log("CALL: ticks");
    var min = UsersCtrl.minDate;
    var ris = [];

    while (min <= UsersCtrl.maxDate) {
        ris.push(new Date(min));
        min = UsersCtrl.selectStepDate(min);
    }
    ris.push(new Date(min));
    return ris;
};

UsersCtrl.drawTimeLine = function()
{
    console.log("CALL: drawTimeLine");

    UsersCtrl.setFuncNextDate();

    var hAxisLabel = "Days";
    if(UsersCtrl.$radioWeeks.is(':checked'))
        hAxisLabel = "Weeks";
    if(UsersCtrl.$radioMonths.is(':checked'))
        hAxisLabel = "Months";

    var rows = UsersCtrl.getDataset();

    var data = new google.visualization.DataTable();

    data.addColumn('date', hAxisLabel);
    _.each(UsersCtrl.filteredUserData, function(userObj, index){
        data.addColumn('number', userObj.user);
    });

    data.addRows(rows);

    var options = {
        title: 'Users timeline',
        titleTextStyle: { fontSize: 14 },
        curveType: 'function',
        legend: 'none',
        backgroundColor: 'transparent',
        hAxis: {
            slantedText:true,
            slantedTextAngle:60,
            title: hAxisLabel,
            titleTextStyle: { fontSize: 14 },
            format: 'MMM d yyyy',
            maxValue: UsersCtrl.maxDate,
            minValue: UsersCtrl.minDate,
            ticks: UsersCtrl.ticks(),
            textStyle: { fontSize: 13 }
        },
        vAxis: {
            title: 'Number of data',
            titleTextStyle: { fontSize: 14 },
            logScale: false,
            viewWindow: {min:0},
            textStyle: { fontSize: 13 }
        },
        height: 400,
        colors: UsersCtrl.colors,
        chartArea: {
            height: '65%',
            top: '5%'
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById(UsersCtrl.timeLineID));
    chart.draw(data, options);
};

UsersCtrl.handleModeClick = function($radio)
{
    console.log("CALL: handleModeClick");
    UsersCtrl.drawTimeLine();
};

UsersCtrl.drawBarChart = function()
{
    console.log("CALL: drawBarChart");

    if(UsersCtrl.$AZbutton.hasClass("active"))
        UsersCtrl.filteredUserData = _.sortBy(UsersCtrl.filteredUserData, function(obj) { return obj.data; });
    else
    {
        UsersCtrl.filteredUserData = _.sortBy(UsersCtrl.filteredUserData, function(obj) { return obj.data; });
        UsersCtrl.filteredUserData.reverse();
    }

    var data = google.visualization.arrayToDataTable(UsersCtrl.buildBarData());

    var chartAreaHeight = data.getNumberOfRows() * 30;
    var chartHeight = chartAreaHeight + 80;
    var heightBar = 60;

    var options = {
        title: "User tags",
        titleTextStyle: { fontSize: 14 },
        width: "100%",
        height: data.Gf.length == 1? "100%" : chartHeight,
        bar: { groupWidth: heightBar + "%" },
        legend: { position: 'top',  maxLines: 3, textStyle: {fontSize: 13}},
        isStacked: true,
        backgroundColor: 'transparent',
        annotations: {
            alwaysOutside: false,
            textStyle:  { color: "black"}
        },
        chartArea: {'height': chartAreaHeight, 'right':0, 'top': 100, 'left':150 },
        hAxis: {
            title: "Number of tagged data",
            titleTextStyle: { fontSize: 14 },
            textStyle: { fontSize: 13 }},
        vAxis: {
            title: "User",
            titleTextStyle: { fontSize: 14 },
            textStyle: { fontSize: 13 }}
    };
    var chart = new google.visualization.BarChart(document.getElementById(UsersCtrl.barChartID));
    chart.draw(data, options);
};

UsersCtrl.buildBarData = function()
{
    console.log("CALL: buildBarData");

    var data = [];
    var header = UsersCtrl.getHeader();
    data[0] = header;

    _.each(UsersCtrl.filteredUserData, function(userObj, index){

        var row = [];
        row.push(userObj.user);

        var userTags = _.countBy(userObj.data, 'tag');

        _.each(UsersCtrl.filteredStat.data.allTags, function (tag, i) {
            row[i + 1] = 0;
            _.each(userTags, function (val, key) {
                if (tag == key)
                    row[i + 1] = val;
            });
        });
        data.push(row);
    });
    return data;
};

UsersCtrl.getHeader = function()
{
    console.log("CALL: getHeader");

    var ris = [];
    var cont = 1;
    ris[0] = "Users";
    _.each(UsersCtrl.filteredStat.data.allTags, function (tag) {
        ris[cont] = tag;
        cont++;
    });
    return ris;
};

UsersCtrl.AZbuttonClick = function()
{
    console.log("CALL: AZbuttonClick");

    UsersCtrl.$AZbutton.addClass("active");
    UsersCtrl.$ZAbutton.removeClass("active");
    UsersCtrl.drawBarChart();
};

UsersCtrl.ZAbuttonClick = function()
{
    console.log("CALL: ZAbuttonClick");

    UsersCtrl.$ZAbutton.addClass("active");
    UsersCtrl.$AZbutton.removeClass("active");
    UsersCtrl.drawBarChart();
};

UsersCtrl.drawMap = function()
{
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Lat');
    data.addColumn('number', 'Long');
    data.addColumn('string', 'User');

    data.addRows(UsersCtrl.buildMapData());

    var options = {
        showTip: true,
        enableScrollWheel: true,
        zoomLevel: 2,
        mapType: 'normal',
        useMapTypeControl: true,
        mapTypeIds: ['normal', 'terrain', 'satellite'],
        maps: {
            normal: {
                name: 'Normal',
                mapType: 'normal'
               },
            terrain: {
                name: 'Terrain',
                mapType: 'terrain'},
            satellite: {
                name: 'Satellite',
                mapType: 'satellite'}
        }
    };
    var map = new google.visualization.Map(document.getElementById(UsersCtrl.mapChartID));

    map.draw(data, options);
};

UsersCtrl.buildMapData = function()
{
    console.log("CALL: buildMapData");

    var data = [];
    var row = [];
    _.each(UsersCtrl.filteredUserData, function(userObj, index){
        _.each(userObj.data, function(dataObj){
            var text = userObj.user + ': "' + dataObj.text + '"';
            row.push(dataObj.latitude);
            row.push(dataObj.longitude);
            row.push(text);

            data.push(row);
            row = [];
            });
        });

    return data;
};

