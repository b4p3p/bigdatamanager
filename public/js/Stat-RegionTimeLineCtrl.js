Date.prototype.nextDay = function () {
    var d = new Date();
    d.setTime ( this.getTime() + 1000*60*60*24*1 );
    return d;
};

Date.prototype.toShortDate = function () {

    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day].join('/');

};

Date.prototype.toDBDate = function () {

    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    return [year, month, day].join('-');

};

RegionTimeLineCtrl = {

    timeLineID: "",
    cmbTypeVisualization: null,
    timeLineChart: null,
    timeLineLine: null,
    data_data: null,
    data_day: null,
    data_week: null,
    data_month: null,
    lineOptions : {
        barValueSpacing: 1,
        animation: false,
        ///Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: true,
        //String - Colour of the grid lines
        scaleGridLineColor: "rgba(0,0,0,.05)",
        //Number - Width of the grid lines
        scaleGridLineWidth: 1,
        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,
        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,
        //Boolean - Whether the line is curved between points
        bezierCurve: true,
        //Number - Tension of the bezier curve between points
        bezierCurveTension: 0.4,
        //Boolean - Whether to show a dot for each point
        pointDot: true,
        //Number - Radius of each point dot in pixels
        pointDotRadius: 4,
        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth: 1,
        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius: 2,
        //Boolean - Whether to show a stroke for datasets
        datasetStroke: true,
        //Number - Pixel width of dataset stroke
        datasetStrokeWidth: 2,
        //Boolean - Whether to fill the dataset with a colour
        datasetFill: true,
        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    },

    initGUI: function()
    {
        this.cmbTypeVisualization = $('#cmbTypeVisualization');
        this.cmbTypeVisualization.on('change', function(){
            this.drawTimeLine();
        });
        this.timeLineID = "timeLine";
    },

    getData: function()
    {
        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "http://localhost:8080/gettimeline",
            success: function (data) {
                RegionTimeLineCtrl.data_day = data;
                RegionTimeLineCtrl.data = data;
                RegionTimeLineCtrl.drawTimeLine();
            },
            error: function (xhr, status, error) {
                console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    drawTimeLine: function()
    {
        console.log("CALL: drawTimeLine");

        this.removeWait();

        if ( this.timeLineChart != null )
            $("#" + this.timeLineID).replaceWith('<canvas id="TimeLine"></canvas>');

        var difference = this.getDifference( new Date(this.data.properties.first),
                                             new Date(this.data.properties.last));
        $("#" + this.timeLineID).width(20 * difference);

        var ctx = document.getElementById(this.timeLineID).getContext("2d");
        this.timeLineChart = new Chart(ctx);
        this.timeLineLine = this.timeLineChart.Line(this.lineData(), this.lineOptions);

    },

    getDifference: function(dateA, dateB){
        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        return Math.round(Math.abs((dateA.getTime() - dateB.getTime())/(oneDay)));
    },

    lineData: function()
    {
        return {
            labels: this.getLabels(),
            datasets: this.getDataset()
        };
    },

    /**
     * Usa la prima regione per vedere i tag disponibili
     * @returns {Array}
     */
    getLabels : function () {

        if ( this.data == null || this.data.length == 0 ) return [];

        var ris = [];
        var d_ctrl = new Date(this.data.properties.first);
        var last =   new Date(this.data.properties.last);

        while(d_ctrl < last)
        {
            ris.push(d_ctrl.toShortDate());
            d_ctrl = d_ctrl.nextDay();
        }
        return ris;
    },

    getDataset: function()
    {
        var ris = [];
        ris[0] = {
            width: 2000,
            label: "Tweets time line",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: this.getDatasetValue()
        };
        return ris;
    },

    getDatasetValue: function()
    {
        if ( this.data == null || this.data.length == 0 ) return [];

        var ris = [];
        var d_ctrl = new Date(this.data.properties.first);
        var last =   new Date(this.data.properties.last);

        while(d_ctrl < last)
        {
            if(this.data.data[d_ctrl.toDBDate()] == null)
                ris.push(0);
            else
                ris.push(this.data.data[d_ctrl.toDBDate()]);
            d_ctrl = d_ctrl.nextDay();
        }
        return ris;


    },

    removeWait: function()
    {
        console.log("remove wait");

        $("#spinner").addClass("hidden");

        $(".content").each(function() {
            $( this ).removeClass( "hidden" );
        });
    }

};