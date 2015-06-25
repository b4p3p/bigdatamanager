"use strict";

function ShowmapCtrl() {};

var cfg =
{
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    "radius": 100,
    "maxOpacity": 0.6,
    // scales the radius based on map zoom
    "scaleRadius": false,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    "useLocalExtrema": false,
    // which field name in your data represents the latitude - default "lat"
    latField: 'latitude',
    // which field name in your data represents the longitude - default "lng"
    lngField: 'longitude',
    // which field name in your data represents the data value - default "value"
    valueField: 'count'
};

ShowmapCtrl.mainMap = null;
ShowmapCtrl.mapContainer = '';
ShowmapCtrl.datas = null;
ShowmapCtrl.regions = null;
ShowmapCtrl.filteredData = null;

//layer
ShowmapCtrl.layerHeatmap = null;
ShowmapCtrl.layerMakerCluster = null;
ShowmapCtrl.layerBoundaries = null;
ShowmapCtrl.tagsLegend = null;

//controls
ShowmapCtrl.legendControl = null;
ShowmapCtrl.sliderTimer = null;
ShowmapCtrl.cmbSelectTags = null;
ShowmapCtrl.cmbSelectNations = null;
ShowmapCtrl.cmbSelectUsers = null;
ShowmapCtrl.cmbSelectTerms = null;
ShowmapCtrl.chkMarkercluster = null;
ShowmapCtrl.chkHeatmap = null;
ShowmapCtrl.chkBoudaries = null;
ShowmapCtrl.activeLayerBoundaries = null;
ShowmapCtrl.showInfoActiveLayer = false;

//data variable
ShowmapCtrl.nationsProject = null;
ShowmapCtrl.tagsProject = null;
ShowmapCtrl.minData = new Date();
ShowmapCtrl.maxData = new Date();
ShowmapCtrl.tags = null;
ShowmapCtrl.otherTag = null;
ShowmapCtrl.nations = null;

ShowmapCtrl.sliderTimer = $("#slider");

ShowmapCtrl.isDatasReady = function()
{
    return this.datas != null;
};

ShowmapCtrl.initMap = function(mapContainer)
{
    ShowmapCtrl.mapContainer = mapContainer;

    createMap();
    resizeMap();

    $(window).on("resize", function(){
        resizeMap();
    });

    $(document).ready(function() {
        ShowmapCtrl.mainMap.invalidateSize();
    });

};

function createMap()
{
    var lat = 42.22;
    var long = 12.986;

    // set up the map
    ShowmapCtrl.mainMap = new L.Map( ShowmapCtrl.mapContainer);

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    var osm = new L.TileLayer( osmUrl, {
        minZoom: 2,
        maxZoom: 13,
        attribution: osmAttrib
    });

    // start the map in Italy
    ShowmapCtrl.mainMap.setView( new L.LatLng(lat, long), 6 );
    ShowmapCtrl.mainMap.addLayer(osm);
};

function resizeMap()
{
    var deltaHeight = 200;
    //var deltaWidth = -100;

    var map = $('#' + ShowmapCtrl.mapContainer);
    //var width = $(window).width();
    var height = $(window).height();

    map.css("height", $(window).height() - deltaHeight);
    map.css("margin-top",50);
}

ShowmapCtrl.initGui = function()
{
    ShowmapCtrl.cmbSelectTags = $('#cmbTags');
    ShowmapCtrl.cmbSelectNations = $('#cmbNations');
    ShowmapCtrl.cmbSelectUsers = $('#cmbUsers');
    ShowmapCtrl.cmbSelectTerms = $('#cmbTerms');

    ShowmapCtrl.chkMarkercluster = $('#chk_markerCluster')[0];
    ShowmapCtrl.chkHeatmap = $('#chk_heatmap')[0];
    ShowmapCtrl.chkBoudaries = $('#chk_boundaries')[0];

    ShowmapCtrl.sliderTimer = $("#slider");
    ShowmapCtrl.sliderTimer.dateRangeSlider(
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
        }
    );
};

ShowmapCtrl.getData = function ()
{
    console.log("CALL: getData");

    var imgRestore = $("#img-restore");
    var cmdRestore = $("#cmdRestore");
    if(!cmdRestore.is(':disabled')) {
        cmdRestore.prop("disabled", true);
        imgRestore.removeClass("glyphicon glyphicon-remove");
        imgRestore.addClass("fa fa-spinner fa-spin");
    }

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/getdata",
        success: function (data) {

            ShowmapCtrl.datas = data.data;
            ShowmapCtrl.filteredData = data.data;

            ShowmapCtrl.minData = new Date(data.dateMin);
            ShowmapCtrl.maxData = new Date(data.dateMax);
            ShowmapCtrl.tags = data.tags;
            ShowmapCtrl.otherTag = data.otherTag;
            ShowmapCtrl.nations = data.nations;

            ShowmapCtrl.nationsProject = data.nations;
            ShowmapCtrl.tagsProject = data.tags;

            ShowmapCtrl.getRegions();

            $(".spinner-datas").hide();

            $('#chk_markerCluster').removeAttr("disabled");
            $('#chk_heatmap').removeAttr("disabled");

            $("#count-container").removeClass("hidden");
            $("#count").text(data.data.length);
            if(imgRestore.hasClass('fa fa-spinner fa-spin')) {
                imgRestore.removeClass("fa fa-spinner fa-spin");
                imgRestore.addClass("glyphicon glyphicon-remove");
                DomUtil.clearSelectpicker(ShowmapCtrl.cmbSelectTags);
                DomUtil.clearSelectpicker(ShowmapCtrl.cmbSelectNations);
                DomUtil.clearSelectpicker(ShowmapCtrl.cmbSelectUsers);
                DomUtil.clearSelectpicker(ShowmapCtrl.cmbSelectTerms);
                refreshData();
            }
            ShowmapCtrl.loadData();
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.loadData " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

ShowmapCtrl.loadData = function()
{
    console.log("CALL: loadData");
    ShowmapCtrl.sliderTimer.dateRangeSlider(
        {
            enabled : true ,
            bounds:{
                min: new Date( ShowmapCtrl.minData ),
                max: new Date( ShowmapCtrl.maxData )
            }
        });

    ShowmapCtrl.sliderTimer.dateRangeSlider("min", ShowmapCtrl.minData);
    ShowmapCtrl.sliderTimer.dateRangeSlider("max", ShowmapCtrl.maxData);

    ShowmapCtrl.cmbSelectTags.attr("title", "Select Tags");
    ShowmapCtrl.cmbSelectNations.attr("title", "Select Nations");
    ShowmapCtrl.cmbSelectUsers.attr("title", "Select Users");
    ShowmapCtrl.cmbSelectTerms.attr("title", "Select Terms");

    if(ShowmapCtrl.otherTag)
    {
        addOptionValue(ShowmapCtrl.cmbSelectTags, "Other", true);
    }
    ShowmapCtrl.tags.forEach(function(tag) {
        addOptionValue(ShowmapCtrl.cmbSelectTags, tag);
    });

    ShowmapCtrl.nations.forEach(function(nation) {
        addOptionValue(ShowmapCtrl.cmbSelectNations, nation);
    });

    $('.selectpicker').selectpicker('refresh');
};

ShowmapCtrl.cmdFilter_click = function()
{
    console.log("CALL: cmdFilter_click");

    var cmdFilter = $("#cmdFilter");
    cmdFilter.prop("disabled", true);

    var imgFilter = $("#img-filter");
    imgFilter.removeClass("glyphicon glyphicon-filter");
    imgFilter.addClass("fa fa-spinner fa-spin");

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: ShowmapCtrl.createUrl(),
        success: function (data) {
            ShowmapCtrl.filteredData = data.data;
            ShowmapCtrl.nations = data.nations;
            ShowmapCtrl.tags = data.tags;

            $("#count").text(data.data.length);

            ShowmapCtrl.nations = getSelectedCombo(ShowmapCtrl.cmbSelectNations);
            ShowmapCtrl.getRegions();
            refreshData();
            //disableOption();

            var cmdRestore = $("#cmdRestore");
            cmdRestore.removeAttr("disabled");

        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.cmdFilter_click " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

//function disableOption()
//{
//    var tags = getSelectedCombo(ShowmapCtrl.cmbSelectTags);
//    if( tags.length > 0 ) {
//        var nationsToDeselect = _.difference(ShowmapCtrl.nationsProject, ShowmapCtrl.nations);
//        for (var i = 0; i < nationsToDeselect.length; i += 1) {
//            var optionNation = ShowmapCtrl.cmbSelectNations.find('option[value="' + nationsToDeselect[i] + '"]');
//            $(optionNation).attr("disabled", "disabled");
//        }
//    }
//
//    var nations = getSelectedCombo(ShowmapCtrl.cmbSelectNations);
//    if( nations.length > 0 ) {
//        var tagsToDeselect = _.difference(ShowmapCtrl.tagsProject, ShowmapCtrl.tags);
//        for (i = 0; i < tagsToDeselect.length; i += 1) {
//            var optionTag = ShowmapCtrl.cmbSelectTags.find('option[value="' + tagsToDeselect[i] + '"]');
//            $(optionTag).attr("disabled", "disabled");
//        }
//    }
//    //var value = $('#cmbNations').find('option');
//
//    ShowmapCtrl.cmbSelectNations.selectpicker('refresh');
//    ShowmapCtrl.cmbSelectTags.selectpicker('refresh');
//};


ShowmapCtrl.createUrl = function()
{
    var url = "/getdata";
    var conditions = [];
    var selectedNations = getSelectedCombo(ShowmapCtrl.cmbSelectNations);
    var selectedTags = getSelectedCombo(ShowmapCtrl.cmbSelectTags);
    var values = ShowmapCtrl.sliderTimer.dateRangeSlider("values");

    console.log("CONDIZIONI: ");
    console.log(" Nazioni: " + selectedNations);
    console.log(" Tags: " + selectedTags);
    console.log(" Min data: " + values.min);
    console.log(" Max data: " + values.max);

    if(selectedNations.length > 0)
        conditions.push("nations=" + selectedNations.join(","));

    if(selectedTags.length > 0)
        conditions.push("tags=" + selectedTags.join(","));

    conditions.push("min=" + values.min.yyyymmdd());
    conditions.push("max=" + values.max.yyyymmdd());

    if( conditions != [] )
        url += "?" + conditions.join("&");
    console.log("CALL: cmdFilter_click - url: " + url);
    return url;
};

ShowmapCtrl.getRegions = function()
{
    console.log("CALL: getRegions");

    var imgFilter = $("#img-filter");
    var cmdFilter = $("#cmdFilter");

    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/regions/regions?nations=" + ShowmapCtrl.nations.join(",") + "&tags=" + ShowmapCtrl.tags.join(","),
        success: function (data) {
            ShowmapCtrl.regions = data;
            ShowmapCtrl.tags = data.tags;
            refreshBoundaries();
            $(".spinner-regions").hide();
            $('#chk_boundaries').removeAttr("disabled");

            cmdFilter.removeAttr('disabled');

            imgFilter.removeClass("fa fa-spinner fa-spin");
            imgFilter.addClass("glyphicon glyphicon-filter");
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

ShowmapCtrl.heatmap_click = function()
{
    if ( $("#chk_heatmap")[0].checked )
        showHeatmap();
    else
        hideHeatmap();
};

ShowmapCtrl.markerCluster_click = function()
{
    if ( $("#chk_markerCluster")[0].checked )
        showMarkerCluster();
    else
        hideMarkerCluster();
};

ShowmapCtrl.showBoundaries_click = function()
{
    if ( $("#chk_boundaries")[0].checked )
        showBoundaries();
    else
        hideBoundaries();
};

var showHeatmap = function ()
{
    console.log("CALL: showHeatmap");

    //visualizzo lo spinner di attesa
    var spinnerHeatmap = $("#spinner-heatmap");
    spinnerHeatmap.removeClass("fa fa-spinner fa-spin spinner-datas");
    spinnerHeatmap.addClass("fa fa-refresh fa-spin");
    spinnerHeatmap.show();

    if ( !ShowmapCtrl.isDatasReady() ) return;

    if (ShowmapCtrl.layerHeatmap == null)
    {
        ShowmapCtrl.layerHeatmap = new HeatmapOverlay(cfg);
        ShowmapCtrl.mainMap.addLayer( ShowmapCtrl.layerHeatmap );
    }
    setData_Heatmap();

    //rimuovo lo spinner di attesa
    spinnerHeatmap.removeClass("fa fa-refresh fa-spin");
    spinnerHeatmap.addClass("fa fa-spinner fa-spin spinner-datas");
    spinnerHeatmap.hide();
};

function showMarkerCluster()
{
    console.log("CALL: showMarkerCluster");

    //visualizzo lo spinner di attesa
    var spinnerCluster = $("#spinner-cluster");
    spinnerCluster.removeClass("fa fa-spinner fa-spin spinner-datas");
    spinnerCluster.addClass("fa fa-refresh fa-spin");
    spinnerCluster.show();

    setTimeout(_showMarkerCluster, 10);
};

function _showMarkerCluster()
{
    console.log("CALL: _showMarkerCluster");

    if ( ShowmapCtrl.layerMakerCluster == null )
        ShowmapCtrl.layerMakerCluster = new L.MarkerClusterGroup();

    ShowmapCtrl.mainMap.addLayer( ShowmapCtrl.layerMakerCluster );
    setData_MarkerCluster();

    //rimuovo lo spinner di attesa
    var spinnerCluster = $("#spinner-cluster");
    spinnerCluster.removeClass("fa fa-refresh fa-spin");
    spinnerCluster.addClass("fa fa-spinner fa-spin spinner-datas");
    spinnerCluster.hide();
};

function showBoundaries()
{
    console.log("CALL: showBoundaries");

    //visualizzo lo spinner di attesa
    var spinnerBoundaries = $("#spinner-boundaries");
    spinnerBoundaries.removeClass("fa fa-spinner fa-spin spinner-regions");
    spinnerBoundaries.addClass("fa fa-refresh fa-spin");
    spinnerBoundaries.show();

    insertLegend();

    if (ShowmapCtrl.layerBoundaries != null)
        hideBoundaries();
    ShowmapCtrl.layerBoundaries = L.geoJson(
        ShowmapCtrl.regions,
        {
            style: _style,
            onEachFeature: _onEachFeature
        }
    );

    ShowmapCtrl.layerBoundaries.addTo( ShowmapCtrl.mainMap );
    ShowmapCtrl.layerBoundaries.bringToFront();

    //rimuovo lo spinner di attesa
    spinnerBoundaries.removeClass("fa fa-refresh fa-spin");
    spinnerBoundaries.addClass("fa fa-spinner fa-spin spinner-regions");
    spinnerBoundaries.hide();
};

function insertLegend()
{
    console.log("CALL: insertLegend");

    if ( ShowmapCtrl.legendControl === null)
    {
        ShowmapCtrl.legendControl = L.control({position: 'bottomleft'});

        ShowmapCtrl.legendControl.onAdd = function (map)
        {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
                labels = [],
                from, to;
            labels.push('<label style="margin: 0px; margin-bottom: 10px; text-align: center"><b>Percentage of<br>total points</b></label>');
            for (var i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];

                labels.push(
                    '<i style="background:' + _getColor(from + 0.01) + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
            }
            div.innerHTML = labels.join('<br>');
            return div;
        };
    }
    ShowmapCtrl.legendControl.addTo(ShowmapCtrl.mainMap);
};


function _style(feature)
{
    return{
        fillColor: _getColor( feature.properties.avg ),
        fillOpacity: 0.5,
        weight: 2,
        opacity: 0.5,
        color: 'white',
        dashArray: '3'
    };
}

function _getColor(percentage)
{
    return percentage > 0.8 ? '#800026' :
        percentage > 0.7 ? '#BD0026' :
            percentage > 0.6 ? '#E31A1C' :
                percentage > 0.5 ? '#FC4E2A' :
                    percentage > 0.4 ? '#FD8D3C' :
                        percentage > 0.3 ? '#FEB24C' :
                            percentage > 0.2 ? '#FED976' :
                                '#FFEDA0';
}

function _onEachFeature(feature, layer)
{
    layer.on
    (
        {
            mouseover: _mouseover_feature,
            mouseout: _mouseout_feature,
            click: _click_feature
        }
    );
}

function _mouseover_feature(e)
{
    var layer = e.target;
    ShowmapCtrl.mainMap.dragging.disable();

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

function _mouseout_feature(e)
{
    if ( ShowmapCtrl.activeLayerBoundaries != null &&
        ShowmapCtrl.showInfoActiveLayer ) return;

    ShowmapCtrl.mainMap.dragging.enable();
    ShowmapCtrl.layerBoundaries.resetStyle(e.target);
}

function  _click_feature(e)
{
    console.log("Click!");

    // lock map
    ShowmapCtrl.activeLayerBoundaries = e.target;

    // chiudo altri popup aperti
    if ( ShowmapCtrl.showInfoActiveLayer ) {
        console.log("showInfoActiveLayer NULL!");
        ShowmapCtrl.mainMap.closePopup();
        return;
    }

    var tot_tweet = e.target.feature.properties.sum;
    var counter = e.target.feature.properties.counter;

    var pop = '<div class="popup">' +
                '<h3 class="title-popup" style="min-width: 100px">' +
                    e.target.feature.properties.NAME_1 +
                '</h3>';

    for(var k in counter)
    {
        var tag = k.charAt(0).toUpperCase() + k.slice(1) + ': ';
        pop = pop +
            '<div class="row-popup">' +
             '<div class="label-popup-left">' + tag + '</div>' +
             '<div class="label-popup-right">' + counter[k] + '</div>' +
            '</div>';
    }

    pop += "<hr class='separator'>";

    pop +=
        '<div class="row-popup">' +
            '<div class="label-popup-left">Tot:</div>' +
            '<div class="label-popup-right">' + tot_tweet + '</div>' +
        '</div>';

    console.log("Popup " + e.target.feature.properties.NAME_1);
    e.target.bindPopup(pop).openPopup();

    //ShowmapCtrl.mainMap.fitBounds(e.target.getBounds());
}

var hideHeatmap = function()
{
    console.log("CALL: hideHeatmap");

    ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerHeatmap );
    if ( ShowmapCtrl.mainMap.tagsLegend != null )
        ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.mainMap.tagsLegend );
};

var hideMarkerCluster = function()
{
    console.log("CALL: hideMarkerCluster");

    ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerMakerCluster );
    if ( ShowmapCtrl.tagsLegend != null )
        ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.tagsLegend );
};

var hideBoundaries = function()
{
    console.log("CALL: hideBoundaries");

    if ( ShowmapCtrl.layerBoundaries != null)
    {
        ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerBoundaries );
        ShowmapCtrl.layerBoundaries = null;
        if( ShowmapCtrl.legendControl )
            ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.legendControl );
    }
};

function getSelectedCombo( combo )
{
    var tags = [];
    var options = combo.find(":selected");

    for ( var i = 0; i < options.length; i++)
        tags.push ( options[i].text );

    return tags;
}

function setData_Heatmap()
{
    console.log("CALL: setData_Heatmap");

    var tmpData = {
        max: 1,
        data: ShowmapCtrl.filteredData
    };

    console.log("CALL: SetDataLayerHeatmap data.lenght=" + tmpData.data.length);

    if (ShowmapCtrl.layerHeatmap)
    {
        if( tmpData.data.length != 0) {

            if (!ShowmapCtrl.mainMap.hasLayer(ShowmapCtrl.layerHeatmap))
                ShowmapCtrl.mainMap.addLayer(ShowmapCtrl.layerHeatmap);

            ShowmapCtrl.layerHeatmap.setData(tmpData);
        }
        else
            hideHeatmap();
    }
}

function setData_MarkerCluster()
{
    console.log("CALL: setData_MarkerCluster");

    if(!ShowmapCtrl.layerMakerCluster) return;

    ShowmapCtrl.layerMakerCluster.clearLayers();

    for ( var i = 0 ; i < ShowmapCtrl.filteredData.length; i++ )
    {
        var d = ShowmapCtrl.filteredData[i];
        var etichetta = d.tag;
        var text = d.text;
        var id = d.id;
        //var date = d.date;
        var lat = d.latitude;
        var lng = d.longitude;
        var icon = getIcon(etichetta);
        var loc = d.loc;

        var marker = new L.Marker(
            new L.LatLng(lat, lng),
            {
                icon: icon,
                title: text
            });
        marker.bindPopup(text +
            "<br><b>Tag: </b>" + etichetta +
            "<br><b>ID: </b>" + id +
            "<br><b>Lon: </b>" + loc.coordinates[0] +
            "<br><b>Lat: </b>" + loc.coordinates[1] +
            "<br><b>Lon: </b>" + lng +
            "<br><b>Lat: </b>" + lat);

        ShowmapCtrl.layerMakerCluster.addLayer( marker );
    }
}

function getIcon(etichetta)
{
    switch (etichetta)
    {
        case "omofobia":    return getAwesomeMarker("blue");
        case "donne":       return getAwesomeMarker("red");
        case "razzismo":    return getAwesomeMarker("green");
        case "diversità":   return getAwesomeMarker("orange");
        default :           return getAwesomeMarker("purple");
    }
}

function getAwesomeMarker(color)
{
    return L.AwesomeMarkers.icon({
        icon: 'fa-twitter',
        prefix: 'fa',
        markerColor: color
    });
}

function refreshBoundaries()
{
    console.log("CALL: refreshBoundaries");

    if ( ShowmapCtrl.chkBoudaries && ShowmapCtrl.chkBoudaries.checked)
        showBoundaries();
}

function refreshData()
{
    console.log("CALL: refreshData");
    if ( ShowmapCtrl.chkHeatmap && ShowmapCtrl.chkHeatmap.checked)
        setData_Heatmap( null );
    if ( ShowmapCtrl.chkMarkercluster && ShowmapCtrl.chkMarkercluster.checked )
        setData_MarkerCluster( null );
}

function addOptionValue( combo , value, isSpecial )
{
    var o = new Option(value, value);
    var jqo = $(o);
    jqo.html(value);
    combo.append(o);

    if(isSpecial)
    {
        var line = new Option();
        var jqline = $(line);
        jqline.attr("data-divider", true);
        jqo.attr("data-subtext", "No tag");
        combo.append(line);
    }

};
