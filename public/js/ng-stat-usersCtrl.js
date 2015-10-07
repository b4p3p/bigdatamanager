"use strict";
ngApp.controller('ngStatUsersCtrl', ['$scope', function($scope) {

    /**
     * CONTROL
     */
    var $cmbUsers = $("#cmbUsers");
    var $restoreButton = $('#restoreButton');
    var $statButton = $('#statButton');
    var $formType = $('#formType');
    var $radioDays = $('#radioDays');
    var $radioWeeks = $('#radioWeeks');
    var $radioMonths = $('#radioMonths');
    var $timeLineContainer = $('#timeLineContainer');
    var $barChartContainer = $('#barChartContainer');
    var $divBar = $('#divBar');
    var $AZbutton = $('#AZbutton');
    var $ZAbutton = $('#ZAbutton');
    var $divMap = $('#divMap');
    var $mapContainer = $('#mapContainer');
    var $divCloud = $('#divCloud');
    var $cloudChart = $('#cloudChart');
    var $imgFilter = $("#img-filter");
    /**
     *  VARIABLE
     */
    var data = null;
    var filteredUserData = null;
    var filteredStat = null;
    var users = null;
    var selectedUsers = null;
    var colors = [];
    var maxDate = null;
    var minDate = null;
    var timeLineID = "timeLine";
    //var timeLineChart = null;
    var barChartID = 'barChart';
    var mapChartID = 'mapChart';
    var fill = null;
    //var userTokens = null;
    var dataCloud = [];
    var wordsCloud = [];
    var map = null;
    var layerGroup = null;

    $scope.btnShowStatistics_Click = function () {

        console.log("CALL: clickStat");

        $imgFilter.removeClass("fa fa-bar-chart");
        $imgFilter.addClass("fa fa-spinner fa-spin");

        selectedUsers = DomUtil.getSelectedCombo($cmbUsers);
        if( selectedUsers.length == 0 )
        {
            selectedUsers = users;
            DomUtil.selectAll($cmbUsers);
            $cmbUsers.selectpicker('refresh');
        }

        var conditions = new ObjConditions( null, null, null, null, $cmbUsers);

        var queryString = conditions.getQueryString();

        DataCtrl.getFromUrl(DataCtrl.FIELD.USERDATA, queryString, function(doc) {
            data = doc;
            filteredUserData = doc.data;
            colors = colorUtil.generateColor(filteredUserData.length);
            maxDate = new Date(doc.properties.maxDate);
            minDate = new Date(doc.properties.minDate);
            if(_.keys(doc.wordcount).length == 0)
                dataCloud = null;
            else
                dataCloud = doc.wordcount;

            DataCtrl.getFromUrl( DataCtrl.FIELD.STAT, "", function(docStat){

                filteredStat = docStat;
                drawCharts();

                $imgFilter.removeClass("fa fa-spinner fa-spin");
                $imgFilter.addClass("fa fa-bar-chart");
                $restoreButton.prop("disabled", false);
                $statButton.prop("disabled", true);
            }, DataCtrl.FIELD.STAT );

        }, null);
    };

    $scope.btnRestore_Click = function() {
        console.log("CALL: clickRestore");

        DomUtil.deselectAll($cmbUsers);
        $cmbUsers.selectpicker('refresh');
        clearDiv();
        $restoreButton.prop("disabled", true);
        $statButton.prop("disabled", true);
    };

    $scope.radioDate_Click = function() {
        console.log("CALL: handleModeClick");
        drawTimeLine();
    };

    $scope.btnAZ_Click = function() {
        console.log("CALL: AZbuttonClick");
        $AZbutton.addClass("active");
        $ZAbutton.removeClass("active");
        drawBarChart();
    };

    $scope.btnZA_Click = function() {
        console.log("CALL: ZAbuttonClick");

        $ZAbutton.addClass("active");
        $AZbutton.removeClass("active");
        drawBarChart();
    };

    function getUsers() {
        console.log("CALL: getUsers");

        $imgFilter.removeClass("fa fa-bar-chart");
        $imgFilter.addClass("fa fa-spinner fa-spin");

        //DataCtrl.getField( function(doc){

        DataCtrl.getFromUrl( DataCtrl.FIELD.USERS, "", function(doc){

            users = doc;
            selectedUsers = doc;

            initComboUsers();

            $imgFilter.removeClass("fa fa-spinner fa-spin");
            $imgFilter.addClass("fa fa-bar-chart");

            $cmbUsers.prop('disabled',false);
            $cmbUsers.selectpicker('refresh');

        }, DataCtrl.FIELD.USERS );
    }

    /**
     * Inizializza la combo degli utenti
     */
    function initComboUsers() {
        console.log("CALL: initComboUsers");
        var obj = null;
        for (var i = 0; i < 50 && i < users.length; i++ )
        {
            obj = users[i];
            DomUtil.addOptionValue($cmbUsers, obj.user, obj.sum);
        }
        $cmbUsers.selectpicker('refresh');
    }

    /**
     * Disegna tutti i grafici
     */
    function drawCharts() {

        clearDiv();

        $formType.removeClass('hidden');
        $timeLineContainer.removeClass('hidden');
        drawTimeLine();

        $divBar.removeClass('hidden');
        $barChartContainer.removeClass('hidden');
        $AZbutton.removeAttr("disabled");
        $ZAbutton.removeAttr("disabled");
        drawBarChart();

        $divMap.removeClass('hidden');
        $mapContainer.removeClass('hidden');
        drawMap();

        if(dataCloud != null)
        {
            $('#msgProject').addClass('hidden');
            $divCloud.removeClass('hidden');
            drawWordCloud();
        }
        else
        {
            $divCloud.replaceWith(
                '<div id="divCloud" class="form-group">' +
                '<div id="line"></div>' +
                '<label id="labelID" class="fix-label" style="margin-left: 3px">Word cloud token users</label><br>' +
                '<div class="alert alert-warning" role="alert" id="msgProject" style="margin-top: 20px;">' +
                '<span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>' +
                '<span class="sr-only">Error:</span>' +
                " Project's data not are synchronized with tags <br>" +
                'Please synchronize the project <br>' +
                '<a href="/view/app#/project/editproject">Edit project</a></div></div>');
            $divCloud = $('#divCloud');
        }
    }

    /**
     * Utility per pulire tutti i grafici
     * Dopo aver cancellato il div è necessario richiamare jquery per prendere i riferimenti
     */
    function clearDiv() {
        console.log("CALL: clearDiv");

        $formType.addClass('hidden');
        $timeLineContainer.replaceWith(
            '<div id="timeLineContainer" class="hidden">' +
            '<div id="timeLine"></div>' +
            '</div>');
        $timeLineContainer = $('#timeLineContainer');

        $divBar.addClass('hidden');
        $barChartContainer.replaceWith(
            '<div id="barChartContainer" class="hidden">' +
            '<div id="barChart"></div>' +
            '</div>');
        $barChartContainer = $('#barChartContainer');
        $AZbutton.prop("disabled", true);
        $ZAbutton.prop("disabled", true);

        $divMap.addClass('hidden');
        $mapContainer.replaceWith(
            '<div id="mapContainer" class="hidden">' +
            '<div id="mapChart"></div>' +
            '</div>');
        $mapContainer = $('#mapContainer');

        $divCloud.replaceWith(
            '<div id="divCloud" class="form-group hidden">' +
            '<div id="line"></div>' +
            '<label id="labelID" class="fix-label" style="margin-left: 3px">Word cloud token users</label><br>' +
            '<svg id="cloudChart"></svg></div>');
        $divCloud = $('#divCloud');
        $cloudChart = $('#cloudChart');
    }

    /**
     * Dichiara funzioni vuote per fare l'override dei metodi in base alla visualization mode
     */
    var selectLabelDate = function(date) {};
    var selectStepDate= function(date) {};

    /**
     * In base alla option selezionata effettua l'override delle funzioni dichiarate sopra
     */
    function setFuncNextDate() {

        console.log("CALL: setFuncNextDate");

        if($radioDays.is(':checked'))
        {
            selectLabelDate = function (date) { return date.toShortDate();};
            selectStepDate = function(date) { return date.nextDay();};
        }
        if($radioWeeks.is(':checked'))
        {
            selectLabelDate = function (date) { return date.toShortWeek();};
            selectStepDate = function(date) { return date.nextWeek();};
        }
        if($radioMonths.is(':checked'))
        {
            selectLabelDate = function (date) { return  date.getMonthString() + "-" + date.getFullYear()};
            selectStepDate = function(date) { return date.nextMonth()};
        }
    }

    /**
     * Prende i valori da visualizzare nel grafico
     */
    function getDatasetValue(userObj) {
        console.log("CALL: getDatasetValue");

        if (userObj.data == null || userObj.data.length == 0) return [];

        var ris = [];

        var dataset = _.groupBy(userObj.data, function(obj){
            return selectLabelDate( new Date(obj.date));
        });
        var min = minDate;

        //Inserisco le date mancanti
        while (min <= maxDate) {
            var key = selectLabelDate(min);
            if (dataset[key] == null)
                ris.push(0);
            else
                ris.push(dataset[key].length);
            min = selectStepDate(min);
        }
        ris.push(0);
        return ris;
    }

    function getDataset () {

        console.log("CALL: getDataset");

        var ris = [];
        ris = appendDate(ris);
        _.each(filteredUserData, function(userObj){
            var rowUser = getDatasetValue(userObj);
            _.each(rowUser, function(value, index){
                ris[index].push(value)
            });
        });
        return ris;
    }

    function appendDate(ris) {
        console.log("CALL: appendDate");
        var min = minDate;

        while (min <= maxDate) {
            ris.push([new Date(min)]);
            min = selectStepDate(min);
        }
        ris.push([new Date(min)]);
        return ris;
    }

    function ticks() {
        console.log("CALL: ticks");
        var min = minDate;
        var ris = [];
        while (min <= maxDate) {
            ris.push(new Date(min));
            min = selectStepDate(min);
        }
        ris.push(new Date(min));
        return ris;
    }

    /// DRAW

    /**
     * disegna la timeline
     */
    function drawTimeLine(){
        console.log("CALL: drawTimeLine");

        setFuncNextDate();

        var hAxisLabel = "Days";
        if($radioWeeks.is(':checked'))
            hAxisLabel = "Weeks";
        if($radioMonths.is(':checked'))
            hAxisLabel = "Months";

        var rows = getDataset();

        var data = new google.visualization.DataTable();

        data.addColumn('date', hAxisLabel);
        _.each(filteredUserData, function(userObj){
            data.addColumn('number', userObj.user);
        });

        data.addRows(rows);

        var options = {
            title: 'Users timeline',
            titleTextStyle: { fontSize: 14 },
            curveType: 'function',
            legend: 'none',
            backgroundColor: 'transparent',
            hAxis: {
                slantedText:true,
                slantedTextAngle:60,
                title: hAxisLabel,
                titleTextStyle: { fontSize: 14 },
                format: 'MMM d yyyy',
                maxValue: maxDate,
                minValue: minDate,
                ticks: ticks(),
                textStyle: { fontSize: 13 }
            },
            vAxis: {
                title: 'Number of data',
                titleTextStyle: { fontSize: 14 },
                logScale: false,
                viewWindow: {min:0},
                textStyle: { fontSize: 13 }
            },
            height: 400,
            colors: colors,
            chartArea: {
                height: '65%',
                top: '5%'
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById(timeLineID));
        chart.draw(data, options);
    }

    /**
     * disegna le barre dei tag
     */
    function drawBarChart() {
        console.log("CALL: drawBarChart");

        if($AZbutton.hasClass("active"))
            filteredUserData = _.sortBy(filteredUserData, function(obj) { return obj.data; });
        else
        {
            filteredUserData = _.sortBy(filteredUserData, function(obj) { return obj.data; });
            filteredUserData.reverse();
        }

        var data = google.visualization.arrayToDataTable(buildBarData());

        var chartAreaHeight = data.getNumberOfRows() * 30;
        var chartHeight = chartAreaHeight + 150;
        var heightBar = 60;

        var options = {
            title: "User tags",
            width: "100%",
            height: data.Gf.length == 1? "100%" : chartHeight,
            bar: { groupWidth: heightBar + "%" },
            legend: { position: 'top',  maxLines: 3, textStyle: {fontSize: 13}},
            isStacked: true,
            backgroundColor: 'transparent',
            annotations: {
                alwaysOutside: false,
                textStyle:  { color: "black"}
            },
            chartArea: {'height': chartAreaHeight, 'right':0, 'top': 100, 'left':150 },
            hAxis: {
                title: "Number of tagged data",
                titleTextStyle: { fontSize: 14 },
                textStyle: { fontSize: 13 }},
            vAxis: {
                title: "User",
                titleTextStyle: { fontSize: 14 },
                textStyle: { fontSize: 13 }},
            tooltip: { textStyle: {fontSize: 13}}
        };
        var chart = new google.visualization.BarChart(document.getElementById(barChartID));
        chart.draw(data, options);
    }

    /**
     * prende i dati
     */
    function buildBarData() {
        console.log("CALL: buildBarData");

        var data = [getHeader()];

        _.each(filteredUserData, function(userObj){

            var row = [];
            row.push(userObj.user);

            var userTags = _.countBy(userObj.data, 'tag');

            _.each(filteredStat.data.allTags, function (tag, i) {
                row[i + 1] = 0;
                _.each(userTags, function (val, key) {
                    if (tag == key)
                        row[i + 1] = val;
                });
            });
            data.push(row);
        });
        return data;
    }

    /**
     * prende l'header
     */
    function getHeader () {
        console.log("CALL: getHeader");
        var ris = ["Users"];
        var cont = 1;
        _.each(filteredStat.data.allTags, function (tag) {
            ris[cont] = tag;
            cont++;
        });
        return ris;
    }

    /**
     * Disegna la mappa
     */
    function drawMap() {
        createMap();
        setMapDate();
    }

    /**
     * Crea e inizializza la mappa
     */
    function createMap() {

        if( map ) return;

        var lat = 42.22;
        var long = 12.986;

        // set up the map
        map = new L.Map( 'map' );

        // create the tile layer with correct attribution
        var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

        var osm = new L.TileLayer( osmUrl, {
            minZoom: 2, maxZoom: 13,
            attribution: osmAttrib
        } );

        // start the map in Italy
        map.setView( new L.LatLng(lat, long), 2 );
        map.addLayer(osm);

        layerGroup = L.layerGroup().addTo(map);
    }

    function updateProgressBar(processed, total, elapsed, layersArray) {

        console.log(processed + '/' + total);

        if (elapsed > 1000) {
            // if it takes more than a second to load, display the progress bar:
            progress.style.display = 'block';
            progressBar.style.width = Math.round(processed/total*100) + '%';
        }

        if (processed === total) {
            // all markers processed - hide the progress bar:
            progress.style.display = 'none';
        }
    }

    function setMapDate() {

        function getColor(cont) {
            switch (cont) {
                case 0:
                    return "blue";
                case 1:
                    return "red";
                case 2:
                    return "green";
                case 3:
                    return "orange";
                case 4:
                    return "purple";
            }

        }

        function createMarker(user, d, index) {

            var text = d.text;
            var lat = d.latitude;
            var lng = d.longitude;

            if ( !lat || !lng) return null;

            var icon = L.AwesomeMarkers.icon({
                icon: 'fa-twitter',
                prefix: 'fa',
                markerColor: getColor(index)
            });

            var marker = new L.Marker(
                new L.LatLng(lat, lng),
                {
                    icon: icon,
                    title: text
                });

            marker.bindPopup(text +
                "<br><b>User: </b>" + user +
                "<br><b>Tag: </b>" + d.tag +
                "<br><b>Lon: </b>" + lng +
                "<br><b>Lat: </b>" + lat);

            return marker;
        }

        console.log("CALL: setMapDate");

        layerGroup.clearLayers();

        var dictIndex = {};
        var contUser = 0; var contMarkers = 0;

        //cicla sui dati degli utenti, l'index da il colore del marker
        async.each(filteredUserData,

            function (userData, next) {

                //var markers = new L.MarkerClusterGroup({ chunkedLoading: true, chunkProgress: updateProgressBar });
                //indice per il colore

                var group = new L.markerClusterGroup({
                    animateAddingMarkers: false,
                    chunkedLoading: true,
                    chunkProgress: updateProgressBar
                });

                dictIndex[userData.user] = contUser % 5;
                contUser++;
                contMarkers = 0;

                async.each(userData.data, function (d, next)
                {
                    var m = createMarker(userData.user, d, dictIndex[userData.user]);

                    //aggiungo in maniera asincrona
                    if (m != null)
                    {
                        contMarkers++;
                        group.addLayer(m);
                    }
                    next(null);

                }, function () {

                    var length = contMarkers;
                    console.log(userData.user + " add " + length);

                    //aggiungo l'insieme creato alla mappa
                    if (length>0)
                        layerGroup.addLayer( group );

                    next(null);
                });
            }, function(){}
        );
        console.log("END: setMapDate");
    }

    /**
     * Crea i dati da visualizzare sulla mappa
     * @returns {Array}
     */
    function buildMapData() {

        console.log("CALL: buildMapData");

        var data = [];
        var row = [];
        _.each(filteredUserData, function(userObj){
            for(var i = 0; i< userObj.data.length; i++)
            {
                var dataObj = userObj.data[i];

                //controllo che ci sia una latitudine/longitudine
                if( !dataObj.latitude || !dataObj.longitude )
                    continue;

                var text = userObj.user + ': "' + dataObj.text + '"';
                row.push(dataObj.latitude);
                row.push(dataObj.longitude);
                row.push(text);
                data.push(row);
                row = [];
            }
        });
        return data;
    }

    function drawWordCloud() {

        setTimeout(function(){

            fill = d3.scale.category20();
            wordsCloud = setDataCloud();

            var min = wordsCloud[wordsCloud.length - 1].size;
            var max = wordsCloud[0].size;

            var randomRotate = d3.scale.linear().domain([0, 1]).range([-20, 20]);
            var wordScale = d3.scale.linear().domain([min, max]).range([15, 100]);

            var w = $divCloud.width();
            var h = 400;

            $cloudChart.empty();

            d3.layout.cloud()
                .size([w , h])
                .words(wordsCloud)
                .rotate(function () {
                    return randomRotate(Math.random())
                })
                .font("Impact")
                .fontSize(function (d) {
                    return wordScale(d.size);
                })
                .on("end", drawCloud)
                .start();
        }, 500);
    }

    /**
     * Disegna il cloud
     */
    function drawCloud() {

        var w = $divCloud.width();
        var h = 400;

        $("#cloudChart")
            .attr("width",  w)
            .attr("height",  h);

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var wordG = d3.select("#cloudChart")
            .append("g").attr("id", "wordCloudG")
            .attr("width", w).attr("height", h)
            .attr("transform","translate(" + w/2 + "," + h/2 + ")");
        wordG.selectAll("text")
            .data(wordsCloud)
            .enter()
            .append("text")
            .style("font-size", function(d) {
                return d.size + "px";
            })
            .style("cursor", "default")
            .style("z-index", 20)
            .style("background", "#000000")
            .style("font-family", "Impact")
            .style("fill", function(d, i) {
                return fill(i);
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; })
            .on("mouseover", function(d)
            {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(
                    '<div class="tip">Token: <b>' + d.text + '</b><br>' +
                        getUsersOcc(d) +
                    '</div>'
                )
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                d3.select(this).style("font-weight","bold");
            }).on("mouseout", function() {
                d3.select(this).style("font-weight","normal");
                $(".tip").addClass("hidden");
            });
    }

    function setDataCloud() {
        var userTokens = [];
        _.each(dataCloud, function(value) {
            var obj = {
                text: value.token,
                size: value.size,
                users: value.users
            };
            userTokens.push(obj);
        });
        return userTokens;
    }

    function getUsersOcc(value) {
        var tot = 0;
        var res = 'Users: <br>';
        _.each(value.users, function(user) {
            res += '<b>' + user.user + '</b>: ' + user.size + '<br>';
            tot+=user.size;
        });
        res += 'Total: <b>' + tot + '</b>';
        return res;
    }

    /**
     *  DOCUMENT READY
     */
    $(document).ready(function ()
    {
        if(!window.PROJECT || window.PROJECT == "")
        {
            $("#container").hide();
            $("#msgProject").show();
        }
        else
            getUsers();
    });

    $('.selectpicker').on('change', function() {
        $statButton.prop("disabled", false);
        var selectedUsers = DomUtil.getSelectedCombo($cmbUsers);
        if( selectedUsers.length == 0 )
        {
            $statButton.prop("disabled", true);
            $restoreButton.prop("disabled", true);
        }
        else
            $restoreButton.prop("disabled", false);
    });

}]);