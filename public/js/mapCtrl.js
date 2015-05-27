/**
 * @constructor
 */
MapCtrl = function() {};

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

MapCtrl.mainMap = null;
MapCtrl.mapContainer = '';
MapCtrl.datas = null;

//layer
MapCtrl.layerHeatmap = null;
MapCtrl.layerMakerCluster = null;

//controls
MapCtrl.sliderTimer = null;
MapCtrl.cmbSelectTag = null;
MapCtrl.cmbSelectNations = null;

MapCtrl.sliderTimer = $("#slider");

MapCtrl.isDatasReady = function()
{
    return this.datas != null;
};

MapCtrl.initMap = function(mapContainer)
{
    MapCtrl.mapContainer = mapContainer;

    createMap();
    resizeMap();

    $(window).on("resize", function(){
        resizeMap();
    });

    $(document).ready(function() {
        MapCtrl.mainMap.invalidateSize();
    });

};

MapCtrl.initGui = function()
{
    //$('.cmbTags')[0].selectpicker();

    MapCtrl.cmbSelectTag = $('#cmbTags');
    MapCtrl.cmbSelectNations = $('#cmbNations');
    //$('.selectpicker').selectpicker();



    MapCtrl.sliderTimer = $("#slider");
    MapCtrl.sliderTimer.dateRangeSlider(
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

MapCtrl.loadData = function ()
{
    $.ajax({
        type: "get",
        crossDomain: true,
        dataType: "json",
        url: "http://localhost:8080/getdata",
        success: function (data) {
            MapCtrl.datas = data;
            HideSpinner();
        },
        error: function (xhr, status, error) {
            console.error("ERR: MapCtrl.loadData " + status + " " + xhr.status);
            console.error("     Status: " + status + " " + xhr.status);
            console.error("     Error: " + error);
        }
    });
};

MapCtrl.heatmap_click = function()
{
    if ( $("#chk_heatmap")[0].checked )
        showHeatmap();
    else
        hideHeatmap();
};

MapCtrl.markerCluster_click = function()
{
    if ( $("#chk_markerCluster")[0].checked )
        showMarkerCluster();
    else
        hideMarkerCluster();
};

MapCtrl.cmdFilter_click = function()
{
    FilterData();
};

MapCtrl.showBoundaries_click = function()
{
    console.log("showBoundaries_click");
};

var showHeatmap = function ()
{
    if ( !MapCtrl.isDatasReady() ) return;

    if (MapCtrl.layerHeatmap == null)
    {
        MapCtrl.layerHeatmap = new HeatmapOverlay(cfg);
        MapCtrl.mainMap.addLayer( MapCtrl.layerHeatmap );
    }
    setData_Heatmap();
};

var showMarkerCluster = function()
{
    $("#spinner-cluster").removeClass("hidden");
    setTimeout(_showMarkerCluster, 5);
};

var _showMarkerCluster = function()
{
    if ( MapCtrl.layerMakerCluster == null )
        MapCtrl.layerMakerCluster = new L.MarkerClusterGroup();

    MapCtrl.mainMap.addLayer( MapCtrl.layerMakerCluster );
    setData_MarkerCluster();
    $("#spinner-cluster").addClass("hidden");
};

var hideHeatmap = function()
{
    MapCtrl.mainMap.removeLayer( MapCtrl.layerHeatmap );
    if ( MapCtrl.mainMap.tagsLegend != null )
        MapCtrl.mainMap.removeControl( MapCtrl.mainMap.tagsLegend );
};

var hideMarkerCluster = function()
{
    MapCtrl.mainMap.removeLayer( MapCtrl.layerMakerCluster );
    if ( MapCtrl.tagsLegend != null )
        MapCtrl.mainMap.removeControl( MapCtrl.tagsLegend );
};

function setData_Heatmap()
{
    var tmpData = {
        max: 1,
        data: MapCtrl.datas
    };

    console.log("CALL: SetDataLayerHeatmap data.lenght=" + tmpData.data.length);

    if (MapCtrl.layerHeatmap)
    {
        if( tmpData.data.length != 0) {

            if (!MapCtrl.mainMap.hasLayer(MapCtrl.layerHeatmap))
                MapCtrl.mainMap.addLayer(MapCtrl.layerHeatmap);

            MapCtrl.layerHeatmap.setData(tmpData);
        }
        else
            hideHeatmap();
    }

}

function setData_MarkerCluster()
{
    if(!MapCtrl.layerMakerCluster) return;

    MapCtrl.layerMakerCluster.clearLayers();

    for ( var i = 0 ; i < MapCtrl.datas.length; i++ )
    {
        var d = MapCtrl.datas[i];
        var etichetta = d.tag;
        var text = d.text;
        var date = d.date;
        var lat = d.latitude;
        var lng = d.longitude;
        var icon = getIcon(etichetta);

        var marker = new L.Marker(
            new L.LatLng(lat, lng),
            {
                icon: icon,
                title: text
            });
        marker.bindPopup(text);
        MapCtrl.layerMakerCluster.addLayer( marker );
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
};

function getAwesomeMarker(color)
{
    return L.AwesomeMarkers.icon({
        icon: 'fa-twitter',
        prefix: 'fa',
        markerColor: color
    });
};

function FilterData()
{
    //if ( !mapManager.flagIsLoad ) return;
    //
    //console.log("###########################################");
    //console.log("CALL: FilterData");
    //
    //var conditions = {
    //    startDate: this.selectedStartDate,
    //    endDate: this.selectedEndDate,
    //    selectedTags: guiManager.GetSelectedOptions(mapManager.cmbSelectTag),
    //    nations: guiManager.GetSelectedOptions(mapManager.cmbSelectNations),
    //    region: mapManager.selectRegion
    //};
    //
    //if (!mapManager.chkFilterByTag.checked ) conditions.selectedTags = null;
    //if (!mapManager.chkFilterByNations.checked ) conditions.nations = null;
    //
    //if ( this.chkHeatmap && this.chkHeatmap.checked)
    //{
    //    this.SetDataLayerHeatmap( conditions );
    //}
    //
    //if ( this.chkMakerCluster && this.chkMakerCluster.checked )
    //{
    //    this.SetDataLayerMakerCluster( conditions );
    //}

    setData_MarkerCluster();
    setData_Heatmap();

}

function HideSpinner()
{
    $("#spinner").hide();
}

function HideSpinnerCluster(){

}

function resizeMap()
{
    var deltaHeight = 200;
    //var deltaWidth = -100;

    var map = $('#' + MapCtrl.mapContainer);
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
    MapCtrl.mainMap = new L.Map( MapCtrl.mapContainer);

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    var osm = new L.TileLayer( osmUrl, {
        minZoom: 2,
        maxZoom: 13,
        attribution: osmAttrib
    });

    // start the map in Italy
    MapCtrl.mainMap.setView( new L.LatLng(lat, long), 6 );
    MapCtrl.mainMap.addLayer(osm);

};










