/**
 * @constructor
 */
ShowmapCtrl = function() {};

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
ShowmapCtrl.filteredData = null;

//layer
ShowmapCtrl.layerHeatmap = null;
ShowmapCtrl.layerMakerCluster = null;

//controls
ShowmapCtrl.sliderTimer = null;
ShowmapCtrl.cmbSelectTag = null;
ShowmapCtrl.cmbSelectNations = null;
ShowmapCtrl.chkMarkercluster = null;
ShowmapCtrl.chkHeatmap = null;
ShowmapCtrl.chkBoudaries = null;

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
        url: "http://localhost:8080/getdata",
        success: function (data) {

            ShowmapCtrl.datas = data.data;
            ShowmapCtrl.filteredData = data.data;

            ShowmapCtrl.minData = new Date(data.dateMin);
            ShowmapCtrl.maxData = new Date(data.dateMax);
            ShowmapCtrl.tags = data.tags;
            ShowmapCtrl.otherTag = data.otherTag;
            ShowmapCtrl.nations = data.nations;

            HideSpinner();
            loadData();

        },
        error: function (xhr, status, error) {
            console.error("ERR: ShowmapCtrl.getData " + status + " " + xhr.status);
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

ShowmapCtrl.cmdFilter_click = function()
{
    selectedNations = getSelectedCombo(ShowmapCtrl.cmbSelectNations);
    selectedTags = getSelectedCombo(ShowmapCtrl.cmbSelectTag);

    console.log("Condizioni:");
    console.log(" Nazioni:" + selectedNations);
    console.log(" Tags:" + selectedTags);

    ShowmapCtrl.filteredData = ShowmapCtrl.datas.filter(filterData);
    refreshData();
};

ShowmapCtrl.showBoundaries_click = function()
{
    console.log("showBoundaries_click");
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
    $("#spinner-cluster").removeClass("hidden");
    setTimeout(_showMarkerCluster, 5);
};

var _showMarkerCluster = function()
{
    if ( ShowmapCtrl.layerMakerCluster == null )
        ShowmapCtrl.layerMakerCluster = new L.MarkerClusterGroup();

    ShowmapCtrl.mainMap.addLayer( ShowmapCtrl.layerMakerCluster );
    setData_MarkerCluster();

    $("#spinner-cluster").addClass("hidden");
};

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

var selectedNations = [];
var selectedTags = [];

/**
 * Funzione per filtrare datas
 * @param obj - object of datas
 * @returns {boolean} - True: insert in filteredData
 */
function filterData(obj)
{
    if(selectedNations.length>0)
    {
        var index = selectedNations.indexOf("pippo");
        if ( index == -1) return false;
    }

    return true;
}

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
        var d = ShowmapCtrl.datas[i];
        var etichetta = d.tag;
        var text = d.text;
        var id = d.id;
        //var date = d.date;
        var lat = d.latitude;
        var lng = d.longitude;
        var icon = getIcon(etichetta);

        var marker = new L.Marker(
            new L.LatLng(lat, lng),
            {
                icon: icon,
                title: text
            });
        marker.bindPopup(text +
            "<br><b>Tag: </b>" + etichetta +
            "<br><b>ID: </b>" + id);
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

    //if ( !mapManager.flagIsLoad ) return;
    //
    //console.log("###########################################");
    //
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
    if ( ShowmapCtrl.chkHeatmap && ShowmapCtrl.chkHeatmap.checked)
    {
        setData_Heatmap( null );
    }

    if ( ShowmapCtrl.chkMarkercluster && ShowmapCtrl.chkMarkercluster.checked )
    {
        setData_MarkerCluster( null );
    }
}

function HideSpinner()
{
    $("#spinner").hide();
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










