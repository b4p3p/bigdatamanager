"use strict";

var FormCtrl = function()
{
    this.$radioUser = $("#radioUser")[0];
    this.$radioData = $("#radioData")[0];
    this.$radios = $("div.radio input");

    //evento per il cambio della legenda
    this.$radios.each(function(){
        $(this).click(function(e){
            var selClass = this.className;
            $("p.radio").each(function(){
                if($(this).hasClass(selClass) )
                    $(this).removeClass("hidden");
                else
                    $(this).addClass("hidden");
            })
        })
    });

    this.$radios.change(function(){
        StatWordCloudCtrl.setData(formCtrl.getTypeData());
    });

    this.getTypeData = function()
    {
        return this.$radioUser.checked ? "syncUserTags" : "syncDataTags"
    }

};
var formCtrl = new FormCtrl();

var StatWordCloudCtrl = {

    vocabulary : null,
    wordCloudData: null,
    tagsBarData: null,
    wordBarData: null,
    fill : null,
    $wordCloud : $("#Tags"),
    $tagsBarChart : $("#TagsBarChart"),

    loadData: function()
    {
        StatWordCloudCtrl.fill = d3.scale.category20();

        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "/vocabulary/vocabulary",
            success: function (data) {
                StatWordCloudCtrl.removeWait();
                StatWordCloudCtrl.vocabulary = data;
                StatWordCloudCtrl.setData(formCtrl.getTypeData());
            },
            error: function (xhr, status, error) {
                console.error("ERR: StatWordCloudCtrl.loadData " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    setData: function(type)
    {
        var data = StatWordCloudCtrl.vocabulary;
        StatWordCloudCtrl.wordCloudData = toWordCloudData(data, type);
        StatWordCloudCtrl.tagsBarData = toTagsBarData(data, type);
        StatWordCloudCtrl.wordBarData = toWordBarData(data, type);
        StatWordCloudCtrl.drawCloud();
        StatWordCloudCtrl.drawTagsBar();
        StatWordCloudCtrl.drawWordBar();

    },

    drawCloud: function ()
    {
        var interval = getInterval(StatWordCloudCtrl.wordCloudData);
        var max = interval.max;
        var min = interval.min;
        var randomRotate = d3.scale.linear().domain([0, 1]).range([-20, 20]);
        var wordScale = d3.scale.linear().domain([min, max]).range([15, 100]);

        this.$wordCloud.empty();

        //var container = this.$wordCloud;
        var container = $("#container");

        //$(container).replaceWith('<svg id="Tags" ></svg>');

        var w = container.width();
        var h = 400;
        this.$wordCloud.width(w);
        this.$wordCloud.height(h);

        d3.layout.cloud()
            .size([w , h])
            .words(StatWordCloudCtrl.wordCloudData)
            .rotate(function () {
                return randomRotate(Math.random())
            })
            .font("Impact")
            .fontSize(function (d) {
                return wordScale(d.size);
            })
            .on("end", this._drawCloud)
            .start();
    },

    _drawCloud: function() {

        //var cont = 0;

        //var container = $("#Tags");

        var container = $("#container");

        var w = container.width();
        var h = 400;

        var wordG = d3.select("#Tags")
            .append("g")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "wordCloudG")
            .attr("transform","translate(" + w/2 + "," + h/2 + ")");

        wordG.selectAll("text")
            .data(StatWordCloudCtrl.wordCloudData)
            .enter()
            .append("text")
            //.attr("transform", function(d) {
            //    try
            //    {
            //        var str = "translate(" + [d.x, d.y] + ");rotate(" + d.rotate + ")";
            //        console.log("sono qui");
            //        return str
            //    }catch(e)
            //    {
            //        console.log(e);
            //    }
            //})

            .style("font-size", function(d)
            {
                //cont += 1;
                //console.log(cont);
                return d.size + "px";
            })
            .style("cursor", "default")
            .style("z-index", 20)
            .style("background", "#000000")
            .style("font-family", "Impact")
            .style("fill", function(d, i) {
                return StatWordCloudCtrl.fill(i);
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; })
            .on("mouseover", function(d, i)
            {
                //var tag = StatWordCloudCtrl.wordCloudData[d.text];
                //var value = statController.wordsOccurr[tag][d.text];
                ////alert("text: " + d.text + "; size: " + value + "; tag: " + tag );
                //div.transition()
                //    .duration(200)
                //    .style("opacity", .9);
                //div.html(
                //    '<div class="tip">Tag: <b>' + tag + '</b><br>Occurrences: <b>' + value + '</b></div>'
                //)
                //    .style("left", (d3.event.pageX) + "px")
                //    .style("top", (d3.event.pageY - 28) + "px");
                //d3.select(this).style("font-weight","bold");
            })
            .on("mouseout", function(d, i)
            {
                d3.select(this).style("font-weight","normal");
                $(".tip").addClass("hidden");
            });

    },

    drawTagsBar: function()
    {
        var heightBar = 60;
        var data = google.visualization.arrayToDataTable( StatWordCloudCtrl.tagsBarData );
        var options = {
            title: 'Tags occurrences',
            titleTextStyle: {fontSize: '18'},
            height: data.length * (heightBar - 10),
            chartArea: {
                'height': '70%',
                'right':'0%',
                'left':'20%'
            },
            width: "100%",
            bar: { groupWidth: heightBar + "%" },
            legend: 'none',
            axisTitlesPosition: 'in',
            vAxis: {title:'Tags', textStyle:{
                color: 'black',
                fontSize: 15},
                titleTextStyle:{
                    fontSize: 15
                }
            },
            hAxis: {title:'Occurrences', textStyle:{
                color: 'grey',
                fontSize: 12},
                titleTextStyle:{
                    fontSize: 15
                }
            },
            backgroundColor: 'transparent'
        };

        //$("#TagsBarChart").replaceWith('<div id="TagsBarChart"></div>');
        $("#TagsBarChart").empty();
        //$("#TagsBarChart").width = 500;
        var chart = new google.visualization.BarChart(document.getElementById("TagsBarChart"));
        chart.draw(data, options);
    },

    drawWordBar: function()
    {
        var w = $("#container").width();
        var heightBar = 60;
        var data = google.visualization.arrayToDataTable(StatWordCloudCtrl.wordBarData);
        var options = {
            title: 'Words occurrences',
            titleTextStyle: {fontSize: '15'},
            height: StatWordCloudCtrl.wordBarData.length * (heightBar-30),
            chartArea: {
                'height': '100%',
                'width': '100%',
                'right':'0%' ,
                'top': '3%',
                'left':'20%'
            },
            width: "100%",
            bar: { groupWidth: heightBar + "%" },
            legend: 'none',
            axisTitlesPosition: 'in',
            vAxis: {title:'Words', textStyle:{
                color: 'grey',
                fontSize: 13},
                titleTextStyle:{
                    fontSize: 15}
            },
            hAxis: {title:'Occurrences', textStyle:{
                color: 'grey',
                fontSize: 12},
                titleTextStyle:{
                    fontSize: 15}
            },
            backgroundColor: 'transparent'
        };
        var chart = new google.visualization.BarChart(document.getElementById("WordsBarChart"));
        chart.draw(data, options);
    },

    removeWait: function()
    {
        $("#spinner").addClass("hidden");
        $("#container").removeClass("hidden");
    }
};

function getInterval(data)
{
    if(data.length == 0) return {max: 0, min:0};

    var max = data[0].size;
    var min = data[0].size;
    for(var d in data)
    {
        if(data[d].size > max) max = data[d].size;
        if(data[d].size < min) min = data[d].size;
    }

    return {max: max, min:min};
}

/**
 *
 * @param vocabulary
 * @returns {Array} - [{text:{String}, size: Number}, {..}, ... ]}
 */
function toWordCloudData(vocabulary, type)
{
    var ris = [];
    var data = vocabulary[type];

    _.each(data, function(tag){
        var counter = tag.counter;
        _.each(counter, function(c){
            var obj = {
                text: c.token,
                size: c.count
            };
            ris.push(obj);
        });
    });

    return ris;

}

function toTagsBarData(vocabulary, type)
{
    var ris = [];
    var count = 0;
    var data = vocabulary[type];

    ris[0] = ["Tags", "Occurrences", { role: "style" } ];

    _.each( data, function(row) {
        var sum = getTot(row.counter);
        var tag = row.tag;
        if( tag == null ) tag = "undefined";
        ris.push([tag, sum, StatWordCloudCtrl.fill(count)]);
        count+=1;
    });

    return ris;
}

function toWordBarData(vocabulary, type)
{
    var ris = [];
    var data = vocabulary[type];
    var count = 0;

    ris[0] = ["Words", "Occurrences", { role: "style" } ];

    _.each(data, function(row){
        var counter = row.counter;
        _.each(counter, function(row){
            ris.push( [ row.token, row.count, StatWordCloudCtrl.fill(count) ]);
        });
        count += 1;
    });

    return ris;
}

function getTot(counter) {
    var sum = 0;
    _.each(counter, function(word){
        sum+=word.count
    });
    return sum;
}