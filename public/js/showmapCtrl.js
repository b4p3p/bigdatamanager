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
ShowmapCtrl.cmbSelectTag = null;
ShowmapCtrl.cmbSelectNations = null;
ShowmapCtrl.chkMarkercluster = null;
ShowmapCtrl.chkHeatmap = null;
ShowmapCtrl.chkBoudaries = null;
ShowmapCtrl.activeLayerBoundaries = null;
ShowmapCtrl.showInfoActiveLayer = false;

//data variable
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

ShowmapCtrl.initGui = function()
{
    ShowmapCtrl.cmbSelectTag = $('#cmbTags');
    ShowmapCtrl.cmbSelectNations = $('#cmbNations');

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

            $(".spinner-datas").hide();
            $("#count-container").removeClass("hidden");
            $("#count").text(data.data.length);
            loadData();
            ShowmapCtrl.getRegions();

        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.loadData " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

ShowmapCtrl.cmdFilter_click = function()
{
    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: ShowmapCtrl.createUrl(),
        success: function (data) {
            ShowmapCtrl.filteredData = data.data;
            $("#count").text(data.data.length);
            refreshData();
        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.cmdFilter_click " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

ShowmapCtrl.getRegions = function()
{
    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "/getregions?nations=" + ShowmapCtrl.nations.join(","),
        success: function (data) {
            ShowmapCtrl.regions = data;
            $(".spinner-regions").hide();
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

ShowmapCtrl.createUrl = function()
{
    var url = "/getdata";
    var conditions = [];
    var selectedNations = getSelectedCombo(ShowmapCtrl.cmbSelectNations);
    var selectedTags = getSelectedCombo(ShowmapCtrl.cmbSelectTag);
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
    console.log(url);
    return url;
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
    if ( !ShowmapCtrl.isDatasReady() ) return;

    if (ShowmapCtrl.layerHeatmap == null)
    {
        ShowmapCtrl.layerHeatmap = new HeatmapOverlay(cfg);
        ShowmapCtrl.mainMap.addLayer( ShowmapCtrl.layerHeatmap );
    }
    setData_Heatmap();
};

var showMarkerCluster = function()
{
    //visualizzo lo spinner di attesa
    var spinnerCluster = $("#spinner-cluster");
    spinnerCluster.removeClass("hidden");
    spinnerCluster.show();

    setTimeout(_showMarkerCluster, 10);
};

var _showMarkerCluster = function()
{
    if ( ShowmapCtrl.layerMakerCluster == null )
        ShowmapCtrl.layerMakerCluster = new L.MarkerClusterGroup();

    ShowmapCtrl.mainMap.addLayer( ShowmapCtrl.layerMakerCluster );
    setData_MarkerCluster();

    //rimuovo lo spinner di attesa
    var spinnerCluster = $("#spinner-cluster");
    spinnerCluster.addClass("hidden");
    spinnerCluster.hide();
};

var showBoundaries = function () {

    if (ShowmapCtrl.layerBoundaries == null)
    ShowmapCtrl.layerBoundaries = L.geoJson(
        ShowmapCtrl.regions ,
        {
            style: _style,
            onEachFeature: _onEachFeature
        }
    );

    ShowmapCtrl.layerBoundaries.addTo( ShowmapCtrl.mainMap );
    ShowmapCtrl.layerBoundaries.bringToFront();

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
    //console.log("PRE -EVENT _mouseover_feature -" + mapManager.activeLayerBoundaries + "- -" + mapManager.showInfoActiveLayer + "-");
    //
    //if ( mapManager.activeLayerBoundaries != null &&
    //    mapManager.showInfoActiveLayer ) return;
    //
    ////console.log("POST-EVENT _mouseover_feature");
    //

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
    console.log("click!");

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
                '<h3 class="title-popup">' +
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
        '</div>'
        '<button type="button" class="btn btn-default btn-sm btn-block" onclick="guiManager.OnClickButton()">' +
            'Show tweets' +
        '</button>' +
        '</div>';

    console.log("bindpopup");

    e.target.bindPopup(pop).openPopup();

    //ShowmapCtrl.mainMap.fitBounds(e.target.getBounds());

}

var hideHeatmap = function()
{
    ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerHeatmap );
    if ( ShowmapCtrl.mainMap.tagsLegend != null )
        ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.mainMap.tagsLegend );
};

var hideMarkerCluster = function()
{
    ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerMakerCluster );
    if ( ShowmapCtrl.tagsLegend != null )
        ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.tagsLegend );
};

var hideBoundaries = function()
{
    if ( ShowmapCtrl.layerBoundaries != null)
    {
        ShowmapCtrl.mainMap.removeLayer( ShowmapCtrl.layerBoundaries );
        ShowmapCtrl.layerBoundaries = null;
        if(ShowmapCtrl.legendControl)
            ShowmapCtrl.mainMap.removeControl( ShowmapCtrl.legendControl );
    }
};

var selectedNations = [];
var selectedTags = [];

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

function refreshData()
{
    console.log("CALL: refreshData");
    if ( ShowmapCtrl.chkHeatmap && ShowmapCtrl.chkHeatmap.checked)
        setData_Heatmap( null );
    if ( ShowmapCtrl.chkMarkercluster && ShowmapCtrl.chkMarkercluster.checked )
        setData_MarkerCluster( null );
}

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

var createMap = function()
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

var loadData = function()
{
    ShowmapCtrl.sliderTimer.dateRangeSlider(
        {
            enabled : true ,
            bounds:{
                min: new Date( ShowmapCtrl.minData ),
                max: new Date( ShowmapCtrl.maxData )
            }
        }
    );

    ShowmapCtrl.cmbSelectTag.attr("title", "Select Tags");
    ShowmapCtrl.cmbSelectNations.attr("title", "Select Nations");

    if(ShowmapCtrl.otherTag)
    {
        addOptionValue(ShowmapCtrl.cmbSelectTag, "Other", true);
    }
    ShowmapCtrl.tags.forEach(function(tag) {
        addOptionValue(ShowmapCtrl.cmbSelectTag, tag);
    });

    ShowmapCtrl.nations.forEach(function(nation) {
        addOptionValue(ShowmapCtrl.cmbSelectNations, nation);
    });

    $('.selectpicker').selectpicker('refresh');

};

var addOptionValue = function ( combo , value, isSpecial )
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








