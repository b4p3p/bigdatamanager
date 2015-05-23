/**
 * Created by b4p3p on 23/05/15.
 */

var MapCtrl = new function()
{
this.nameContainer = "pippo";
this.map = null;

this.test = function(){
    console.log( this.nameContainer );
};

this.CreateMap = function(container)
{
    this.nameContainer = container;
    try {
        this.InitMap();
    } catch (e) {
        alert ( "Create map: " +  e );
    }
};

this.InitMap = function()
{
    var lat = 42.22;
    var long = 12.986;

    //console.log("sto per creare mappa");

    // set up the map
    this.MainMap = new L.Map(this.nameContainer);

    //console.log("mappa creata");

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    var osm = new L.TileLayer( osmUrl, {
        minZoom: 2,
        maxZoom: 13,
        attribution: osmAttrib
    });

    // start the map in Italy
    this.MainMap.setView( new L.LatLng(lat, long), 6 );
    this.MainMap.addLayer(osm);
};

};










