"use strict";
var StatWordCloudCtrl = {

    vocabulary : null,
    wordCloudData: null,
    tagsBarData: null,
    wordBarData: null,
    fill : null,

    loadData: function()
    {
        StatWordCloudCtrl.fill = d3.scale.category20();

        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "http://localhost:8080/vocabulary/vocabulary",
            success: function (data) {
                StatWordCloudCtrl.vocabulary = data;
                StatWordCloudCtrl.removeWait();
                StatWordCloudCtrl.wordCloudData = toWordCloudData(data);
                StatWordCloudCtrl.tagsBarData = toTagsBarData(data);
                StatWordCloudCtrl.wordBarData = toWordBarData(data);
                StatWordCloudCtrl.drawCloud();
                StatWordCloudCtrl.drawTagsBar();
                StatWordCloudCtrl.drawWordBar();

            },
            error: function (xhr, status, error) {
                console.error("ERR: StatWordCloudCtrl.loadData " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    drawCloud: function ()
    {
        var interval = getInterval(StatWordCloudCtrl.wordCloudData);
        var max = interval.max;
        var min = interval.min;
        var randomRotate = d3.scale.linear().domain([0, 1]).range([-20, 20]);
        var wordScale = d3.scale.linear().domain([min, max]).range([15, 100]);

        var container = $("#Tags");
        var w = container.width();
        var h = container.height();

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
            .on("end", _drawCloud)
            .start();
    },

    removeWait: function()
    {
        $("#spinner").addClass("hidden");
        $("#container").removeClass("hidden");
    },

    drawTagsBar: function()
    {
        var heightBar = 60;
        var data = google.visualization.arrayToDataTable( StatWordCloudCtrl.tagsBarData );
        var options = {
            title: 'Tags occurrences',
            titleTextStyle: {fontSize: '18'},
            width: "100%",
            height: data.length * (heightBar - 10),
            chartArea: {
                'height': '70%',
                'right':'0%',
                'left':'20%'
            },
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

        $("#TagsBarChart").replaceWith('<div id="TagsBarChart"></div>');
        var chart = new google.visualization.BarChart(document.getElementById("TagsBarChart"));
        chart.draw(data, options);
    },

    drawWordBar: function()
    {
        var heightBar = 60;
        var data = google.visualization.arrayToDataTable(StatWordCloudCtrl.wordBarData);
        var options = {
            title: 'Words occurrences',
            titleTextStyle: {fontSize: '15'},
            width: "100%",
            height: StatWordCloudCtrl.wordBarData.length * (heightBar-30),
            chartArea: {
                'height': '80%',
                'right':'0%' ,
                'top': '3%',
                'left':'20%'
            },
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
    }
};

function getInterval(data)
{
    var max = data[0].size;
    var min = data[0].size;
    for(var d in data)
    {
        if(data[d].size > max) max = data[d].size;
        if(data[d].size < min) min = data[d].size;
    }

    return {max: max, min:min};
}

function _drawCloud() {

    //var cont = 0;
    var container = $("#Tags");
    var w = container.width();
    var h = container.height();

    //var div = d3.select("body").append("div")
    //    .attr("class", "tooltip")
    //    .style("opacity", 0);

    var wordG = d3.select("#Tags")
        .append("g")
        .attr("width", w+50)
        .attr("height", h+50)
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

}

/**
 *
 * @param data
 * @returns {Array} - [{text:{String}, size: Number}, {..}, ... ]}
 */
function toWordCloudData(data)
{
    var ris = [];

    for(var t in data)
    {
        var counter = data[t].counter;
        for(var w in counter) {
            var obj = {
                text: w,
                size: counter[w]
            };
            ris.push(obj);
        }
    }

    return ris;

}

function toTagsBarData(data)
{
    var ris = [];
    var count = 0;
    ris[0] = ["Tags", "Occurrences", { role: "style" } ];

    for(var r in data)
    {
        ris.push([data[r].tag, totCount(data[r].counter),StatWordCloudCtrl.fill(count)]);
        count+=1;
    }
    return ris;
}

function totCount(counter)
{
    var ris = 0;
    for(var t in counter)
        ris += counter[t];
    return ris;
}

function toWordBarData(data)
{
    var ris = [];
    var count = 0;
    ris[0] = ["Words", "Occurrences", { role: "style" } ];
    for(var r in data)
    {
        var counter = data[r].counter;
        for(var w in counter)
            ris.push( [ w, counter[w], StatWordCloudCtrl.fill(count) ]);

        count += 1;
    }
    return ris;
}