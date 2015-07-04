"use strict";

function RegionRadarCtrl() {};

RegionRadarCtrl.stat = null;
RegionRadarCtrl.regionRadarTable = null;
RegionRadarCtrl.$sliderTimer = null;
RegionRadarCtrl.regions = null;
RegionRadarCtrl.minData = null;
RegionRadarCtrl.maxData = null;
RegionRadarCtrl.$cmbNations = null;

RegionRadarCtrl.radarOptions = {
        //Boolean - Whether to show lines for each scale point
        scaleShowLine : true,
        //Boolean - Whether we show the angle lines out of the radar
        angleShowLineOut : true,
        //Boolean - Whether to show labels on the scale
        scaleShowLabels : false,
        // Boolean - Whether the scale should begin at zero
        scaleBeginAtZero : true,
        //String - Colour of the angle line
        angleLineColor : "rgba(0,0,0,.1)",
        //Number - Pixel width of the angle line
        angleLineWidth : 1,
        //String - Point label font declaration
        pointLabelFontFamily : "'Arial'",
        //String - Point label font weight
        pointLabelFontStyle : "normal",
        //Number - Point label font size in pixels
        pointLabelFontSize : 14,
        //String - Point label font colour
        pointLabelFontColor : "#666",
        //Boolean - Whether to show a dot for each point
        pointDot : true,
        //Number - Radius of each point dot in pixels
        pointDotRadius : 3,
        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth : 1,
        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius : 20,
        //Boolean - Whether to show a stroke for datasets
        datasetStroke : true,
        //Number - Pixel width of dataset stroke
        datasetStrokeWidth : 2,
        //Boolean - Whether to fill the dataset with a colour
        datasetFill : true,
        //String - A legend template
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    };

RegionRadarCtrl.loadData = function()
{
    console.log("CALL: loadData");

    DataCtrl.getField( function(doc){
        RegionRadarCtrl.stat = doc;
        RegionRadarCtrl.regions = doc.data.nations[0].regions; //TODO combo
        RegionRadarCtrl.drawRegionsRadar();
    }, DataCtrl.FIELD.STAT );
};

RegionRadarCtrl.drawRegionsRadar = function()
{
    console.log("CALL: drawRegionsRadar");

    RegionRadarCtrl.removeWait();
    var data = RegionRadarCtrl.getTableData();
    $("#RegionsRadarTable").bootstrapTable( 'load', data );
};

RegionRadarCtrl.getTableData = function()
{
    console.log("CALL: getTableData");

    var ris = [];

    for ( var i = 0; i< RegionRadarCtrl.regions.length; i++)
    {
        var value = RegionRadarCtrl.regions[i];

        //var area = prop.area;
        //var population = prop.population;
        //var density = prop.density;
        //var densityTw = prop.densityTweet;

        var region = value.name;
        var count = value.count;
        var tags = value.counter;

        ris.push({
            id : i ,
            region: region,
            count: count,
            tags: tags
        });
    }
    return ris;
};

RegionRadarCtrl.initGUIEvent = function()
{
    console.log("CALL: initGUIEvent");

    RegionRadarCtrl.$sliderTimer = $("#slider-bar");
    RegionRadarCtrl.$cmbNations = $("#cmbNations");

    RegionRadarCtrl.regionRadarTable = $( "#RegionsRadarTable" );
    $( RegionRadarCtrl.regionRadarTable ).bootstrapTable({}).on('post-body.bs.table', function ()
    {
        console.log("CALL: post-body.bs.table");
        RegionRadarCtrl.refreshRadar();
    });

    $( RegionRadarCtrl.regionRadarTable ).on('check.bs.table', function (e, row, $element)
    {
        console.log("CALL: check.bs.table");
        var sel = RegionRadarCtrl.regionRadarTable.bootstrapTable('getSelections');
        RegionRadarCtrl.setStateCompareForm(sel.length);
    });

    $( RegionRadarCtrl.regionRadarTable ).on('uncheck.bs.table', function (e, row, $element)
    {
        var sel = RegionRadarCtrl.regionRadarTable.bootstrapTable('getSelections');
        RegionRadarCtrl.setStateCompareForm(sel.length);
    });
};

RegionRadarCtrl.refreshRadar = function()
{
    console.log("CALL: refreshRadar");

    var radars = $(".radar");
    var labels = RegionRadarCtrl.getLabelsRadar();
    var radarData = null;

    for(var i = 0; i < radars.length; i++)
    {
        var radar = radars[i];

        if ( radar === null ) continue;

        var index = parseInt(radar.getAttribute("index"));

        radarData = {
            labels: labels,
            datasets: [
                {
                    label: "Tags",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: RegionRadarCtrl.getDataRadar(i)
                }
            ]
        };

        var ctx = radar.getContext("2d");
        var radarChart = new Chart(ctx).Radar(radarData, RegionRadarCtrl.radarOptions);
    }

    return radars.length;
};

/**
 * Dalla prima regione prendo i tag presenti
 * @returns {Array} - ["omofobia", "razzismo", ... ]
 */
RegionRadarCtrl.getLabelsRadar = function()
{
    console.log("CALL: getLabelsRadar");

    var ris = [];
    if( RegionRadarCtrl.regions == null || RegionRadarCtrl.regions.length == 0) return ris;

    var tags = RegionRadarCtrl.stat.data.allTags;
    for ( var t = 0; t < tags.length; t++)
        ris.push( tags[t] );

    return ris;
};

RegionRadarCtrl.getDataRadar = function(index)
{
    console.log("CALL: getDataRadar");

    var ris = [];

    var obj = RegionRadarCtrl.regions[index];
    _.each(RegionRadarCtrl.stat.data.allTags, function (tag) {
        {
            var index = obj.counter.indexOfObject("tag", tag);
            if (index == -1)
                ris.push(0);
            else
                ris.push(obj.counter[index].count);
        }
    });
    return ris;
};

RegionRadarCtrl.setStateCompareForm = function()
{
    //TODO
};

RegionRadarCtrl.enableCompareForm = function()
{
    //TODO
};

RegionRadarCtrl.disableCompareForm = function()
{
    //TODO
};

//'style="margin-right:25%;margin-left:25%;"

RegionRadarCtrl.drawRegionRadar = function(value, row)
{
    console.log("CALL: drawRegionRadar");

    var index = row.id;
    return '<canvas class="radar" id="radar' + index + '" ' +
                    'index="' + index + '"/>'
};

RegionRadarCtrl.removeWait = function()
{
    console.log("CALL: removeWait");

    $("#spinner").addClass("hidden");
    $("#container").removeClass("hidden");

    RegionRadarCtrl.minData = new Date( RegionRadarCtrl.stat.data.minDate );
    RegionRadarCtrl.maxData = new Date( RegionRadarCtrl.stat.data.maxDate );

    RegionRadarCtrl.initSlider();
    RegionRadarCtrl.setSlider();
    RegionRadarCtrl.initComboNations();
};

RegionRadarCtrl.initComboNations = function()
{
    console.log("CALL: initComboNations");

    _.each(RegionRadarCtrl.stat.data.nations, function(obj){
        if(obj.count > 0)
            DomUtil.addOptionValue(RegionRadarCtrl.$cmbNations, obj.name);
    });

    RegionRadarCtrl.$cmbNations.selectpicker('refresh');
};

RegionRadarCtrl.initSlider = function()
{
    console.log("CALL: initSlider");

    RegionRadarCtrl.$sliderTimer.dateRangeSlider(
        {
            enabled : true,
            bounds: {
                min: new Date(1950, 1, 1 ) ,
                max: new Date(2050, 1, 1 )
            } ,
            defaultValues:{
                min: new Date(1950, 1, 1 ),
                max: new Date(2050, 1, 1 )
            }
        });
};

RegionRadarCtrl.setSlider = function()
{
    console.log("CALL: setSlider");

    if( RegionRadarCtrl.minData != null && RegionRadarCtrl.maxData != null  )
    {
        RegionRadarCtrl.$sliderTimer.dateRangeSlider(
            {
                enabled : true,
                bounds:{
                    min: new Date( RegionRadarCtrl.minData ),
                    max: new Date( RegionRadarCtrl.maxData )
                }
            }
        );
    }
    else
        RegionRadarCtrl.$sliderTimer.dateRangeSlider({
            enabled: false
        });
};