ngApp.controller('ngDbNormalizationCtrl', ['$scope', function($scope) {

    $(".selectpicker").selectpicker();

    $scope.name = 'ngDbNormalizationCtrl';

    var $form = $("#upload_form");
    var $btnInput = $("#upload_button");
    var IDMap = "map";
    var $map = $('#' + IDMap );
    var map = null;
    var layerBoudaries = null;

    $scope.regions = null;
    $scope.stat = null;

    $form.ajaxForm({
        success: function(result){
            //$btnInput.fileinput('clear');
            alert(JSON.stringify(result));
        },
        error: function(err){
            alert(JSON.stringify(err));
        }
    });

    $scope.upload = function() {
        $form.submit();
    };

    function getData(){

        async.parallel({

            stat: function(next){
                DataCtrl.getFromUrl( DataCtrl.FIELD.STAT, "" ,  function(stat){
                    next(null, stat);
                })
            },

            regions: function(next){
                DataCtrl.getFromUrl( DataCtrl.FIELD.REGIONSJSON, "" ,  function(docs){
                    next(null, docs);
                })
            }

        }, function(err, result){

            $scope.$apply(function(){
                $scope.regions = result.regions;
                $scope.stat =    result.stat;
            });
            refreshBoundaries();

        })

    }

    function refreshBoundaries(){
        layerBoudaries = L.geoJson( $scope.regions, {
            style: styleFeature
            //onEachFeature: _self.onEachFeature
        });

        layerBoudaries.addTo( map );
        layerBoudaries.bringToFront();

        //this.insertLegend();
    }

    function styleFeature(feature){

        function getAvg(getAvg){
            var nation = feature.properties.NAME_0;
            var region = feature.properties.NAME_1;
            var avg = 0;
            if($scope.stat.data.nations && $scope.stat.data.nations[nation] != null)
                avg = $scope.stat.data.nations[nation].regions[region].avg;
            return avg;
        }

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

    $(document).ready(function() {
        initMap();

        setTimeout(function(){
            map.invalidateSize();
        }, 500);

        setTimeout(function(){
            getData();
        }, 600);

        $(window).trigger('resize');
    });



}]);