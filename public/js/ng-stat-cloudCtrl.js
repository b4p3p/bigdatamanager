"use strict";

ngApp.controller('ngStatCloudCtrl', ['$scope', function($scope) {

    var $cmbSelectWord = $("#selectWord");
    var $radioUser = $("#radioUser")[0];
    var $radioData = $("#radioData")[0];
    var $radios = $(".radios");
    var $wordCloud = $("#Tags");
    var $tagsBarChart = $("#TagsBarChart");
    var $cmbTags = $("#cmbTags");
    var $btnFilterTag = $("#btnFilterTag");
    var graphContainer = $("#graphContainer");
    
    var vocabulary = null;
    var wordCloudData = null;
    var tagsBarData = null;
    var wordBarData = null;
    var fill = null;
    var dictKey = {};
    var classNameLegend = '';

    $cmbTags.multiselect();

    /**
     *  Analizzo la parola cliccata con le altre parole nel dizionario
     */
    $scope.cmbAnalyzeWord_Click = function(){

        var word = $cmbSelectWord.val();
        word = encodeURIComponent(word);

        DataCtrl.getFromUrl( DataCtrl.FIELD.DATABIGRAM, "?word=" + word, function(result){
            var data = google.visualization.arrayToDataTable( toBigramAnalysisdata(result) );
            var chartAreaHeight = data.getNumberOfRows() * 30;
            var chartHeight = chartAreaHeight + 80;
            var heightBar = 60;
            var options = {
                title: 'Bigram Analysis',
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
                vAxis: {
                    title:'Words',
                    textStyle:{ color: 'grey', fontSize: 13},
                    titleTextStyle:{fontSize: 14}
                },
                hAxis: {
                    title:'Occurrences', textStyle:{
                        color: 'grey',
                        fontSize: 13},
                    titleTextStyle:{fontSize: 14}
                },
                backgroundColor: 'transparent',
                tooltip: { textStyle: {fontSize: 13}}
            };
            var chart = new google.visualization.BarChart(document.getElementById("BigramAnalysisChart"));
            chart.draw(data, options);
        })
    };

    $scope.stat = {};

    $scope.isSync = true;

    function getStat() {
        DataCtrl.getFromUrl(DataCtrl.FIELD.STAT, null, function(result){
            $scope.stat = result;
            _.each($scope.stat.data.allTags, function(tag){
                DomUtil.addOptionValue($cmbTags, tag);
            });
            $cmbTags.multiselect('rebuild');
            DomUtil.selectAll($cmbTags);
            $cmbTags.multiselect('refresh');
        }, null);
    }

    function loadData() {

        fill = d3.scale.category20();

        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "/vocabulary/vocabulary",
            success: function (data) {
                removeWait();
                vocabulary = data;
                setData( getTypeData() );
            },
            error: function (xhr, status, error) {
                console.error("ERR: StatWordCloudCtrl.loadData " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    }

    function setData(type, tags) {

        console.log( JSON.stringify(tags));

        var data = vocabulary;

        if( data )
        {
            wordCloudData = toWordCloudData(data, type, tags);
            tagsBarData = toTagsBarData(data, type, tags);
            wordBarData = toWordBarData(data, type, tags);

            loadWordsInBigram( data[getTypeData()] );
        }

        if( (!data || wordCloudData.length == 0) &&
             !tags )
        {
            //i dati non sono sincronizzati
            $scope.$apply(function(){
                $scope.isSync = false;
            });

            $(".itemContent").hide();
            $("#msgDataNotAvaible").show();
        }
        else
        {
            $(".itemContent").show();
            $("#msgDataNotAvaible").hide();
            $(".containerRadio").removeClass("hidden");

            drawCloud();
            drawTagsBar();
            drawWordBar();
        }

    }

    function drawCloud() {

        var interval = getInterval(wordCloudData);
        var max = interval.max;
        var min = interval.min;
        var randomRotate = d3.scale.linear().domain([0, 1]).range([-20, 20]);
        var wordScale = d3.scale.linear().domain([min, max]).range([15, 100]);

        $wordCloud.empty();

        var w = graphContainer.width();
        var h = 250;
        $wordCloud.width(w);
        $wordCloud.height(h);

        d3.layout.cloud()
            .size([w , h])
            .words(wordCloudData)
            .rotate(function () {
                return randomRotate(Math.random())
            })
            .font("Impact")
            .fontSize(function (d) {
                return wordScale(d.size);
            })
            .on("end", _drawCloud)
            .start();
    }

    function _drawCloud() {

        graphContainer = $('#graphContainer');

        var w = graphContainer.width();
        var h = 250;

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0.5);

        var wordG = d3.select("#Tags")
            .append("g")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "wordCloudG")
            .attr("transform","translate(" + w/2 + "," + h/2 + ")");

        wordG.selectAll("text")
            .data(wordCloudData)
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
                    .style("opacity", 0.9);

                //

                div.html(
                    '<div class="tip">Token: <b>' + d.text + '</b><br>Tag: <b>'
                    + _.keys(dictKey[d.text]).join(', ')
                    + '</b><br>Occurrences: <b>' + d.size + '</b></div>'
                )
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");

                d3.select(this).style("font-weight","bold");
            })
            .on("mouseout", function()
            {
                d3.select(this).style("font-weight","normal");
                $(".tip").addClass("hidden");
            });
    }

    function drawTagsBar() {

        var data = google.visualization.arrayToDataTable( tagsBarData );
        var chartAreaHeight = data.getNumberOfRows() * 30;
        var chartHeight = chartAreaHeight + 80;

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
            bar: {
                groupWidth: 20
            },
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
        $tagsBarChart.empty();
        //$("#TagsBarChart").width = 500;
        var chart = new google.visualization.BarChart(document.getElementById("TagsBarChart"));
        chart.draw(data, options);
    }

    function drawWordBar() {

        var data = google.visualization.arrayToDataTable(wordBarData);
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
    }

    function removeWait() {
        $("#spinner").addClass("hidden");
        $(".itemContent").removeClass("hidden");
        $("#containerRadio").removeClass("hidden");
    }

    function getInterval(data) {

        if(data.length == 0)return {max: 0, min:0};

        var max = data[0].size;
        var min = data[0].size;

        _.each( data, function(d){
            if(d.size > max) max = d.size;
            if(d.size < min) min = d.size;
        });

        return {max: max, min:min};
    }

    /**
     * @param type
     * @param vocabulary
     * @returns {Array} - [{text:{String}, size: Number}, {..}, ... ]}
     */
    function toWordCloudData(vocabulary, type, tags) {

        var ris = [];

        if(!vocabulary) return ris;

        var data = vocabulary[type];

        if(data)
        for(var i = 0; i< data.length; i++ )
        {
            var objTag = data[i];

            //prende solo i tag selezionati
            if(tags && tags.indexOf(objTag.tag) == -1 ) continue;

            var counter = objTag.counter;
            _.each(counter, function(c){

                if(dictKey[c.token] == null)
                    dictKey[c.token] = {};

                if(dictKey[c.token][objTag.tag] == null)
                    dictKey[c.token][objTag.tag] = true;

                var obj = {
                    text: c.token,
                    size: c.count
                };
                ris.push(obj);
            });
        }
        return ris;
    }

    function toTagsBarData(vocabulary, type, tags) {

        var ris = [];
        var count = 0;

        if(!vocabulary) return ris;

        var data = vocabulary[type];

        ris[0] = ["Tags", "Occurrences", { role: "style" } ];

        if(data)
        for(var i = 0; i< data.length; i++ )
        {
            var row = data[i];

            //prende solo i tag selezionati
            if(tags && tags.indexOf(row.tag) == -1 ) continue;

            var sum = getTot(row.counter);
            var tag = row.tag;
            if( tag == null ) tag = "undefined";
            ris.push([tag, sum, fill(count)]);
            count+=1;
        }

        return ris;
    }

    function toWordBarData(vocabulary, type, tags) {
        var ris = [];

        ris[0] = ["Words", "Occurrences", { role: "style" } ];

        if(!vocabulary) return ris;

        var data = vocabulary[type];
        var count = 0;

        if(data)
        for(var i = 0; i< data.length; i++ )
        {
            var row = data[i];

            //prende solo i tag selezionati
            if(tags && tags.indexOf(row.tag) == -1 ) continue;

            var counter = row.counter;

            _.each(counter, function(row){
                ris.push( [ row.token, row.count, fill(count) ]);
            });

            count += 1;
        }

        return ris;
    }

    function getTot(counter) {
        var sum = 0;
        _.each(counter, function(word){
            sum+=word.count
        });
        return sum;
    }

    /**
     *  Imposta i popup delle option button
     */
    function setPopupOption(){

        var radio = document.querySelectorAll('.NameHighlights');

        for (var i = radio.length; i--;) {
            (function () {
                var t;
                radio[i].onmouseover = function () {
                    hideAll();
                    clearTimeout(t);
                    classNameLegend = 'NameHighlightsHover';
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
        }
    }

    /**
     *  In base alla option selezionata restituisce la chiava da cui prendere i dati
     * @returns {string}
     */
    function getTypeData(){
        if($("#radioUser")[0] == null)
            return "";
        return $("#radioUser")[0].checked ? "syncUserTags" : "syncDataTags"
    }

    /**
     *  Carica le parole per l'analisi dei bigrammi
     */
    function loadWordsInBigram(data, tags) {
        _.each( data , function(objTag){
            _.each( objTag.counter , function(objCounter) {
                DomUtil.addOptionValue($cmbSelectWord, objCounter.token);
            });
        });
        $cmbSelectWord.selectpicker("refresh");
    }

    function toBigramAnalysisdata(rowdata){
        var ris = [];
        ris[0] = ["Words", "Occurrences" ];
        for(var i = 0; i<20 && i<rowdata.length; i++)
        {
            ris.push( [ rowdata[i].text, rowdata[i].size ]);
        }
        return ris;
    }

    /**
     *  EVENTI
     */

    /**
     *  Cambio della legenda
     */
    $radios.each(function() {
        $(this).click(function(e) {
            var selClass = classNameLegend;
            $("p.optType").each(function() {
                if($(this).hasClass(selClass) )
                    $(this).removeClass("hidden");
                else
                    $(this).addClass("hidden");
            })
        })
    });

    /**
     *  Imposta nuovamente tutti i dati
     */
    $radios.change(function() {
        $(".containerRadio").addClass("hidden");
        setData( getTypeData() );
    });
    //
    //$scope.radioSelected = "";
    //
    //$scope.radioChange = function(){
    //  console.log($scope.radioSelected)  ;
    //};

    /**
     * Filtra i dati per tag
     */
    $btnFilterTag.click(function(){
        var tags = $cmbTags.val() == null ? [] : $cmbTags.val();
        setData( getTypeData() , tags );
    });

    $(document).ready(function(){
        setPopupOption();
        loadData();
        getStat();
        $(".selectpicker").selectpicker();

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
        }
    });

}]);