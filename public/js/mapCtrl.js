/**
 * Created by b4p3p on 23/05/15.
 */

var MapCtrl = new function()
{
    this.nameMap = '';
    this.nameContainer = "";
    this.mainMap = null;

    this.InitMap = function(nameMap, mapContainer)
    {
        this.nameContainer = mapContainer;
        this.nameMap = nameMap;

        createMap();
        resizeMap();

        $(window).on("resize", function(){
            resizeMap();
        });



    };

};

function resizeMap()
{

    var deltaHeight = 200;

    var content = $("#indexContent");
    var map = $('#' + MapCtrl.nameMap);
    var container = $('#' + MapCtrl.containerMap);
    var width = container.width();

    map.css("height", ( $(window).height() ));

    if($(window).width()>=980){
        map.css("height", $(window).height() - deltaHeight);
        map.css("margin-top",50);
        map.css("width", width );
    }else{
        map.css("height", $(window).height() - deltaHeight);
        map.css("margin-top",-21);
        map.css("width", width );
    }
}

function createMap()
{
    var lat = 42.22;
    var long = 12.986;

    // set up the map
    this.mainMap = new L.Map( MapCtrl.nameContainer);

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    var osm = new L.TileLayer( osmUrl, {
        minZoom: 2,
        maxZoom: 13,
        attribution: osmAttrib
    });

    // start the map in Italy
    this.mainMap.setView( new L.LatLng(lat, long), 6 );
    this.mainMap.addLayer(osm);
}










