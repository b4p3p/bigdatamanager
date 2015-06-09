RegionRadarCtrl = {

    regionRadarTable: null,
    regions: null,
    radarOptions: {
        animation: true,
        //Boolean - Whether to show lines for each scale point
        scaleShowLine : true,
        //Boolean - Whether we show the angle lines out of the radar
        angleShowLineOut : true,
        //Boolean - Whether to show labels on the scale
        scaleShowLabels : false,
        // Boolean - Whether the scale should begin at zero
        scaleBeginAtZero : true,
        //String - Colour of the angle line
        angleLineColor : "rgba(0,0,0,.1)",
        //Number - Pixel width of the angle line
        angleLineWidth : 1,
        //String - Point label font declaration
        pointLabelFontFamily : "'Arial'",
        //String - Point label font weight
        pointLabelFontStyle : "normal",
        //Number - Point label font size in pixels
        pointLabelFontSize : 14,
        //String - Point label font colour
        pointLabelFontColor : "#666",
        //Boolean - Whether to show a dot for each point
        pointDot : true,
        //Number - Radius of each point dot in pixels
        pointDotRadius : 3,
        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth : 1,
        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius : 20,
        //Boolean - Whether to show a stroke for datasets
        datasetStroke : true,
        //Number - Pixel width of dataset stroke
        datasetStrokeWidth : 2,
        //Boolean - Whether to fill the dataset with a colour
        datasetFill : true,
        //String - A legend template
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    },

    getData: function()
    {
        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "http://localhost:8080/getregions",
            success: function (data) {
                RegionRadarCtrl.regions = data;
                RegionRadarCtrl.drawRegionsRadar();
            },
            error: function (xhr, status, error) {
                console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    getTableData: function()
    {
        var ris = [];

        for ( var i =0;i< RegionRadarCtrl.regions.length; i++)
        {
            var value = RegionRadarCtrl.regions[i];
            var prop = value.properties;

            //var area = prop.area;
            //var population = prop.population;
            //var density = prop.density;
            //var densityTw = prop.densityTweet;

            var region = prop.NAME_1;
            var count = prop.sum;
            var tweets = prop.counter;

            ris.push({
                id : i ,
                region: region,
                count: count,
                tweets: tweets
            });
        }

        return ris;
    },

    /**
     * Dalla prima regione prendo i tag presenti
     * @returns {Array} - ["omofobia", "razzismo", ... ]
     */
    getLabelsRadar: function()
    {
        var ris = [];
        if( this.regions == null || this.regions.length == 0) return ris;

        var region = this.regions[0];
        for ( var t in region.properties.counter)
        {
            ris.push( t );
        }


        return ris;
    },

    getDataRadar: function(index)
    {
        var ris = [];

        var counter = RegionRadarCtrl.regions[index].properties.counter;
        for ( var t in counter )
            ris.push(counter[t]);

        return ris;
    },

    initGUIEvent: function()
    {
        this.regionRadarTable = $( "#RegionsRadarTable" );
        $( this.regionRadarTable ).bootstrapTable({}).on('post-body.bs.table', function ()
        {
            console.log("CALL: post-body.bs.table");
            RegionRadarCtrl.refreshRadar();
        });

        $( this.regionRadarTable ).on('check.bs.table', function (e, row, $element)
        {
            console.log("CALL: check.bs.table");
            var sel = RegionRadarCtrl.regionRadarTable.bootstrapTable('getSelections');
            RegionRadarCtrl.setStateCompareForm(sel.length);
        });

        $( this.regionRadarTable ).on('uncheck.bs.table', function (e, row, $element)
        {
            var sel = RegionRadarCtrl.regionRadarTable.bootstrapTable('getSelections');
            RegionRadarCtrl.setStateCompareForm(sel.length);
        });
    },

    refreshRadar: function()
    {
        console.log("CALL: refreshRadar");

        var radars = $(".radar");
        var labels = this.getLabelsRadar();
        var radarData = null;

        for(var i=0; i < radars.length; i++)
        {
            var radar = radars[i];

            if ( radar === null ) continue;

            var index = parseInt(radar.getAttribute("index"));

            radarData = {
                labels: labels,
                datasets: [
                    {
                        label: "Tweets",
                        fillColor: "rgba(220,220,220,0.2)",
                        strokeColor: "rgba(220,220,220,1)",
                        pointColor: "rgba(220,220,220,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(220,220,220,1)",
                        data: RegionRadarCtrl.getDataRadar(index)
                    }
                ]
            };

            var ctx = radar.getContext("2d");
            var radarChart = new Chart(ctx).Radar(radarData, this.radarOptions);

        }

        return radars.length;
    },

    setStateCompareForm: function(lenght)
    {
        //TODO
    },

    enableCompareForm: function()
    {
        //TODO
    },

    disableCompareForm: function()
    {
        //TODO
    },

    drawRegionsRadar: function()
    {
        console.log("CALL: drawRegionsRadar");
        this.removeWait();
        var data = this.getTableData();
        $("#RegionsRadarTable").bootstrapTable( 'load' , data );
    },

    //'style="margin-right:25%;margin-left:25%;"

    drawRegionRadar: function(value, row)
    {
        var index = row.id;
        return '<canvas class="radar" id="radar' + index + '" ' +
                        'index="' + index + '"/>'
    },

    removeWait: function()
    {
        $("#spinner").addClass("hidden");
        $("#container").removeClass("hidden");
    }
};
