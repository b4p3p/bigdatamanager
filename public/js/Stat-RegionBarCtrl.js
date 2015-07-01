"use strict";

var RegionBarCtrl = {};

RegionBarCtrl.datas = null;
RegionBarCtrl.filteredData = null;
RegionBarCtrl.minData = null;
RegionBarCtrl.maxData = null;
RegionBarCtrl.tags = null;
RegionBarCtrl.cmbType = null;
RegionBarCtrl.cmbViewBy = null;
RegionBarCtrl.cmbNations = null;
RegionBarCtrl.cmbRegions = null;
RegionBarCtrl.cmbFilter = null;
RegionBarCtrl.cmbRestore = null;
RegionBarCtrl.container = null;
RegionBarCtrl.$sliderTimer = null;
RegionBarCtrl.contFn = 3;
RegionBarCtrl.formRegions = null;
RegionBarCtrl.formNations = null;
RegionBarCtrl.radioByNumber = null;
RegionBarCtrl.radioByDensity = null;
RegionBarCtrl.nationsProject = null;
RegionBarCtrl.regionsProject = null;

RegionBarCtrl.init = function()
{
    console.log("CALL: init");

    RegionBarCtrl.cmbType = $('#cmbVisualizationMode');
    RegionBarCtrl.cmbViewBy = $("#cmbViewBy");

    RegionBarCtrl.cmbRegions = $('#cmbRegions');
    RegionBarCtrl.cmbNations = $("#cmbNations");

    RegionBarCtrl.container = $('#regionsBar');
    RegionBarCtrl.$sliderTimer = $("#slider-regionsbar");

    RegionBarCtrl.formRegions = $('#formRegions');
    RegionBarCtrl.formNations = $('#formNations');

    RegionBarCtrl.cmbFilter = $('#cmbFilter');
    RegionBarCtrl.cmbRestore = $('#cmbRestore');
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

    var imgFilter = $("#img-filter");
    imgFilter.removeClass("glyphicon glyphicon-filter");
    imgFilter.addClass("fa fa-spinner fa-spin");

    //TODO drowChart

    imgFilter.removeClass("fa fa-spinner fa-spin");
    imgFilter.addClass("glyphicon glyphicon-filter");

    RegionBarCtrl.cmbRestore.removeAttr("disabled");
    RegionBarCtrl.cmbFilter.prop("disabled", true);
};

RegionBarCtrl.clickRestore = function()
{
    console.log("CALL: clickRestore");

    var imgRestore = $("#img-restore");
    imgRestore.removeClass("glyphicon glyphicon-remove");
    imgRestore.addClass("fa fa-spinner fa-spin");

    //TODO deleteChart

    imgRestore.removeClass("fa fa-spinner fa-spin");
    imgRestore.addClass("glyphicon glyphicon-remove");

    RegionBarCtrl.cmbFilter.removeAttr("disabled");
    RegionBarCtrl.cmbRestore.prop("disabled", true);

};

RegionBarCtrl.drawRegionsBar = function()
{
    console.log("CALL: drawRegionsBar");

    return;

    var heightBar = 60;
    var data = [];
    data[0] = this.getHeader();
    data = this.appendRows(data);

    var dataTable = google.visualization.arrayToDataTable(data);

    var options = {
        width: "100%",
        height: dataTable.getNumberOfRows() * heightBar,
        legend: { position: 'top',  maxLines: 3 },
        bar:    { groupWidth: heightBar + "%" },
        annotations: {
            alwaysOutside: true,
            textStyle:  { color: "black" },
            isHtml: true
        },
        chartArea: {'height': '80%', 'right':'0%'},
        isStacked: true,
        backgroundColor: 'transparent'
    };

    var view = new google.visualization.DataView(dataTable);
    var e = document.getElementById("regionsBar");
    var chart = new google.visualization.BarChart(e);
    chart.draw(view, options);
};

//getData:function()
//{
//    this.contFn = 3;
//    this.getDate();
//    this.getRegions();
//    this.getTags();
//},

//getDate:function ()
//{
//    $.ajax({
//        type: "get",
//        crossDomain: true,
//        dataType: "json",
//        url: "/getdata",
//        success: function (data) {
//
//            RegionBarCtrl.datas = data.data;
//            RegionBarCtrl.filteredData = data.data;
//
//            RegionBarCtrl.minData = new Date(data.dateMin);
//            RegionBarCtrl.maxData = new Date(data.dateMax);
//
//            RegionBarCtrl.contFn--;
//
//        },
//        error: function (xhr, status, error) {
//            console.error("ERR: Stat-RegionBarCtrl.getDate " + status + " " + xhr.status);
//            console.error("     Status: " + status + " " + xhr.status);
//            console.error("     Error: " + error);
//        }
//    });
//},

RegionBarCtrl.getData = function()
{
    console.log("CALL: getData");

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/getdata",
        success: function (data) {

            RegionBarCtrl.datas = data.data;
            RegionBarCtrl.filteredData = data.data;

            RegionBarCtrl.minData = new Date(data.dateMin);
            RegionBarCtrl.maxData = new Date(data.dateMax);
            RegionBarCtrl.tags = data.tags;
            RegionBarCtrl.otherTag = data.otherTag;
            RegionBarCtrl.nations = data.nations;

            RegionBarCtrl.nationsProject = data.nations;
            //RegionBarCtrl.tagsProject = data.tags;
            RegionBarCtrl.contFn--;
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.loadData " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

RegionBarCtrl.getRegions = function()
{
    console.log("CALL: getRegions");

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/regions/regions?light=1",
        success: function (data) {

            RegionBarCtrl.regionsProject = data;

            RegionBarCtrl.contFn--;
            if (RegionBarCtrl.contFn == 0)
                RegionBarCtrl.removeWait();
            //    RegionBarCtrl.drawRegionsBar();
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

RegionBarCtrl.getTags = function()
{
    console.log("CALL: getTags");

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/gettags",
        success: function (data) {

            RegionBarCtrl.tags = data;
            RegionBarCtrl.contFn--;

            if (RegionBarCtrl.contFn == 0)
                RegionBarCtrl.drawRegionsBar();
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.loadTags " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

RegionBarCtrl.getHeader = function()
{
    console.log("CALL: getHeader");

    var ris = [];
    var cont = 1;

    ris[0] = "Region";
    for(var t in this.tags)
    {
        ris[cont] = this.tags[t];
        ris[cont+1] = {role: 'annotation'};
        //ris[cont+1] = {type: 'string', role: 'annotation', p: {html: true}};
        cont+=2;
    }

    return ris;
};

RegionBarCtrl.appendRows = function(data)
{
    console.log("CALL: appendRows");

    //tipo di visualizzazione
    var id = RegionBarCtrl.getSelectedID();

    //indice delle regioni (data[0] contiene l'header)
    var i_r = 1;

    for(var i = 0; i < RegionBarCtrl.regionsProject.length;i++)
    {
        var feature = RegionBarCtrl.regionsProject[i];

        var i_t = 1;    //indice dei tag
        var row = [];

        row[0] = feature.properties.NAME_1;

        var totTweets = feature.properties.sum;

        //inserisco i valori delle righe
        for(var tag in feature.properties.counter) {
            row[i_t] = this.getSelelectedValue(id, feature, tag);
            row[i_t+1] = "";
            i_t+=2;
        }

        //solo nell'ultima posizione inserisco il totale
        for(var j = row.length - 2; j > 0; j-=2)
        {
            if ( row[j] > 0 )
            {
                row[j+1] = RegionBarCtrl.getSelectedCount(id, feature);
                break;
            }
        }
        if ( totTweets == 0 ) row[2] = "0";

        data[i_r] = row;
        i_r ++;
    }
    //data[1] = ['Puglia',      5, "", 5, "", 5, "", 10, ""];
    //data[2] = ['Pippo',      5, "", 5, "", 5, "", 2, "17"];
    //data[3] = ['Franco',      5, "", 5, "", 5, "", 10, ""];
    return data;
};

RegionBarCtrl.getSelectedID = function()
{
    console.log("CALL: getSelectedID");
    //var name = this.cmbType[0].id;
    //return parseInt( $( "#" + name + ' option:selected')[0].value );
    return 0;
};

RegionBarCtrl.getSelelectedValue = function(id, feature, tag)
{
    console.log("CALL: getSelelectedValue");

    switch (id)
    {
        case 0:     //number tweet
            return feature.properties.counter[tag];
        case 1:     //index
            //var tweets = feature.properties.counter[tag];
            //var population = feature.properties.population;
            //var ris = parseFloat((tweets / population).toFixed(7));
            return feature.properties.counter[tag];
    }

    alert("ooooops...");
};

RegionBarCtrl.getSelectedCount = function(id, feature)
{
    console.log("CALL: getSelectedCount");

    switch (id)
    {
        case 0:     //number tweet
            return feature.properties.sum;
        case 1:     //index
            return feature.properties.avg.toFixed(2);
    }

    alert("ooooops...");
};

RegionBarCtrl.removeWait = function ()
{
    console.log("CALL: removeWait");

    $("#spinner").addClass("hidden");
    $("#container").removeClass("hidden");

    //solo dopo che ho reso visibile lo slider posso inizializzarlo
    RegionBarCtrl.initSlider();
    RegionBarCtrl.setSlider();
    RegionBarCtrl.enableButtons();
};

//setComboRegionsData: function()
//{
//    DomUtil.clearMultiselect(RegionBarCtrl.cmbRegions);
//
//    var ris = {};
//    var regions = RegionBarCtrl.regionsProject;
//    for( var i = 0; i < regions.length; i++) {
//        if (!ris[regions[i].properties.NAME_0])
//        {
//            ris[regions[i].properties.NAME_0] = [];
//        }
//
//        ris[regions[i].properties.NAME_0].push(regions[i].properties.NAME_1);
//    }
//
//    for( var k in ris )
//        DomUtil.addOptionGroup(RegionBarCtrl.cmbRegions, k, ris[k]);
//},

RegionBarCtrl.enableButtons = function()
{
    console.log("CALL: enableButtons");

    if (RegionBarCtrl.nations.length == 0) {
        RegionBarCtrl.cmbNations.attr('disabled', true);
        $('.selectpicker').selectpicker('refresh');

        RegionBarCtrl.cmbRegions.multiselect('disable');
        $('#warning').removeClass('hidden');
    }
    else
    {
        RegionBarCtrl.initComboNations();
        RegionBarCtrl.initComboRegions();
        RegionBarCtrl.cmbFilter.removeAttr("disabled");
    }
};

RegionBarCtrl.initComboNations = function()
{
    console.log("CALL: initComboNations");

    for (var i = 0; i < RegionBarCtrl.nations.length; i++)
        DomUtil.addOptionValue(RegionBarCtrl.cmbNations, RegionBarCtrl.nations[i]);
    $('.selectpicker').selectpicker('refresh');
};

RegionBarCtrl.initComboRegions = function()
{
    console.log("CALL: initComboRegions");

    RegionBarCtrl.cmbRegions.multiselect();
    var optgroups = RegionBarCtrl.setComboRegionsData();
    RegionBarCtrl.cmbRegions.multiselect( optgroups.length == 0? 'disable' : 'dataprovider', optgroups);
};

RegionBarCtrl.setComboRegionsData = function()
{
    console.log("CALL: setComboRegionsData");

    var ris = [];

    for( var i = 0; i < RegionBarCtrl.nationsProject.length; i++)
    {
        var nation = {
            label: RegionBarCtrl.nationsProject[i],
            children: []
        };
        ris.push(nation);
    }
    var regions = RegionBarCtrl.regionsProject;

    for( i = 0; i < regions.length; i++) {
        for (var nation = 0; nation < ris.length; nation++)
            if (regions[i].properties.NAME_0 == ris[nation].label) {
                var child = {
                    label: regions[i].properties.NAME_1,
                    //value: i
                };
                ris[nation].children.push(child);
            }
    }
    return ris;
};

RegionBarCtrl.handleClick = function (radio)
{
    console.log("CALL: handleClick");

    if(radio.value == "regions"){
        RegionBarCtrl.formNations.addClass('hidden');
        RegionBarCtrl.formRegions.removeClass('hidden');
    }
    else{
        RegionBarCtrl.formNations.removeClass('hidden');
        RegionBarCtrl.formRegions.addClass('hidden');
    }
};



