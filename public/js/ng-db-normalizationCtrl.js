"use strict";

/**
 *  Mostra a video le regioni normalizzate con il dataset di normalizzazione
 *  Dato che nella collection regions è memorizzato un intero che rappresenta il numero dei tweet
 *  all'interno della regione, è necessario normalizzare questo valore (max-min) per poter apprezzare
 *  il diverso colore sulla mappa
 */
ngApp.controller('ngDbNormalizationCtrl', ['$scope', function($scope) {

    $(".selectpicker").selectpicker();

    $scope.name = 'ngDbNormalizationCtrl';

    var $progress = $("#progress");
    var $cmbTypeNorm = $("#cmbTypeNorm");
    var $form = $("#upload_form");
    var $btnInput = $("#upload_button");
    var IDMap = "map";
    var $map = $('#' + IDMap );
    var map = null;
    var layerBoudaries = null;

    $scope.showLoading = true;
    $scope.regions = null;
    $scope.maxmin = {max: null, min:null};
    $scope.typeNormalization = 0;
    $scope.count = 0;
    $scope.percentageUpload = 0;

    $form.ajaxForm({
        success: function(result){
            $progress.removeClass("active");
            $btnInput.fileinput('clear');
            alert(JSON.stringify(result));
            getData();
        },
        error: function(err){
            $progress.removeClass("active");
            alert(JSON.stringify(err));
        },
        uploadProgress: function(event, position, total, percentage, file)
        {
            console.log("percentage: " + percentage);

            $progress.attr("aria-valuenow", percentage);
            $progress.css("width", percentage + "%");
            $scope.$apply(function(){
                $scope.percentageUpload = percentage;
            })
        }
    });

    $scope.upload = function() {
        $progress.addClass("active");
        $progress.attr("aria-valuenow", "0");
        $progress.css("width", "0%");
        $form.submit();
    };

    $scope.typeNormalization_Changed = function(){
        console.log( $scope.typeNormalization );
    };

    /**
     *  Chiede i dati al server
     *  Sono necessarie soltanto le regioni con i loro confini
     */
    function getData(){

        async.parallel({

            //stat: function(next){
            //    DataCtrl.getFromUrl( DataCtrl.FIELD.STAT, "" ,  function(stat){
            //        next(null, stat);
            //    })
            //},

            regions: function(next){
                DataCtrl.getFromUrl( DataCtrl.FIELD.REGIONSJSON, "" ,  function(docs){
                    next(null, docs);
                })
            }

        }, function(err, result){

            //inizializza i campi
            if(result.regions.length > 0)
            {
                $scope.maxmin.max = result.regions[0].properties.baseNorm;
                $scope.maxmin.min = result.regions[0].properties.baseNorm;
            }else{
                $scope.maxmin.max = 0
                $scope.maxmin.min = 0
            }

            $scope.count = 0;

            //Prende il minimo e il massimo di baseNorm
            _.each( result.regions , function(region){
                if ( region.properties.baseNorm )
                {
                    $scope.maxmin.max = Math.max( region.properties.baseNorm, $scope.maxmin.max );
                    $scope.maxmin.min = Math.min( region.properties.baseNorm, $scope.maxmin.min );
                    $scope.count += region.properties.baseNorm;
                }
            });

            //Salva i dati e disegna i confini
            $scope.regions = result.regions;
            $scope.showLoading = false;

            $scope.$apply();

            refreshBoundaries();

        })
    }

    function refreshBoundaries(){

        if( layerBoudaries != null )
        {
            console.log("reset map");
            map.removeLayer( layerBoudaries );
        }

        layerBoudaries = L.geoJson( $scope.regions, {
            style: styleFeature,
            onEachFeature: onEachFeature
        });

        layerBoudaries.addTo( map );
        layerBoudaries.bringToFront();

        //this.insertLegend();
    }

    /**
     * Data una feature, calcola l'indice normalizzato con il max-min
     * @param getAvg
     * @returns {number}
     */
    function getAvg(feature){

        var nation = feature.properties.NAME_0;
        var region = feature.properties.NAME_1;
        var avg = 0;

        /**
         *  type = 0
         *  L'indice è calcolato secondo la formula
         *  baseNorm / max
         */
        if( $scope.typeNormalization == 0)
            avg = feature.properties.baseNorm / $scope.maxmin.max;

        /**
         *  type = 1
         *  L'indice è calcolato secondo la formula
         *  Ln( baseNorm + e ) / Ln( max + e)
         */
        else
            avg = Math.log( feature.properties.baseNorm + Math.E ) /
                Math.log( $scope.maxmin.max + Math.E );

        return avg;
    }

    function styleFeature(feature){

        function getColorBoundaries(percentage) {
            return percentage > 0.8 ? '#800026' :
                percentage > 0.7 ? '#BD0026' :
                    percentage > 0.6 ? '#E31A1C' :
                        percentage > 0.5 ? '#FC4E2A' :
                            percentage > 0.4 ? '#FD8D3C' :
                                percentage > 0.3 ? '#FEB24C' :
                                    percentage > 0.2 ? '#FED976' :
                                        '#FFEDA0';
        };

        var avg = getAvg( feature );

        return {
            fillColor: getColorBoundaries( avg ),
            fillOpacity: 0.5,  weight: 2,
            opacity: 0.5,  color: 'white', dashArray: '3'
        }
    }

    function onEachFeature(feature, layer){

        function mouseOver(e){
            var layer = e.target;
            map.dragging.disable();
            layer.setStyle({
                weight: 5, color: '#666',
                dashArray: '', fillOpacity: 0.7
            });
            if (!L.Browser.ie && !L.Browser.opera) { layer.bringToFront(); }
        }

        function mouseOut(e){
            map.dragging.enable();
            layerBoudaries.resetStyle(e.target);
        }

        function mouseClick(e)
        {
            var nation = e.target.feature.properties.NAME_0;
            var region = e.target.feature.properties.NAME_1;
            var baseNorm = e.target.feature.properties.baseNorm;
            var value = 0;

            if( !baseNorm )
                baseNorm = 0;
            else
                value = getAvg(e.target.feature).toFixed(2);

            var pop = '<div class="popup">' +
                    '<h3>' + nation + '</h3>' +
                    '<h4>' + region + '</h4>' +
                    '<p>Count: ' + baseNorm + '</p>' +
                    '<p>Value: ' + value + '</p>' +
                '</div>';

            e.target.bindPopup(pop).openPopup();
        }

        layer.on({
            mouseover: mouseOver,
            mouseout: mouseOut,
            click: mouseClick
        });

    }

    /**
     *  Crea la mappa
     */
    function initMap(){

        function createMap(){
            var lat = 42.22;
            var long = 12.986;

            // set up the map
            map = new L.Map( IDMap );

            // create the tile layer with correct attribution
            var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

            var osm = new L.TileLayer( osmUrl, { minZoom: 2, maxZoom: 13, attribution: osmAttrib });

            // start the map in Italy
            map.setView( new L.LatLng(lat, long), 4 );
            map.addLayer(osm);

            map.invalidateSize();
        }

        function resizeMap() {
            $map.css("height", "100%"); // -200
        }

        resizeMap();
        createMap();

        $(window).on("resize", function(){
            resizeMap();
        });
    }

    // Eventi

    $cmbTypeNorm.change( function(e){
        $scope.typeNormalization = $( this ).val();
        refreshBoundaries();
    });

    $(document).ready(function() {

        //crea la mappa
        initMap();

        //bub leaflet
        setTimeout(function(){
            map.invalidateSize();
        }, 500);

        //chiedo i dati
        setTimeout(function(){
            getData();
        }, 600);

        //bug leaflet
        $(window).trigger('resize');
    });

}]);