"use strict";
function CompareCtrl() {}

var socket = null;

CompareCtrl.selectedRegions = null;
CompareCtrl.selectedNations = null;

CompareCtrl.stat = null;
CompareCtrl.filteredStat = null;
CompareCtrl.minData = null;
CompareCtrl.maxData = null;

CompareCtrl.$radioNations = null;
CompareCtrl.$radioRegions = null;
CompareCtrl.$cmbNations = null;
CompareCtrl.$cmbRegions = null;
CompareCtrl.$filterButton = null;
CompareCtrl.$restoreButton = null;
CompareCtrl.$container = null;
CompareCtrl.$barChart = null;
CompareCtrl.$sliderTimer = null;
CompareCtrl.$radarLegend = null;
CompareCtrl.$radarChart = null;

CompareCtrl.$formRegions = null;
CompareCtrl.$formNations = null;
CompareCtrl.$radioByNumber = null;
CompareCtrl.$radioByPercentage = null;

CompareCtrl.$radioBar = null;
CompareCtrl.$radioRadar = null;

CompareCtrl.$NameButton = null;
CompareCtrl.$NumButton = null;
CompareCtrl.$AZbutton = null;
CompareCtrl.$ZAbutton = null;
CompareCtrl.radarChartID = null;

CompareCtrl.BarData = null;
CompareCtrl.RadarData = null;
CompareCtrl.type = "Nations";

CompareCtrl.init = function()
{
    console.log("CALL: init");

    CompareCtrl.$radioBar = $('#radioBar');
    CompareCtrl.$radioRadar = $('#radioRadar');

    CompareCtrl.$radioByNumber = $('#radioByNumber');
    CompareCtrl.$radioByPercentage = $('#radioByPercentage');

    CompareCtrl.$formRegions = $('#formRegions');
    CompareCtrl.$formNations = $('#formNations');

    CompareCtrl.$radioNations = $('#radioNations');
    CompareCtrl.$radioRegions = $('#radioRegions');

    CompareCtrl.$cmbRegions = $('#cmbRegions');
    CompareCtrl.$cmbNations = $("#cmbNations");

    CompareCtrl.$container = $('#container');
    CompareCtrl.$barChart = $('#barChart');
    CompareCtrl.radarChartID = 'radarChart';
    CompareCtrl.$radarLegend = $('#radarLegend');
    CompareCtrl.$radarChart = $('#radarChart');
    CompareCtrl.$sliderTimer = $("#slider-bar");

    CompareCtrl.$filterButton = $('#cmbFilter');
    CompareCtrl.$restoreButton = $('#cmbRestore');

    CompareCtrl.$NameButton = $('#NameButton');
    CompareCtrl.$NumButton = $('#NumButton');
    CompareCtrl.$AZbutton = $('#AZbutton');
    CompareCtrl.$ZAbutton = $('#ZAbutton');
};

CompareCtrl.initSlider = function()
{
    console.log("CALL: initSlider");

    CompareCtrl.$sliderTimer.dateRangeSlider(
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

CompareCtrl.setSlider = function()
{
    console.log("CALL: setSlider");

    if( CompareCtrl.minData != null && CompareCtrl.maxData != null  )
    {
        CompareCtrl.$sliderTimer.dateRangeSlider(
            {
                enabled : true,
                bounds:{
                    min: new Date( CompareCtrl.minData ),
                    max: new Date( CompareCtrl.maxData )
                }
            }
        );
    }
    else
        CompareCtrl.$sliderTimer.dateRangeSlider({
            enabled: false
        });
};

CompareCtrl.getFilteredStat = function(callback)
{
    var conditions = new ObjConditions(
        CompareCtrl.$cmbNations,
        CompareCtrl.$cmbRegions,
        null,
        CompareCtrl.$sliderTimer);

    DataCtrl.getFromUrl(DataCtrl.FIELD.STAT, conditions.getQueryString(), function(docStat){

        if(docStat.data.syncTags.length == 0)
        {
            $('#error').removeClass('hidden');
            CompareCtrl.$restoreButton.removeAttr("disabled");
            CompareCtrl.$filterButton.prop("disabled", true);
        }
        else
        {
            CompareCtrl.filteredStat = docStat;
            callback();
        }

    }, {type:"post", query:conditions.value});
};

CompareCtrl.clickFilter = function()
{
    console.log("CALL: clickFilter");
    $('#error').addClass('hidden');

    CompareCtrl.getFilteredStat(function () {

        var $imgFilter = $("#img-filter");
        $imgFilter.removeClass("glyphicon glyphicon-filter");
        $imgFilter.addClass("fa fa-spinner fa-spin");

        setTimeout( function(){

            if(CompareCtrl.$radioBar.is(':checked'))
                $('#formSort').removeClass('hidden');
            else
                $('#formSort').addClass('hidden');

            CompareCtrl.$NameButton.removeAttr("disabled");
            CompareCtrl.$NumButton.removeAttr("disabled");
            CompareCtrl.$AZbutton.removeAttr("disabled");
            CompareCtrl.$ZAbutton.removeAttr("disabled");

            CompareCtrl.$barChart.replaceWith('<div id="barChart" style="margin-top: 50px"></div>');
            CompareCtrl.$barChart = $('#barChart');
            CompareCtrl.$radarLegend.replaceWith('<div class="col-md-3" id="radarLegend"></div>');
            CompareCtrl.$radarLegend = $('#radarLegend');
            CompareCtrl.$radarChart.replaceWith('<canvas class="radar "id="radarChart" width="400" height="400"></canvas>');
            CompareCtrl.$radarChart = $('#radarChart');

            if(CompareCtrl.$radioRegions.is(':checked'))
            {
                CompareCtrl.type = "Regions";
                CompareCtrl.selectedRegions = DomUtil.getSelectedCombo(CompareCtrl.$cmbRegions);
                if(CompareCtrl.selectedRegions.length == 0)
                {
                    DomUtil.selectAll(CompareCtrl.$cmbRegions);
                    CompareCtrl.$cmbRegions.multiselect('refresh');
                    CompareCtrl.selectedRegions = DomUtil.getSelectedCombo(CompareCtrl.$cmbRegions);
                }
                if(CompareCtrl.$radioBar.is(':checked'))
                    CompareCtrl.buildBarData(CompareCtrl.selectedRegions);
                if(CompareCtrl.$radioRadar.is(':checked'))
                {
                    CompareCtrl.buildRadarData(CompareCtrl.selectedRegions);
                }
            }
            else
            {
                CompareCtrl.type = "Nations";
                CompareCtrl.selectedNations = DomUtil.getSelectedCombo(CompareCtrl.$cmbNations);
                if(CompareCtrl.selectedNations.length == 0)
                {
                    DomUtil.selectAll(CompareCtrl.$cmbNations);
                    CompareCtrl.$cmbNations.selectpicker('refresh');
                    CompareCtrl.selectedNations = DomUtil.getSelectedCombo(CompareCtrl.$cmbNations);
                }
                if(CompareCtrl.$radioBar.is(':checked'))
                    CompareCtrl.buildBarData(CompareCtrl.selectedNations);
                if(CompareCtrl.$radioRadar.is(':checked'))
                {
                    CompareCtrl.buildRadarData(CompareCtrl.selectedNations);
                }
            }

            $imgFilter.removeClass("fa fa-spinner fa-spin");
            $imgFilter.addClass("glyphicon glyphicon-filter");

            CompareCtrl.$restoreButton.removeAttr("disabled");
            CompareCtrl.$filterButton.prop("disabled", true);
        });
    }, 50);
};

CompareCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");
    $('#error').addClass('hidden');

    var $imgRestore = $("#img-restore");
    $imgRestore.removeClass("glyphicon glyphicon-remove");
    $imgRestore.addClass("fa fa-spinner fa-spin");

    CompareCtrl.filteredStat = CompareCtrl.stat;
    CompareCtrl.$sliderTimer.dateRangeSlider("min", CompareCtrl.minData);
    CompareCtrl.$sliderTimer.dateRangeSlider("max",  CompareCtrl.maxData);

    CompareCtrl.$barChart.replaceWith('<div id="barChart" style="margin-top: 50px"></div>');
    CompareCtrl.$barChart = $('#barChart');
    CompareCtrl.$radarLegend.replaceWith('<div class="col-md-3" id="radarLegend"></div>');
    CompareCtrl.$radarLegend = $('#radarLegend');
    CompareCtrl.$radarChart.replaceWith('<canvas class="radar "id="radarChart" width="400" height="400"></canvas>');
    CompareCtrl.$radarChart = $('#radarChart');

    DomUtil.deselectAll(CompareCtrl.$cmbRegions);
    CompareCtrl.$cmbRegions.multiselect('refresh');
    DomUtil.deselectAll(CompareCtrl.$cmbNations);
    CompareCtrl.$cmbNations.selectpicker('refresh');

    $imgRestore.removeClass("fa fa-spinner fa-spin");
    $imgRestore.addClass("glyphicon glyphicon-remove");

    CompareCtrl.$filterButton.removeAttr("disabled");
    CompareCtrl.$restoreButton.prop("disabled", true);

    $('#formSort').addClass('hidden');
    CompareCtrl.$NameButton.prop("disabled", true);
    CompareCtrl.$NumButton.prop("disabled", true);
    CompareCtrl.$AZbutton.prop("disabled", true);
    CompareCtrl.$ZAbutton.prop("disabled", true);
};

/**
 *
 * @param obj
 * @returns {Array} - eg. ['obj.name', 0, "", 5, "", 0, "", 10, ""];
 */

CompareCtrl.buildBarData = function(dataSelected)
{
    console.log("CALL: buildBarData");

    var data = [];
    data[0] = CompareCtrl.getHeader();

    _.each(CompareCtrl.filteredStat.data.nations, function (obj) {

        var row = null;

        if (CompareCtrl.type == "Nations") {
            row = obj;
            if (dataSelected.indexOf(obj.name) >= 0)
                data.push(CompareCtrl.createBarRow(row));
        }
        else {
            _.each(obj.regions, function (region) {
                if (dataSelected.indexOf(region.name) >= 0) {
                    row = region;
                    row.nation = obj.name;
                    data.push(CompareCtrl.createBarRow(row));
                }
            });

        }
    });
    CompareCtrl.BarData = data;
    CompareCtrl.drawBar();
};

CompareCtrl.createBarRow = function(obj)
{
    //console.log("CALL: createBarRow");

    var newRow = [];
    if(obj["nation"] == null)
        newRow[0] = obj.name;
    else
        newRow[0] = obj.nation + " - " + obj.name;

    var cont = 0;
    _.each(CompareCtrl.filteredStat.data.allTags, function (tag) {
        {
            if(obj.counter[tag] == null)
            {
                newRow.push(0);
                newRow.push("");
            }
            else {
                if(CompareCtrl.$radioByNumber.is(':checked'))
                    newRow.push(obj.counter[tag].count);
                else
                    newRow.push((obj.avg*obj.counter[tag].count)/obj.count);
                cont += obj.counter[tag].count;
                newRow.push("");
            }
        }
    });
    newRow[newRow.length-1] = cont;
    return newRow;
};

CompareCtrl.drawBar = function()
{
    var dataTable = google.visualization.arrayToDataTable(CompareCtrl.BarData);

    var desc = true;

    if(CompareCtrl.$AZbutton.hasClass("active"))
        desc = false;
    if(CompareCtrl.$NameButton.hasClass("active"))
        dataTable.sort([{column: 0, desc: desc}]);
    if(CompareCtrl.$NumButton.hasClass("active"))
        dataTable.sort([{column: CompareCtrl.BarData[0].length - 1, desc: desc}]);

    var chartAreaHeight = dataTable.getNumberOfRows() * 30;
    var chartHeight = chartAreaHeight + 80;
    var heightBar = 70;

    var options = {
        width: "100%",
        height: chartHeight, //dataTable.getNumberOfRows() * 30,
        legend: { position: 'top',  maxLines: 3, textStyle: {fontSize: 13}},
        bar:    { groupWidth: heightBar + "%" },
        annotations: {
            alwaysOutside: true,
            textStyle:  { color: "black"}
        },
        chartArea: {'height': chartAreaHeight, 'right':0, 'left':'300'},
        isStacked: true,
        backgroundColor: 'transparent',
        hAxis: { title: CompareCtrl.$radioByNumber.is(':checked')? "Data by tags": "Percentage of data than the maximum",
            textStyle: { fontSize: 13 }},
        vAxis: { title: CompareCtrl.type, textStyle: { fontSize: 13 }}
    };

    var view = new google.visualization.DataView(dataTable);
    var e = document.getElementById("barChart");
    var chart = new google.visualization.BarChart(e);
    chart.draw(view, options);
};

CompareCtrl.setInitialData = function()
{
    console.log("CALL: setInitialData");

    CompareCtrl.minData = new Date( CompareCtrl.filteredStat.data.minDate );
    CompareCtrl.maxData = new Date( CompareCtrl.filteredStat.data.maxDate );

    CompareCtrl.removeWait();
};

CompareCtrl.getData = function()
{
    console.log("CALL: getData");

    DataCtrl.getField( function(doc){
        CompareCtrl.stat = doc;
        CompareCtrl.filteredStat = doc;
        CompareCtrl.setInitialData();
    }, DataCtrl.FIELD.STAT );
};

CompareCtrl.getHeader = function(type)
{
    console.log("CALL: getHeader");

    var ris = [];
    var cont = 1;

    ris[0] = CompareCtrl.type;
    _.each(CompareCtrl.filteredStat.data.allTags, function (tag) {
        ris[cont] = tag;
        ris[cont+1] = {role: 'annotation', type: 'number'};
        //ris[cont+1] = {type: 'string', role: 'annotation', p: {html: true}};
        cont+=2;
    });

    return ris;
};

CompareCtrl.removeWait = function()
{
    console.log("CALL: removeWait");

    $("#spinner").addClass("hidden");
    CompareCtrl.$container.removeClass("hidden");

    CompareCtrl.initSlider();
    CompareCtrl.setSlider();
    CompareCtrl.enableCombo();
};

CompareCtrl.enableCombo = function()
{
    console.log("CALL: enableCombo");

    if (CompareCtrl.filteredStat.data.nations.length == 0) {
        CompareCtrl.$cmbNations.attr('disabled', true);
        //CompareCtrl.$cmbNations.selectpicker('refresh');
        CompareCtrl.$cmbRegions.multiselect('disable');
        $('#warning').removeClass('hidden');
    }
    else
    {
        CompareCtrl.$filterButton.attr('disabled', false);
        CompareCtrl.initComboNations();
        CompareCtrl.initComboRegions();
        CompareCtrl.$cmbNations.selectpicker('refresh');
        CompareCtrl.$cmbRegions.multiselect('refresh');
    }
};

CompareCtrl.initComboNations = function()
{
    console.log("CALL: initComboNations");

    _.each(CompareCtrl.filteredStat.data.nations, function(obj){
        if(obj.count > 0)
            DomUtil.addOptionValue(CompareCtrl.$cmbNations, obj.name);
    });
};

CompareCtrl.initComboRegions = function()
{
    console.log("CALL: initComboRegions");

    CompareCtrl.$cmbRegions.multiselect();
    var optgroups = CompareCtrl.setComboRegionsData();
    CompareCtrl.$cmbRegions.multiselect( optgroups.length == 0? 'disable' : 'dataprovider', optgroups);
};

CompareCtrl.setComboRegionsData = function()
{
    console.log("CALL: setComboRegionsData");

    var ris = [];
    var cont = 0;
    _.each(CompareCtrl.filteredStat.data.nations, function(obj){
        if(obj.count > 0) {
            var nation = {
                label: obj.name,
                children: []
            };

            _.each(obj.regions, function (region) {
                if (region.count > 0) {
                    var child = {
                        label: region.name,
                        value: cont++
                    };
                    nation.children.push(child);
                }
            });
            ris.push(nation);
        }
    });

    return ris;
};

CompareCtrl.handleClick = function(radio)
{
    console.log("CALL: handleClick");

    if(radio.value == "regions"){
        CompareCtrl.$formNations.addClass('hidden');
        CompareCtrl.$formRegions.removeClass('hidden');
    }
    else{
        CompareCtrl.$formNations.removeClass('hidden');
        CompareCtrl.$formRegions.addClass('hidden');
    }
    CompareCtrl.$filterButton.attr('disabled', false);
};

CompareCtrl.NameButtonClick = function()
{
    console.log("CALL: NameButtonClick");

    CompareCtrl.$NameButton.addClass("active");
    CompareCtrl.$NumButton.removeClass("active");
    CompareCtrl.drawBar();
};

CompareCtrl.NumButtonClick = function()
{
    console.log("CALL: NumButtonClick");

    CompareCtrl.$NumButton.addClass("active");
    CompareCtrl.$NameButton.removeClass("active");
    CompareCtrl.drawBar();
};

CompareCtrl.AZbuttonClick = function()
{
    console.log("CALL: AZbuttonClick");

    CompareCtrl.$AZbutton.addClass("active");
    CompareCtrl.$ZAbutton.removeClass("active");
    CompareCtrl.drawBar();
};

CompareCtrl.ZAbuttonClick = function()
{
    console.log("CALL: ZAbuttonClick");

    CompareCtrl.$ZAbutton.addClass("active");
    CompareCtrl.$AZbutton.removeClass("active");
    CompareCtrl.drawBar();
};

CompareCtrl.buildRadarData = function(dataSelected)
{
    console.log("CALL: buildRadarData");

    var data = [];
    var color = colorUtil.generateColor(dataSelected.length);
    var cont = -1;
    _.each(CompareCtrl.filteredStat.data.nations, function (obj) {

        var row = null;

        if (CompareCtrl.type == "Nations") {
            row = obj;
            if (dataSelected.indexOf(obj.name) >= 0)
                data.push(CompareCtrl.createRadarRow(row, color[cont+=1]));
        }
        else {
            _.each(obj.regions, function (region) {
                if (dataSelected.indexOf(region.name) >= 0) {
                    row = region;
                    row.nation = obj.name;
                    data.push(CompareCtrl.createRadarRow(row, color[cont+=1]));
                }
            });

        }
    });

    CompareCtrl.radarData = data;
    CompareCtrl.drawRadar();
};

CompareCtrl.createRadarRow = function(obj, color)
{
    //console.log("CALL: createRadarRow");

    var radarObj = {};
    var newRow = [];
    var label = "";
    if(obj["nation"] == null)
        label = obj.name;
    else
        label = obj.nation + " - " + obj.name;

    _.each(CompareCtrl.filteredStat.data.allTags, function (tag) {
        {
            if( obj.counter[tag] == null){
                newRow.push(0);
            }
            else {
                newRow.push(obj.counter[tag].count);
            }
        }
    });

    radarObj = {
        label: label,
        fillColor: colorUtil.ColorLuminance(color, 0.2),
        strokeColor: color,
        pointColor: color,
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: color,
        data: newRow
    };

    return radarObj;
};

CompareCtrl.drawRadar = function()
{
    console.log("CALL: drawRadar");

    var labels = CompareCtrl.getLabelsRadar();

    var radarData = {
        labels: labels,
        datasets: CompareCtrl.radarData
    };
    var radarOptions = {
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
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\">" +
                            "<% for (var i=0; i<datasets.length; i++){%>" +
                            "<li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span>" +
                                "<%if(datasets[i].label){%><%=datasets[i].label%><%}%>" +
                            "</li>" +
                            "<%}%>" +
                        "</ul>"
    };
    CompareCtrl.insertLegend(CompareCtrl.radarData);
    var ctx = document.getElementById(CompareCtrl.radarChartID).getContext("2d");
    var radarChart = new Chart(ctx).Radar(radarData, CompareCtrl.radarOptions);
};

/**
 * Dalla prima regione prendo i tag presenti
 * @returns {Array} - ["omofobia", "razzismo", ... ]
 */
CompareCtrl.getLabelsRadar = function()
{
    console.log("CALL: getLabelsRadar");

    var ris = [];
    var tags = CompareCtrl.filteredStat.data.allTags;
    for ( var t = 0; t < tags.length; t++)
        ris.push( tags[t] );
    return ris;
};

CompareCtrl.getDataRadar = function(index)
{
    console.log("CALL: getDataRadar");

    var ris = [];

    var obj = CompareCtrl.regions[index];
    _.each(CompareCtrl.filteredStat.data.allTags, function (tag) {
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

CompareCtrl.handleChartClick = function()
{
    CompareCtrl.$filterButton.attr('disabled', false);
};

CompareCtrl.handleModeClick = function()
{
    CompareCtrl.$filterButton.attr('disabled', false);
};

CompareCtrl.insertLegend = function(data)
{
    var legend = $('<div/>');
    for (var i = 0; i< data.length; i++){

        var $row = $("<div/>");

        var $box = $("<div/>")
            .css("background", data[i].strokeColor)
            .css("width", "15px" )
            .css("height", "15px" )
            .css("float", "left")
            .css("margin-right", "10px" );

        var $label = $("<div/>")
            .text(data[i].label + " ")
            .css("margin-left", "10px" )
            .css("display", "inline-block");

        var $value = $("<div/>")
            .css("display", "inline-block")
            .css("margin-left", "5px" );

        var sum = _.reduce( data[i].data, function(memo, num){
            return memo + num;
            }, 0);
        $value.text( " - " + sum.toString() );

        $row.append($box)
            .append($label)
            .append($value);

        legend.append($row);
    }

    $('#radarLegend').html(legend);
    return legend;
};


ngApp.controller('ngStatCompareCtrl', ['$scope', function($scope) {

    $scope.name = "ngStatCompareCtrl";

    $scope.resize = function()
    {
        setTimeout(function() {
            $(window).trigger('resize');
            if (mapCtrl && mapCtrl.mainMap)
                mapCtrl.mainMap.invalidateSize();
        }, 600);
    };

    //quando clicck sul menu devo disattivare sempre il timer dei dati
    $scope.onItemClick = function() {
        //clearInterval(intervalResize);
    };

    $(document).ready(function () {

        socket = io.connect();

        if(!window.PROJECT || window.PROJECT == "")
        {
            $('#spinner').hide();
            $('#msgProject').show();
            return;
        }

        CompareCtrl.init();
        CompareCtrl.getData();

        $('#cmbRegions').multiselect(
            {
                nonSelectedText: "Select regions",
                enableFiltering: true,
                enableClickableOptGroups: true
            }
        );

        $('.selectpicker').selectpicker();
    });

    $('#slider-bar').on("valuesChanging", function () {
        CompareCtrl.$filterButton.removeAttr("disabled");
    });

    $('.selectpicker').on('change', function(){
        CompareCtrl.$filterButton.removeAttr("disabled");
    });

    $('#cmbRegions').on('change', function(){
        CompareCtrl.$filterButton.removeAttr("disabled");
    });


}]);