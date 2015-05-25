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

MapCtrl.layerHeatmap = null;

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

    $( document ).ready(function() {
        MapCtrl.mainMap.invalidateSize();
    });

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

MapCtrl.showHeatmap = function ()
{
    if ( !MapCtrl.isDatasReady() ) return;

    if (MapCtrl.layerHeatmap == null)
    {
        MapCtrl.layerHeatmap = new HeatmapOverlay(cfg);
        MapCtrl.mainMap.addLayer( MapCtrl.layerHeatmap );
        FilterData();
    }
};

function setDataLayerHeatmap()
{
    var tmpData = {
        max: 1,
        data: MapCtrl.datas
    };

    console.log("CALL: SetDataLayerHeatmap data.lenght=" + tmpData.data.length);

    if( tmpData.data.length != 0)
    {
        if (!MapCtrl.mainMap.hasLayer(MapCtrl.layerHeatmap))
            MapCtrl.mainMap.addLayer(MapCtrl.layerHeatmap);

        MapCtrl.layerHeatmap.setData(tmpData);
    }
    else
        hideLayerHeatmap();
}

function hideLayerHeatmap()
{

}

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

    setDataLayerHeatmap();

}

function HideSpinner()
{
    $("#spinner").hide();
}

function resizeMap()
{
    var deltaHeight = 150;
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










