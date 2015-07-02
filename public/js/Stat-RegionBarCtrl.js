"use strict";

function RegionBarCtrl() {};

//RegionBarCtrl.datas = null;
//RegionBarCtrl.filteredData = null;
//RegionBarCtrl.minData = null;

RegionBarCtrl.selectedRegions = null;
RegionBarCtrl.selectedNations = null;

RegionBarCtrl.stat = null;

RegionBarCtrl.$radioNations = null;
RegionBarCtrl.$radioRegions = null;
RegionBarCtrl.$cmbNations = null;
RegionBarCtrl.$cmbRegions = null;
RegionBarCtrl.$filterButton = null;
RegionBarCtrl.$restoreButton = null;
RegionBarCtrl.$container = null;
RegionBarCtrl.$barChart = null;
RegionBarCtrl.$sliderTimer = null;

RegionBarCtrl.$formRegions = null;
RegionBarCtrl.$formNations = null;
RegionBarCtrl.$radioByNumber = null;
RegionBarCtrl.$radioByDensity = null;

RegionBarCtrl.init = function()
{
    console.log("CALL: init");

    RegionBarCtrl.$radioByNumber = $('#radioByNumber');
    RegionBarCtrl.$radioByDensity = $('#radioByDensity');

    RegionBarCtrl.$formRegions = $('#formRegions');
    RegionBarCtrl.$formNations = $('#formNations');

    RegionBarCtrl.$radioNations = $('#radioNations');
    RegionBarCtrl.$radioRegions = $('#radioRegions');

    RegionBarCtrl.$cmbRegions = $('#cmbRegions');
    RegionBarCtrl.$cmbNations = $("#cmbNations");

    RegionBarCtrl.$container = $('#container');
    RegionBarCtrl.$barChart = $('#barChart');
    RegionBarCtrl.$sliderTimer = $("#slider-bar");

    RegionBarCtrl.$filterButton = $('#cmbFilter');
    RegionBarCtrl.$restoreButton = $('#cmbRestore');
};

RegionBarCtrl.initSlider = function()
{
    console.log("CALL: initSlider");

    RegionBarCtrl.$sliderTimer.dateRangeSlider(
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

RegionBarCtrl.setSlider = function()
{
    console.log("CALL: setSlider");

    if( RegionBarCtrl.minData != null && RegionBarCtrl.maxData != null  )
    {
        RegionBarCtrl.$sliderTimer.dateRangeSlider(
            {
                enabled : true,
                bounds:{
                    min: new Date( RegionBarCtrl.minData ),
                    max: new Date( RegionBarCtrl.maxData )
                }
            }
        );
    }
    else
        RegionBarCtrl.$sliderTimer.dateRangeSlider({
            enabled: false
        });
};

RegionBarCtrl.clickFilter = function()
{
    console.log("CALL: clickFilter");

    var $imgFilter = $("#img-filter");
    $imgFilter.removeClass("glyphicon glyphicon-filter");
    $imgFilter.addClass("fa fa-spinner fa-spin");

    if(RegionBarCtrl.$radioRegions.is(':checked'))
    {
        RegionBarCtrl.selectedRegions = DomUtil.getSelectedCombo(RegionBarCtrl.$cmbRegions);
        if(RegionBarCtrl.selectedRegions.length == 0)
        {
            DomUtil.selectAll(RegionBarCtrl.$cmbRegions);
            RegionBarCtrl.$cmbRegions.multiselect('refresh');
            RegionBarCtrl.selectedRegions = DomUtil.getSelectedCombo(RegionBarCtrl.$cmbRegions);
        }
        RegionBarCtrl.drawRegionsBar(RegionBarCtrl.selectedRegions, "Region");
    }
    else
    {
        RegionBarCtrl.selectedNations = DomUtil.getSelectedCombo(RegionBarCtrl.$cmbNations);
        if(RegionBarCtrl.selectedNations.length == 0)
        {
            DomUtil.selectAll(RegionBarCtrl.$cmbNations);
            RegionBarCtrl.$cmbNations.selectpicker('refresh');
            RegionBarCtrl.selectedNations = DomUtil.getSelectedCombo(RegionBarCtrl.$cmbNations);
        }
        RegionBarCtrl.drawRegionsBar(RegionBarCtrl.selectedNations, "Nation");
    }

    $imgFilter.removeClass("fa fa-spinner fa-spin");
    $imgFilter.addClass("glyphicon glyphicon-filter");

    RegionBarCtrl.$restoreButton.removeAttr("disabled");
    RegionBarCtrl.$filterButton.prop("disabled", true);
};

RegionBarCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");

    var $imgRestore = $("#img-restore");
    $imgRestore.removeClass("glyphicon glyphicon-remove");
    $imgRestore.addClass("fa fa-spinner fa-spin");

    //TODO deleteChart

    $imgRestore.removeClass("fa fa-spinner fa-spin");
    $imgRestore.addClass("glyphicon glyphicon-remove");

    RegionBarCtrl.$filterButton.removeAttr("disabled");
    RegionBarCtrl.$restoreButton.prop("disabled", true);
};

/**
 *
 * @param obj
 * @returns {Array} - eg. ['obj.name', 0, "", 5, "", 0, "", 10, ""];
 */
RegionBarCtrl.createRow = function(obj)
{
    var newRow = [];
    if(obj["nation"] == null)
        newRow[0] = obj.name;
    else
        newRow[0] = obj.nation + " - " + obj.name;

    _.each(RegionBarCtrl.stat.data.allTags, function (tag) {
        {
            var index = obj.counter.indexOfObject("tag", tag);
            if (index == -1) {
                newRow.push(0);
                newRow.push("");
            }
            else {
                newRow.push(obj.counter[index].count);
                newRow.push("");
            }
        }
    });
    return newRow;

};

RegionBarCtrl.drawRegionsBar = function(dataSelected, type)
{
    console.log("CALL: drawRegionsBar");

    var heightBar = 60;
    var data = [];
    var i_r = 1;    //indice riga

    data[0] = RegionBarCtrl.getHeader(type);


    _.each(RegionBarCtrl.stat.data.nations, function(obj) {

        var row = null;

        if (type == "Nation") {
            row = obj;
            if (dataSelected.indexOf(obj.name) >= 0)
                data.push(RegionBarCtrl.createRow(row));
        }
        else
        {
            _.each(obj.regions, function (region) {
                if (dataSelected.indexOf(region.name) >= 0) {
                    row = region;
                    row.nation = obj.name;
                    data.push(RegionBarCtrl.createRow(row));
                }
            });

        }
    });


    var dataTable = google.visualization.arrayToDataTable(data);

    var chartAreaHeight = dataTable.getNumberOfRows() * 30;
    var chartHeight = chartAreaHeight + 80;

    var options = {
        width: "100%",
        height: chartHeight, //dataTable.getNumberOfRows() * 30,
        legend: { position: 'top',  maxLines: 3, textStyle: {fontSize: 13}},
        bar:    { groupWidth: heightBar + "%" },
        annotations: {
            alwaysOutside: true,
            textStyle:  { color: "black" },
            isHtml: true
        },
        chartArea: {'height': chartAreaHeight, 'right':0},
        isStacked: true,
        backgroundColor: 'transparent',
        hAxis: { textStyle: { fontSize: 13 }},
        vAxis: { textStyle: { fontSize: 13 }}
    };

    var view = new google.visualization.DataView(dataTable);
    var e = document.getElementById("barChart");
    var chart = new google.visualization.BarChart(e);
    chart.draw(view, options);
};

RegionBarCtrl.setInitialData = function()
{
    console.log("CALL: setInitialData");

    RegionBarCtrl.minData = new Date( RegionBarCtrl.stat.data.minDate );
    RegionBarCtrl.maxData = new Date( RegionBarCtrl.stat.data.maxDate );

    RegionBarCtrl.removeWait();
};

RegionBarCtrl.getData = function()
{
    console.log("CALL: getData");

    DataCtrl.getField( function(doc){
        RegionBarCtrl.stat = doc;
        RegionBarCtrl.setInitialData();
    }, DataCtrl.FIELD.STAT );
};

RegionBarCtrl.getHeader = function(type)
{
    console.log("CALL: getHeader");

    var ris = [];
    var cont = 1;

    ris[0] = type;
    _.each(RegionBarCtrl.stat.data.allTags, function (tag) {
        ris[cont] = tag;
        ris[cont+1] = {role: 'annotation'};
        //ris[cont+1] = {type: 'string', role: 'annotation', p: {html: true}};
        cont+=2;
    });

    return ris;
};

RegionBarCtrl.getSelectedID = function()
{
    console.log("CALL: getSelectedID");

    if(RegionBarCtrl.$radioByNumber.is(':checked'))
        return 0;
    else
        return 1;
};

RegionBarCtrl.removeWait = function ()
{
    console.log("CALL: removeWait");

    $("#spinner").addClass("hidden");
    RegionBarCtrl.$container.removeClass("hidden");

    //solo dopo che ho reso visibile lo slider posso inizializzarlo
    RegionBarCtrl.initSlider();
    RegionBarCtrl.setSlider();
    RegionBarCtrl.enableCombo();
};

RegionBarCtrl.enableCombo = function()
{
    console.log("CALL: enableCombo");

    if (RegionBarCtrl.stat.data.nations.length == 0) {
        RegionBarCtrl.$cmbNations.attr('disabled', true);
        //RegionBarCtrl.$cmbNations.selectpicker('refresh');
        RegionBarCtrl.$cmbRegions.multiselect('disable');
        $('#warning').removeClass('hidden');
    }
    else
    {
        RegionBarCtrl.$filterButton.attr('disabled', false);
        RegionBarCtrl.initComboNations();
        RegionBarCtrl.initComboRegions();
        RegionBarCtrl.$cmbNations.selectpicker('refresh');
        RegionBarCtrl.$cmbRegions.multiselect('refresh');
    }
};

RegionBarCtrl.initComboNations = function()
{
    console.log("CALL: initComboNations");

    _.each(RegionBarCtrl.stat.data.nations, function(obj){
        if(obj.count > 0)
            DomUtil.addOptionValue(RegionBarCtrl.$cmbNations, obj.name);
    });
};

RegionBarCtrl.initComboRegions = function()
{
    console.log("CALL: initComboRegions");

    RegionBarCtrl.$cmbRegions.multiselect();
    var optgroups = RegionBarCtrl.setComboRegionsData();
    RegionBarCtrl.$cmbRegions.multiselect( optgroups.length == 0? 'disable' : 'dataprovider', optgroups);
};

RegionBarCtrl.setComboRegionsData = function()
{
    console.log("CALL: setComboRegionsData");

    var ris = [];
    var cont = 0;
    _.each(RegionBarCtrl.stat.data.nations, function(obj){
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

RegionBarCtrl.handleClick = function (radio)
{
    console.log("CALL: handleClick");

    if(radio.value == "regions"){
        RegionBarCtrl.$formNations.addClass('hidden');
        RegionBarCtrl.$formRegions.removeClass('hidden');
    }
    else{
        RegionBarCtrl.$formNations.removeClass('hidden');
        RegionBarCtrl.$formRegions.addClass('hidden');
    }
    RegionBarCtrl.$filterButton.attr('disabled', false);
};



