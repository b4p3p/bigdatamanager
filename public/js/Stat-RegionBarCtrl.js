RegionBarCtrl = {

    regions: null,
    tags: null,
    cmbType: null,
    container: null,
    contFn:0,

    init: function()
    {
        this.cmbType = $('#cmbVisualizationMode');
        this.container = $('#regionsBar');
        $(this.cmbType).on('change', function(){
            RegionBarCtrl.drawRegionsBar();
        });
    },

    drawRegionsBar: function()
    {
        this.removeWait();

        var heightBar = 60;
        var data = [];
        data[0] = this.getHeader();
        data = this.appendRows(data);

        var dataTable = google.visualization.arrayToDataTable(data);

        var options = {
            width: "100%",
            height: dataTable.getNumberOfRows() * heightBar,
            legend: { position: 'top',  maxLines: 3 },
            bar:    { groupWidth: heightBar + "%" },
            annotations: {
                alwaysOutside: true,
                textStyle:  { color: "black" },
                isHtml: true
            },
            chartArea: {'height': '80%', 'right':'0%'},
            isStacked: true,
            backgroundColor: 'transparent'
        };

        var view = new google.visualization.DataView(dataTable);
        var e = document.getElementById("regionsBar");
        var chart = new google.visualization.BarChart(e);
        chart.draw(view, options);
    },

    getData:function()
    {
        this.contFn = 2;
        this.getRegions();
        this.getTags();
    },

    getRegions:function()
    {
        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "/getregions",
            success: function (data) {
                RegionBarCtrl.regions = data;

                RegionBarCtrl.contFn--;
                if (RegionBarCtrl.contFn == 0)
                    RegionBarCtrl.drawRegionsBar();
            },
            error: function (xhr, status, error) {
                console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    getTags:function()
    {
        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "/gettags",
            success: function (data) {

                RegionBarCtrl.tags = data;

                RegionBarCtrl.contFn--;
                if (RegionBarCtrl.contFn == 0)
                    RegionBarCtrl.drawRegionsBar();
            },
            error: function (xhr, status, error) {
                console.error("ERR: ShowmapCtrl.loadTags " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });
    },

    getHeader : function()
    {
        var ris = [];
        var cont = 1;

        ris[0] = "Region";
        for(var t in this.tags)
        {
            ris[cont] = this.tags[t];
            ris[cont+1] = {role: 'annotation'};
            //ris[cont+1] = {type: 'string', role: 'annotation', p: {html: true}};
            cont+=2;
        }

        return ris;

    },

    appendRows: function(data)
    {
        //tipo di visualizzazione
        var id = this.getSelectedID();

        //indice delle regioni (data[0] contiene l'header)
        var i_r = 1;

        for(var i = 0; i < this.regions.length;i++)
        {
            var feature = this.regions[i];

            var i_t = 1;    //indice dei tag
            var row = [];

            row[0] = feature.properties.NAME_1;

            var totTweets = feature.properties.sum;

            //inserisco i valori delle righe
            for(var tag in feature.properties.counter) {
                row[i_t] = this.getSelelectedValue(id, feature, tag);
                row[i_t+1] = "";
                i_t+=2;
            }

            //solo nell'ultima posizione inserisco il totale
            for(var j = row.length - 2; j > 0; j-=2)
            {
                if ( row[j] > 0 )
                {
                    row[j+1] = this.getSelectedCount(id, feature);
                    break;
                }
            }
            if ( totTweets == 0 ) row[2] = "0";

            data[i_r] = row;
            i_r ++;
        }
        //data[1] = ['Puglia',      5, "", 5, "", 5, "", 10, ""];
        //data[2] = ['Pippo',      5, "", 5, "", 5, "", 2, "17"];
        //data[3] = ['Franco',      5, "", 5, "", 5, "", 10, ""];
        return data;
    },

    getSelectedID: function()
    {
        var name = this.cmbType[0].id;
        return parseInt( $( "#" + name + ' option:selected')[0].value );
    },

    getSelelectedValue: function(id, feature, tag)
    {
        switch (id)
        {
            case 0:     //number tweet
                return feature.properties.counter[tag];
            case 1:     //index
                //var tweets = feature.properties.counter[tag];
                //var population = feature.properties.population;
                //var ris = parseFloat((tweets / population).toFixed(7));
                return feature.properties.counter[tag];
        }

        alert("ooooops...");
    },

    getSelectedCount: function(id, feature)
    {
        switch (id)
        {
            case 0:     //number tweet
                return feature.properties.sum;
            case 1:     //index
                return feature.properties.avg.toFixed(2);
        }

        alert("ooooops...");
    },

    removeWait: function () {
        $("#spinner").addClass("hidden");
        $("#container").removeClass("hidden");
    }

};