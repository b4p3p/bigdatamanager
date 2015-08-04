"use strict";

ngApp.controller('ngStatCloudCtrl', ['$scope', function($scope) {

    $scope.name = "ngStatCloudCtrl";

    $scope.resize = function()
    {
        setTimeout(function() {
            $(window).trigger('resize');
            if (mapCtrl && mapCtrl.mainMap)
                mapCtrl.mainMap.invalidateSize();
        }, 600);
    };

    //quando clicck sul menu devo disattivare sempre il timer dei dati
    $scope.onItemClick = function() {
        //clearInterval(intervalResize);
    };

    var FormCtrl = function(statWordCloudCtrl) {

        var _self = this;

        this.$radioUser = $("#radioUser")[0];
        this.$radioData = $("#radioData")[0];
        this.$radios = $("div.optType input");

        //evento per il cambio della legenda
        this.$radios.each(function() {
            $(this).click(function(e) {
                var selClass = this.className;
                $("p.optType").each(function() {
                    if($(this).hasClass(selClass) )
                        $(this).removeClass("hidden");
                    else
                        $(this).addClass("hidden");
                })
            })
        });

        this.$radios.change(function() {
            statWordCloudCtrl.setData(_self.getTypeData());
        });

        this.getTypeData = function() {
            return this.$radioUser.checked ? "syncUserTags" : "syncDataTags"
        }

    };

    var StatWordCloudCtrl = function() {

        var _self = this;

        this.vocabulary = null;
        this.wordCloudData = null;
        this.tagsBarData = null;
        this.wordBarData = null;
        this.fill = null;
        this.$wordCloud = $("#Tags");
        this.$tagsBarChart = $("#TagsBarChart");
        this.dictKey = {};

        this.formCtrl = new FormCtrl(this);

        this.loadData = function() {
            this.fill = d3.scale.category20();

            $.ajax({
                type: "get",
                crossDomain: true,
                dataType: "json",
                url: "/vocabulary/vocabulary",
                success: function (data) {
                    _self.removeWait();
                    _self.vocabulary = data;
                    _self.setData( _self.formCtrl.getTypeData() );
                },
                error: function (xhr, status, error) {
                    console.error("ERR: StatWordCloudCtrl.loadData " + status + " " + xhr.status);
                    console.error("     Status: " + status + " " + xhr.status);
                    console.error("     Error: " + error);
                }
            });
        };

        this.setData = function(type) {
            var data = this.vocabulary;

            this.wordCloudData = this.toWordCloudData(data, type);
            this.tagsBarData = this.toTagsBarData(data, type);
            this.wordBarData = this.toWordBarData(data, type);

            if(this.wordCloudData.length == 0){
                $("#container").hide();
                $("#msgDataNotAvaible").show();
            }else
            {
                $("#container").show();
                $("#msgDataNotAvaible").hide();

                this.drawCloud();
                this.drawTagsBar();
                this.drawWordBar();
            }

        };

        this.drawCloud = function () {

            var interval = this.getInterval(this.wordCloudData);
            var max = interval.max;
            var min = interval.min;
            var randomRotate = d3.scale.linear().domain([0, 1]).range([-20, 20]);
            var wordScale = d3.scale.linear().domain([min, max]).range([15, 100]);

            this.$wordCloud.empty();

            var container = $("#container");

            var w = container.width();
            var h = 250;
            this.$wordCloud.width(w);
            this.$wordCloud.height(h);

            d3.layout.cloud()
                .size([w , h])
                .words(this.wordCloudData)
                .rotate(function () {
                    return randomRotate(Math.random())
                })
                .font("Impact")
                .fontSize(function (d) {
                    return wordScale(d.size);
                })
                .on("end", this._drawCloud)
                .start();
        };

        this._drawCloud = function() {

            var container = $("#container");

            var w = container.width();
            var h = 250;

            var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            var wordG = d3.select("#Tags")
                .append("g")
                .attr("width", w)
                .attr("height", h)
                .attr("id", "wordCloudG")
                .attr("transform","translate(" + w/2 + "," + h/2 + ")");

            wordG.selectAll("text")
                .data(_self.wordCloudData)
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
                    return _self.fill(i);
                })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; })
                .on("mouseover", function(d, i)
                {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html(
                        '<div class="tip">Token: <b>' + d.text + '</b><br>Tag: <b>'
                        + _.keys(_self.dictKey[d.text]).join(', ')
                        + '</b><br>Occurrences: <b>' + d.size + '</b></div>'
                    )
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    d3.select(this).style("font-weight","bold");
                })
                .on("mouseout", function(d, i)
                {
                    d3.select(this).style("font-weight","normal");
                    $(".tip").addClass("hidden");
                });

        };

        this.drawTagsBar = function() {
            var data = google.visualization.arrayToDataTable( this.tagsBarData );
            var chartAreaHeight = data.getNumberOfRows() * 30;
            var chartHeight = chartAreaHeight + 80;
            var heightBar = 20; //60

            if(chartAreaHeight < 100) chartAreaHeight = 100;

            var options = {
                title: 'Tags occurrences',
                titleTextStyle: {fontSize: '15'},
                height: chartHeight,  //data.length * (heightBar - 10),
                chartArea: {
                    'height': chartAreaHeight,
                    'right':'0%',
                    'left': 100
                },
                width: "100%",
                bar: { groupWidth: heightBar  },
                legend: 'none',
                vAxis: {title:'Tags', textStyle:{
                    color: 'black',
                    fontSize: 13},
                    titleTextStyle:{ fontSize: 14 }
                },
                hAxis: {title:'Occurrences', textStyle:{
                    color: 'grey',
                    fontSize: 13},
                    titleTextStyle:{ fontSize: 14 }
                },
                backgroundColor: 'transparent',
                tooltip: { textStyle: {fontSize: 13}}
            };

            //$("#TagsBarChart").replaceWith('<div id="TagsBarChart"></div>');
            this.$tagsBarChart.empty();
            //$("#TagsBarChart").width = 500;
            var chart = new google.visualization.BarChart(document.getElementById("TagsBarChart"));
            chart.draw(data, options);
        };

        this.drawWordBar = function() {

            var w = $("#container").width();
            var data = google.visualization.arrayToDataTable(this.wordBarData);
            var chartAreaHeight = data.getNumberOfRows() * 30;
            var chartHeight = chartAreaHeight + 80;
            var heightBar = 60;
            var options = {
                title: 'Words occurrences',
                titleTextStyle: {fontSize: '15'},
                height: chartHeight,
                chartArea: {
                    'height': chartAreaHeight,
                    'width': '100%',
                    'right':'0%' ,
                    'top': '3%',
                    'left':100
                },
                width: "100%",
                bar: { groupWidth: heightBar + "%" },
                legend: 'none',
                vAxis: {title:'Words', textStyle:{
                    color: 'grey',
                    fontSize: 13},
                    titleTextStyle:{
                        fontSize: 14}
                },
                hAxis: {title:'Occurrences', textStyle:{
                    color: 'grey',
                    fontSize: 13},
                    titleTextStyle:{
                        fontSize: 14}
                },
                backgroundColor: 'transparent',
                tooltip: { textStyle: {fontSize: 13}}
            };
            var chart = new google.visualization.BarChart(document.getElementById("WordsBarChart"));
            chart.draw(data, options);
        };

        this.removeWait = function() {
            $("#spinner").addClass("hidden");
            $(".container").removeClass("hidden");
        };

        this.getInterval = function(data) {
            if(data.length == 0) return {max: 0, min:0};

            var max = data[0].size;
            var min = data[0].size;
            for(var d in data)
            {
                if(data[d].size > max) max = data[d].size;
                if(data[d].size < min) min = data[d].size;
            }

            return {max: max, min:min};
        };

        /**
         *
         * @param vocabulary
         * @returns {Array} - [{text:{String}, size: Number}, {..}, ... ]}
         */
        this.toWordCloudData = function(vocabulary, type) {

            var ris = [];

            if(!vocabulary) return ris;

            var data = vocabulary[type];

            _.each(data, function(tag) {
                var counter = tag.counter;
                _.each(counter, function(c){

                    if(_self.dictKey[c.token] == null)
                        _self.dictKey[c.token] = {};

                    if(_self.dictKey[c.token][tag.tag] == null)
                        _self.dictKey[c.token][tag.tag] = true;

                    var obj = {
                        text: c.token,
                        size: c.count
                    };
                    ris.push(obj);
                });
            });

            return ris;

        };

        this.toTagsBarData = function(vocabulary, type) {
            var ris = [];
            var count = 0;

            if(!vocabulary) return ris;

            var data = vocabulary[type];

            ris[0] = ["Tags", "Occurrences", { role: "style" } ];

            _.each( data, function(row) {
                var sum = _self.getTot(row.counter);
                var tag = row.tag;
                if( tag == null ) tag = "undefined";
                ris.push([tag, sum, _self.fill(count)]);
                count+=1;
            });

            return ris;
        };

        this.toWordBarData = function(vocabulary, type) {
            var ris = [];

            ris[0] = ["Words", "Occurrences", { role: "style" } ];

            if(!vocabulary) return ris;

            var data = vocabulary[type];
            var count = 0;

            _.each(data, function(row){
                var counter = row.counter;
                _.each(counter, function(row){
                    ris.push( [ row.token, row.count, _self.fill(count) ]);
                });
                count += 1;
            });

            return ris;
        };

        this.getTot = function(counter) {
            var sum = 0;
            _.each(counter, function(word){
                sum+=word.count
            });
            return sum;
        };

        this.loadData();
    };

    var radio = document.querySelectorAll('.NameHighlights');

    for (var i = radio.length; i--;) {
        (function () {
            var t;
            radio[i].onmouseover = function () {
                hideAll();
                clearTimeout(t);
                this.className = 'NameHighlightsHover';
            };
            radio[i].onmouseout = function () {
                var self = this;
                t = setTimeout(function () {
                    self.className = 'NameHighlights';
                }, 300);
            };
        })();
    }

    function hideAll() {
        for (var i = radio.length; i--;) {
            radio[i].className = 'NameHighlights';
        }
    };

    $(document).ready(function(){
        var statWordCloudCtrl = new StatWordCloudCtrl();
    });

}]);