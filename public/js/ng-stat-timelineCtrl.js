"use strict";

//ngApp.controller('ngStatTimeLineCtrl', ['$scope', function($scope) {
ngApp.controller('ngStatTimeLineCtrl', function($scope, $rootScope) {

    var lineOptions = {
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
        legendTemplate: ""
    };

    var tags = null;

    var $radioDays = $('#radioDays');
    var $radioWeeks = $('#radioWeeks');
    var $radioMonths = $('#radioMonths');
    var $cmbUsers = $('#cmbUsers');
    var $cmbTags = $('#cmbTags');
    var $btnFilter = $('#btnFilter');
    var $btnRestore = $('#btnRestore');
    var $imgFilter = $("#img-filter");
    var $imgRestore = $("#img-restore");
    var $timeLineContainer = $('#timeLineContainer');
    var $timeLine = $('#timeLine');
    var $spinner = $('#spinner');
    var $msgProject = $('#msgProject');
    var timeLineID = "timeLine";
    var timeLineChart = null;
    var timeLineLine = null;

    $scope.data = null;
    $scope.tags = null;
    $scope.stat = null;
    $scope.users = null;

    $scope.filter = {
        type : "days"  // "day" || "week" || "month"
    };

    $scope.optTypeChange = function()
    {
        $btnFilter.removeAttr("disabled");
    };

    $scope.cmbTagChange = function()
    {
        $btnFilter.removeAttr("disabled");
    };

    $scope.cmbUsersChange = function()
    {
        $btnFilter.removeAttr("disabled");
    };

    $scope.hasNoData = function(){
        return $scope.data.length == 0;
    };

    function getDateOfWeek(w, y) {
        var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
        return new Date(y, 0, d);
    }

    //Funzioni usate per eseguire l'override
    var selectLabelDate = function (date)  {};
    var selectStepDate = function(date)    {};

    /**
     * Funzione che imposta l'override
     */
    function setFuncNextDate() {

        if($radioDays.is(':checked'))
        {
            selectLabelDate = function (date) { return date.toShortDate();};
            selectStepDate = function(date) { return date.nextDay();};
        }

        if($radioWeeks.is(':checked'))
        {
            selectLabelDate = function (date) {
                var xdate = new XDate(date);
                var week = xdate.getWeek();
                var d = new XDate(getDateOfWeek(week, xdate.getFullYear()));
                return d.toString("dd-MM-yyyy");
            };
            selectStepDate = function(date) {
                var xdate = new XDate(date);
                return new Date(xdate.addWeeks(1).getTime());
            };
        }
        if($radioMonths.is(':checked'))
        {
            selectLabelDate = function (date) { return  date.getMonthString() + "-" + date.getFullYear()};
            selectStepDate = function(date) { return date.nextMonth()};
        }
    }

    //Richiamo la prima volta la funzione per impostare la funzione da usare
    setFuncNextDate();

    function getData() {

        console.log("CALL: getData");

        async.parallel({
                data: function(next) {
                    DataCtrl.getFromUrl(DataCtrl.FIELD.DATABYDATE, null, function(result){
                        $scope.data = result;
                        next(null, result);
                    }, null);
                },
                stat: function(next) {
                    DataCtrl.getField( function(doc){
                        $scope.tags = doc.data.allTags;
                        $scope.stat = doc;
                        next(null, doc);
                    }, DataCtrl.FIELD.STAT );
                },
                users: function (next) {
                    DataCtrl.getField( function(doc){
                        $scope.users = doc;
                        next(null, doc);
                    }, DataCtrl.FIELD.USERS, 50);
                }
            }, function(err, results) {
                if($scope.data.length > 0)
                    enableControls();
                initComboTags();
                initComboUsers();
                removeWait();
                drawTimeLine();
                $scope.$apply();
            }
        );
    }

    function enableControls() {
        $radioDays.removeAttr("disabled");
        $radioWeeks.removeAttr("disabled");
        $radioMonths.removeAttr("disabled");
        $cmbUsers.removeAttr("disabled");
        $cmbTags.removeAttr("disabled");
        $btnRestore.removeAttr("disabled");
    }

    function initComboTags() {
        console.log("CALL: initComboTags");

        _.each($scope.tags, function(obj){
            DomUtil.addOptionValue($cmbTags, obj);
        });
        $cmbTags.selectpicker('refresh');
    }

    $btnRestore.click(function(){                      //  AGGIUNTO

        console.log("CALL: clickRestore");

        $btnRestore.prop("disabled", false);
        addWaitImgRestore($imgRestore);
        setDisableAllBtn(true);
        clearCanvas();
        DomUtil.deselectAll($cmbUsers);
        DomUtil.deselectAll($cmbTags);
        $(".selectpicker").selectpicker('refresh');
        removeWaitImgRestore($imgRestore);
        $btnFilter.removeAttr("disabled");

    });

    function initComboUsers() {
        console.log("CALL: initComboUsers");

        var obj = null;
        for (var i = 0; i < 50 && i < $scope.users.length; i++ )
        {
            obj = $scope.users[i];
            DomUtil.addOptionValue($cmbUsers, obj.user, obj.sum);
        }
        $cmbUsers.selectpicker('refresh');
    }

    function removeWait() {

        console.log("remove wait");

        $("#spinner").addClass("hidden");
        $(".timecontent").removeClass("hidden");
    }

    function addWaitImg($img){
        $img.removeClass("glyphicon glyphicon-filter");
        $img.addClass("fa fa-spinner fa-spin");
    }

    function addWaitImgRestore($img){
        $img.removeClass("glyphicon glyphicon-remove");
        $img.addClass("fa fa-spinner fa-spin");
    }

    function removeWaitImg($img){
        $img.removeClass("fa fa-spinner fa-spin");
        $img.addClass("glyphicon glyphicon-filter");
    }

    function removeWaitImgRestore($img){
        $img.removeClass("fa fa-spinner fa-spin");
        $img.addClass("glyphicon glyphicon-remove");
    }

    function clearCanvas() {
        $timeLineContainer.replaceWith(
            '<div id="timeLineContainer" class="timecontent hidden">' +
            '<canvas id="timeLine"></canvas>' +
            '</div>');
        $timeLineContainer = $('#timeLineContainer');
        $timeLine = $('#timeLine');
    }

    function setDisableAllBtn(value){
        $btnFilter.prop("disabled", value);
        $btnRestore.prop("disabled", value);
    }

    function drawTimeLine(){

        console.log("CALL: drawTimeLine");

        var dataset = toLineData();
        var scale = 20;

        $timeLineContainer.removeClass('hidden');
        $timeLineContainer.css("overflow-x", "auto");

        if($radioWeeks.is(':checked'))
            scale = 50;
        if($radioMonths.is(':checked'))
            scale = 100;

        var $tLine = $("#" + timeLineID);
        $tLine.width(scale * dataset.datasets[0].data.length);

        var hc = $('body > .container').height();
        var htop = $('#formType').height();
        var hmin = hc - htop - 30;
        $tLine.css('max-height', hmin);

        var ctx = document.getElementById(timeLineID).getContext("2d");
        timeLineChart = new Chart(ctx);
        timeLineLine = timeLineChart.Line(dataset, lineOptions );
    }

    function toLineData() {
        console.log("CALL: toLineData");
        return {
            labels: getLabels(),
            datasets: getDataset()
        };
    }

    /* Usa la prima regione per vedere i tag disponibili
     * @returns {Array}
     */
    function getLabels() {
        console.log("CALL: getLabels");

        if ($scope.data == null || $scope.data.length == 0) return [];

        var ris = [];
        var min = new Date($scope.stat.data.minDate);
        var max = new Date($scope.stat.data.maxDate);

        while (min < max) {
            ris.push( selectLabelDate(min) );
            min = selectStepDate(min);
        }

        //GVE - non si vede bene il time line
        ris.push( selectLabelDate(min) );
        min = selectStepDate(min);
        ris.push( selectLabelDate(min) );

        return ris;
    }

    function getDataset() {
        console.log("CALL: getDataset");

        var dataset = getDatasetValue();

        return [{
            label: "Tweets time line",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: dataset
        }];
    }

    function getDatasetValue() {

        console.log("CALL: getDatasetValue");

        if ($scope.data == null || $scope.data.length == 0) return [];

        var ris = [];
        var dataset = _.object( _.map( $scope.data, function(item){
            return [
                selectLabelDate( new Date(item.ts) ) ,
                item.count]
        }));

        //Inserisco le date mancanti
        var min = new Date($scope.stat.data.minDate);
        var max = new Date($scope.stat.data.maxDate);
        var key = null;
        while (min <= max) {
            key = selectLabelDate(min);
            if (dataset[key] == null)
                ris.push(0);
            else
                ris.push(dataset[key]);
            min = selectStepDate(min);
        }

        //lo rifaccio un'altra volta
        key = selectLabelDate(min);
        if (dataset[key] == null) ris.push(0);
        else ris.push(dataset[key]);

        return ris;
    }

    function showProjectError(){
        $spinner.hide();
        $msgProject.show();
    }

    $btnFilter.click(function(){

        console.log("CALL: clickFilter");

        setFuncNextDate();
        addWaitImg($imgFilter);
        setDisableAllBtn(true);

        var conditions = new ObjConditions(null, null, $cmbTags, null, $cmbUsers);

        conditions.setField("type", $scope.filter.type);

        DataCtrl.getFromUrl(DataCtrl.FIELD.DATABYDATE, conditions.getQueryString(), function(result){
            $scope.data = result;
            removeWaitImg($imgFilter);
            setDisableAllBtn(false);
            clearCanvas();
            drawTimeLine();
            console.log( $timeLine.width() );
            console.log( $timeLineContainer.width() );
            $scope.$apply();
        }, null);

    });

    if(!window.PROJECT || window.PROJECT == "")
        showProjectError();
    else
        getData();

    $(document).ready(function(){

    });

});