"use strict";

ngApp.controller('ngStatTimeLineCtrl', ['$scope', function($scope) {

    function getDateOfWeek(w, y) {
        var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
        return new Date(y, 0, d);
    }

    var GraphBuilder = function(timeLineCtrl){

        var _self = this;

        this.timeLineCtrl = timeLineCtrl;

        this.selectLabelDate = function (date)  {};
        this.selectStepDate = function(date)    {};

        this.setFuncNextDate = function () {
            if(this.timeLineCtrl.$radioDays.is(':checked'))
            {
                this.selectLabelDate = function (date) { return date.toShortDate();};
                this.selectStepDate = function(date) { return date.nextDay();};
                this.timeLineCtrl.type = "day";
            }
            if(this.timeLineCtrl.$radioWeeks.is(':checked'))
            {
                this.selectLabelDate = function (date) {
                    var xdate = new XDate(date);
                    var week = xdate.getWeek();
                    var d = new XDate(getDateOfWeek(week, xdate.getFullYear()));
                    return d.toString("dd-MM-yyyy");
                    //return date.toShortWeek()
                };
                this.selectStepDate = function(date) {
                    var xdate = new XDate(date);
                    return new Date(xdate.addWeeks(1).getTime());

                    //var nextWeek =  date.getRangeWeek().start.nextWeek();
                    //return nextWeek;
                };
                this.timeLineCtrl.type = "week";
            }
            if(this.timeLineCtrl.$radioMonths.is(':checked'))
            {
                this.selectLabelDate = function (date) { return  date.getMonthString() + "-" + date.getFullYear()};
                this.selectStepDate = function(date) { return date.nextMonth()};
                this.timeLineCtrl.type = "month";
            }
        };

        this.setFuncNextDate();

    };

    var TimeLineCtrl = function() {

        var _self = this;

        this.lineOptions = {
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

        this.type = "day";  // "day" || "week" || "month"
        this.users = null;
        this.tags = null;

        this.$radioDays = $('#radioDays');
        this.$radioWeeks = $('#radioWeeks');
        this.$radioMonths = $('#radioMonths');

        this.$cmbUsers = $('#cmbUsers');
        this.$cmbTags = $('#cmbTags');

        this.$btnFilter = $('#btnFilter');
        this.$btnRestore = $('#btnRestore');

        this.$imgFilter = $("#img-filter");

        this.$timeLineContainer = $('#timeLineContainer');
        this.$timeLine = $('#timeLine');

        this.$spinner = $('#spinner');
        this.$msgProject = $('#msgProject');

        this.timeLineID = "timeLine";

        this.graphBuilder = new GraphBuilder(this);

        this.getData = function() {

            console.log("CALL: getData");

            async.parallel({
                    data: function(next) {
                        DataCtrl.getFromUrl(DataCtrl.FIELD.DATABYDATE, null, function(result){
                            _self.data = result;
                            next(null, result);
                        });
                    },
                    stat: function(next) {
                        DataCtrl.getField( function(doc){
                            _self.tags = doc.data.allTags;
                            _self.stat = doc;
                            next(null, doc);
                        }, DataCtrl.FIELD.STAT );
                    },
                    users: function (next) {
                        DataCtrl.getField( function(doc){
                            _self.users = doc;
                            next(null, doc);
                        }, DataCtrl.FIELD.USERS, 50);
                    }},
                function(err, results) {
                    _self.initComboTags();
                    _self.initComboUsers();
                    _self.removeWait();
                    _self.drawTimeLine();
                }
            );
        };

        this.initComboTags = function() {
            console.log("CALL: initComboTags");

            _.each(_self.tags, function(obj){
                DomUtil.addOptionValue(_self.$cmbTags, obj);
            });
            _self.$cmbTags.selectpicker('refresh');
        };

        this.initComboUsers = function() {
            console.log("CALL: initComboUsers");

            var obj = null;
            for (var i = 0; i < 50 && i < _self.users.length; i++ )
            {
                obj = _self.users[i];
                DomUtil.addOptionValue(_self.$cmbUsers, obj.user, obj.sum);
            }
            _self.$cmbUsers.selectpicker('refresh');
        };

        this.removeWait = function () {

            console.log("remove wait");

            $("#spinner").addClass("hidden");
            $(".timecontent").removeClass("hidden");
        };

        this.addWaitImg = function($img){
            $img.removeClass("glyphicon glyphicon-filter");
            $img.addClass("fa fa-spinner fa-spin");
        };

        this.removeWaitImg = function($img){
            $img.removeClass("fa fa-spinner fa-spin");
            $img.addClass("glyphicon glyphicon-filter");
        };

        this.clearCanvas = function() {
            this.$timeLineContainer.replaceWith(
                '<div id="timeLineContainer" class="timecontent hidden">' +
                '<canvas id="timeLine"></canvas>' +
                '</div>');

            this.$timeLineContainer = $('#timeLineContainer');
            this.$timeLine = $('#timeLine');
        };

        this.setDisableAllBtn = function(value){
            _self.$btnFilter.prop("disabled", value);
            _self.$btnRestore.prop("disabled", value);
        };

        this.drawTimeLine = function(){

            console.log("CALL: drawTimeLine");

            var dataset = _self.toLineData();
            var scale = 20;

            _self.$timeLineContainer.removeClass('hidden');
            _self.$timeLineContainer.css("overflow-x", "auto");

            if(_self.$radioWeeks.is(':checked'))
                scale = 50;
            if(_self.$radioMonths.is(':checked'))
                scale = 100;

            $("#" + this.timeLineID).width(scale * dataset.datasets[0].data.length);

            var hc = $('body > .container').height();
            var htop = $('#formType').height();
            var hmin = hc - htop - 30;
            $("#" + _self.timeLineID).css('max-height', hmin);

            var ctx = document.getElementById(_self.timeLineID).getContext("2d");
            _self.timeLineChart = new Chart(ctx);
            _self.timeLineLine = _self.timeLineChart.Line(dataset, _self.lineOptions );
        };

        this.toLineData = function () {
            console.log("CALL: toLineData");
            return {
                labels: _self.getLabels(),
                datasets: _self.getDataset()
            };
        };

        /* Usa la prima regione per vedere i tag disponibili
         * @returns {Array}
         */
        this.getLabels = function () {
            console.log("CALL: getLabels");

            if (_self.data == null || _self.data.length == 0) return [];

            var ris = [];
            var min = new Date(_self.stat.data.minDate);
            var max = new Date(_self.stat.data.maxDate);

            while (min < max) {
                ris.push( this.graphBuilder.selectLabelDate(min) );
                min = this.graphBuilder.selectStepDate(min);
            }

            //GVE - non si vede bene il time line
            ris.push( this.graphBuilder.selectLabelDate(min) );
            min = this.graphBuilder.selectStepDate(min);
            if(this.$radioDays.is(':checked')){
                ris.push( this.graphBuilder.selectLabelDate(min) );
                min = this.graphBuilder.selectStepDate(min);
            }

            return ris;
        };

        this.getDataset = function () {
            console.log("CALL: getDataset");

            var dataset = this.getDatasetValue();

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
        };

        this.getDatasetValue = function () {

            console.log("CALL: getDatasetValue");

            if (this.data == null || this.data.length == 0) return [];

            var ris = [];
            var dataset = _.object( _.map( this.data, function(item){
                return [
                    _self.graphBuilder.selectLabelDate( new Date(item.ts) ) ,
                    item.count]
            }));

            //var dataset = _.groupBy(this.data, function(obj){
            //    return _self.graphBuilder.selectLabelDate( new Date(obj.date));
            //});

            //Inserisco le date mancanti
            var min = new Date(this.stat.data.minDate);
            var max = new Date(this.stat.data.maxDate);
            while (min <= max) {
                var key = _self.graphBuilder.selectLabelDate(min);
                if (dataset[key] == null)
                    ris.push(0);
                else
                    ris.push(dataset[key]);
                min = _self.graphBuilder.selectStepDate(min);
            }
            //GVE
            ris.push(0);
            if(this.$radioDays.is(':checked')) ris.push(0);

            return ris;
        };

        this.showProjectError = function(){
            this.$spinner.hide();
            this.$msgProject.show();
        };

        this.$btnFilter.click(function(){

            console.log("CALL: clickFilter");

            _self.graphBuilder.setFuncNextDate();
            _self.addWaitImg(_self.$imgFilter);
            _self.setDisableAllBtn(true);

            var conditions = new ObjConditions(
                null, null, _self.$cmbTags,
                null, _self.$cmbUsers);

            conditions.setField("type", _self.type);

            DataCtrl.getFromUrl(DataCtrl.FIELD.DATABYDATE, conditions.getQueryString(), function(result){
                _self.data = result;
                _self.removeWaitImg(_self.$imgFilter);
                _self.setDisableAllBtn(false);
                _self.clearCanvas();
                _self.drawTimeLine();

                console.log( _self.$timeLine.width() );
                console.log( _self.$timeLineContainer.width() );
            });

        });

        if(!window.PROJECT || window.PROJECT == "")
            this.showProjectError();
        else
            this.getData();

    };

    $(document).ready(function(){
        var timeLineCtrl = new TimeLineCtrl();
    });

}]);