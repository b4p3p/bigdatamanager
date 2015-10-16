"use strict";

ngApp.controller('ngPrjEditCtrl', ['$scope', function( $scope ) {

    $(".selectpicker").selectpicker();
    var socket = io.connect();

    //esempi
    var crowdPulseExample = "[\n" +
        "  {\n" +
        "    id: '<unique_id>',\n" +
        "    [date: '<AAAA-MM-GG>'],\n" +
        "    [latitude: Float],\n" +
        "    [longitude: Float],\n" +
        "    [fromUser: String],\n" +
        "    text:  String,\n" +
        "    [user: String,\n" +
        "    [customTags:  [String] ]\n" +
        "    [tokens: String\n" +
        "  },{\n" +
        "    id: '<unique_id>',\n" +
        "    [date: '<AAAA-MM-GG>'],\n" +
        "    [latitude: Float],\n" +
        "    [longitude: Float],\n" +
        "    [fromUser: String],\n" +
        "    text:  String,\n" +
        "    [user: String,\n" +
        "    [customTags:  [String] ]\n" +
        "    [tokens: String]\n" +
        "  },\n" +
        "  ...\n" +
        "]";
    
    //controlli
    var $btnOverrideDataTokens = $("#overrideDataTokens");
    var $btnSyncUserTags = $("#synUserTag");
    var $btnSyncDataTags = $("#synDataTag");
    var $terminal = $("#terminal");
    var $btnFiles =  $("#upload_input");

    var $cmbExample = $('#cmbType');
    var $btnSyncProject = $("#btnsyncproject");
    var $tableTag = $('#tagsTable');
    var $formEditProject = $("#form_editproject");
    var $formUpload = $("#uploadForm");
    var $btnUpload = $('#upload_btn');
    var $btnDelete = $("#btndeletedata");
    var $imgWaitDelete = $('#waitdelete');
    var $msgEditProject = $("#msgEditProject");

    $btnFiles.fileinput( {
        previewFileType: "json",
        allowedFileExtensions: ["json"]
    });
    var optionsPie = {
        title: null,
        pieSliceText: 'label',
        backgroundColor: 'transparent',
        chartArea: {left:0,top:0,bottom: 0, width:"100%",height:"100%"},
        legend:{position:'right', alignment:'start'},
        sliceVisibilityThreshold: 0
    };
    var files = {};
    var progress = {};
    var project = null;
    var type = "";
    var windowSyncDataTags = null;

    $scope.name = "ngPrjEditCtrl";

    $scope.ProjectName = window.PROJECT;

    $scope.Description = window.DESCRIPTION;

    //$scope.Example = crowdPulseExample;

    function Example(){

        console.log("CALL getExample");

        var selected = $cmbExample.find("option:selected").val();
        type = selected;

        var msg = "";

        if (selected == "csv") {
            msg = "id,[date],[latitude],[longitude],[source],text,[user],[tag]\n" +
                "'<unique_id>'," +
                "['<AAAA-MM-GG>']," +
                "[Float]," +
                "[Float]," +
                "[String]," +
                "String," +
                "[String]," +
                "[String]\n" +
                "'<unique_id>'," +
                "['<AAAA-MM-GG>']," +
                "[Float]," +
                "[Float]," +
                "[String]'," +
                "String," +
                "[String]," +
                "[String]\n" +
                "...\n";
        }

        if (selected == "json") {
            msg = "[\n" +
                "  {\n" +
                "    id: '<unique_id>',\n" +
                "    [date: '<AAAA-MM-GG>'],\n" +
                "    [latitude: Float],\n" +
                "    [longitude: Float],\n" +
                "    [source: String],\n" +
                "    text: String,\n" +
                "    [user: String],\n" +
                "    [tag: String]\n" +
                "  },{\n" +
                "    id: '<unique_id>',\n" +
                "    [date: '<AAAA-MM-GG>'],\n" +
                "    [latitude: Float],\n" +
                "    [longitude: Float],\n" +
                "    [source: String],\n" +
                "    text: String,\n" +
                "    [user: String],\n" +
                "    [tag: String]\n" +
                "  },\n" +
                "  ...\n" +
                "]";
        }

        if (selected == "json-crowdpulse"){
            msg = "[\n" +
                "  {\n" +
                "    id: '<unique_id>',\n" +
                "    [date: '<AAAA-MM-GG>'],\n" +
                "    [latitude: Float],\n" +
                "    [longitude: Float],\n" +
                "    [fromUser: String],\n" +
                "    text:  String,\n" +
                "    [user: String,\n" +
                "    [customTags:  [String] ]\n" +
                "    [tokens: String\n" +
                "  },{\n" +
                "    id: '<unique_id>',\n" +
                "    [date: '<AAAA-MM-GG>'],\n" +
                "    [latitude: Float],\n" +
                "    [longitude: Float],\n" +
                "    [fromUser: String],\n" +
                "    text:  String,\n" +
                "    [user: String,\n" +
                "    [customTags:  [String] ]\n" +
                "    [tokens: String]\n" +
                "  },\n" +
                "  ...\n" +
                "]";
        }

        return msg;
    };

    //function(){
    //    console.log("Example");
    //    getExample();
    //};

    $scope.formatter = {

        $table: $("#tableTags"),

        delete : function(value, obj){

            var btn = $("<a />")
                .addClass("btn btn-danger btn-delete")
                .attr("onclick", "cmdDeleteTagClick(\"" + obj.tag + "\")" )
                .append("<i class='img-delete'></i>")
                .addClass("fa fa-trash-o fa-lg");

            return $("<div>").append(btn).html();
        },

        tag : function(value, obj){

            //src=\"#\"
            var link = $("<a/>");
            link.append("<i class=\"fa fa-pencil\"/>")
                .css("cursor", "pointer")
                .css("margin-left", "10px")
                .attr("onclick", "cmdEditTagClick(\"" + obj.tag + "\")" );

            var ris = $("<div />")
                .append(value)
                .append(link);

            return $(ris).outerHTML();
        },

        vocabulary : function(value, row) {
            //src="#"
            var link = $('<a  />');
            link.append('<i class="fa fa-pencil"/>')
                .css("cursor", "pointer")
                .css("margin-left", "10px")
                .attr("onclick", "cmdEditVocabularyClick(\"" + row.tag + "\")" );

            var ris = $("<div />")
                .append(value.join(', '))
                .append(link);

            return $(ris).outerHTML();
        }

    };

    $scope.infodata = null;

    $scope.uservocabulary = null;

    $scope.stat = null;

    $scope.showInsertTag = function() {

        var str = "";

        $.ajax({
            url: '/views/content/dialogNewTag.html',
            type: 'get',
            async: false,
            success: function(html) {
                str = html;
            }
        });

        bootbox.dialog({
            title: "Insert new tag",
            message: str,
            buttons: {
                OK: {
                    label: 'OK',
                    callback: function () {

                        var tag = $('#cmbEditTag').val();
                        var strwords = $('#vocabulary').val();
                        var words = strwords.split(",");

                        _.each(words, function(item, i){
                            words[i] = words[i].trim();
                        });

                        var data = {
                            tag: tag,
                            tokens: words
                        };
                        $.ajax({
                            url: '/vocabulary/vocabulary',
                            contentType: "application/json; charset=utf-8",
                            type: 'put', data: JSON.stringify(data), dataType: "json",
                            success: function() {
                                getUserTag();
                            },
                            error: function(xhr, status, error){
                                alert("Error: " + error);
                            }
                        });
                    }
                },
                cancel: {
                    label: 'Cancel',
                    callback: function () {
                        console.log("Dialog insert tag dismissed");
                    }
                }
            }
        }).init(function(){

            var cmb = $('#cmbEditTag');

            //aggiunge i tag alla combo
            _.each( $scope.stat.data.allTags, function(value){
                DomUtil.addOptionValue(cmb, value);
            });
            cmb.selectpicker();
        });
    };

    $scope.typeSelected = {
        type: 'json-crowdpulse',
        example: Example()
    };

    $scope.cmbTypeChange = function(){
        $scope.typeSelected.example = Example();
    };

    function getProject() {

        console.log("CALL: getProject - project=" + $scope.Project);

        jQuery.ajax({
            type: "GET",
            url: '/project/getproject?project=' + $scope.Project,
            dataType: 'json',
            async: true,
            success: function (data) {
                $scope.$apply( function(){
                    $scope.Description =  data.description;
                })
            },
            error: function (err) {
                alert('getProject fail\n' + err.toString() );
            }
        });
    }

    function loadEditForm(data) {
        console.log("CALL: loadEditForm");
        $("#project").val(data.projectName);
        $("#description").val(data.description);
    }

    function sendFiles() {
        var files = $btnFiles[0].files;
        if ( files.length == 0)
            bootbox.alert("No file selected");
        else
            $formUpload.submit();
    }

    function getSelectedFiles() {
        console.log("CALL: getSelectedFiles");
        var fileInput = document.getElementById("upload_input");
        return fileInput.files;
    }

    /**
     * Crea delle progress bar vuote
     * @param fileList
     */
    function initProgress(fileList) {

        if( fileList == null ) return;

        files = {};
        progress = {};
        _.each( fileList, function(file, index){
            files[file] = index;
            progress[file.name] = createProgress(file.name);
        });
    }

    /**
     * Modifica la lunghezza di tutte le progress bar
     * @param percentage
     */
    function updateProgress(percentage) {

        var keys = _.keys(progress);
        _.each( keys, function(key){
            var p = progress[ key ];
            var pc = $(p).find(".progress-bar");
            $(pc).css( "width", percentage.toString() + "%" );
        });
    }

    /**
     *
     * @param progress
     * @param progress.percentage
     * @param progress.file
     * @param progress.done
     *
     */
    function updateProgress_save(pResult) {
        var p = progress[ pResult.file ];
        var pc = $(p).find(".progress-bar");
        $(pc).css( "width", pResult.percentage + "%" );
    }

    function updateProgress_reset() {
        var keys = _.keys(progress);
        for(var k = 0; k<keys.lenght;k++){
            var key = keys[k];
            var p = progress[ key ];
            var pc = $(p).find(".progress-bar");
            $(pc).css( "width", "0%" );
        }
    }

    /**
     * Scrive i risultati delle insert sotto le progress bar
     * @param result - { fail:{Number}, success:{Number} }
     */
    function writeResultProgress(result) {
        var keys = _.keys(progress);
        _.each(keys, function(key){

            var p = progress[ key ];
            var pb = $(p).find(".progress-bar");

            $(pb).css( "width", "100%" );
            $(pb).removeClass("active");

            var resContainer = $(p).find(".progress-result")[0];

            if ( result[key] == null) {
                $(resContainer).text('Undefined error...');
            }
            else
            {
                $(resContainer).text('');
                $(resContainer).append("Added: " + result[key].success + " ");
                $(resContainer).append("<span class=\"glyphicon glyphicon-ok\" style=\"color: green\" aria-hidden=\"true\"></span>");
                $(resContainer).append(" - ");
                $(resContainer).append("Discard:" + result[key].fail + " ");
                $(resContainer).append("<span class=\"glyphicon glyphicon-remove\" style=\"color: red\" aria-hidden=\"true\"></span>");
            }
        });

        loadPie();
    }

    function createProgress(name) {

        var html = "<div class=\"progress-object\"> \
                    <div class=\"progress\"> \
                        <div class=\"progress-bar progress-bar-success progress-bar-striped active\" \
                             role=\"progressbar\" \
                             aria-valuenow=\"0\" \
                             aria-valuemin=\"0\" \
                             aria-valuemax=\"100\" \
                             style=\"width:0;text-align:left;color:black;padding-left:10px;\"> \
                             " + name + ' \
                        </div> \
                    </div> \
                    <div class="progress-result" style="min-height: 25px"> \
                    Wait... \
                    </div> \
                </div>';

        //Added: 100 - Discard: 5

        var d = $(html);

        $("#progress-container").append(d);

        return d;

    }

    ////evento della combo
    //$cmbExample.on('change', function () {
    //    console.log('cmbExample change');
    //    getExample();
    //});

    $btnUpload.click(function(){ sendFiles(); });

    $formEditProject.ajaxForm( {
        success:function(result){
            var msg = "";
            if(result.status == 0){
                $msgEditProject.show();
                $msgEditProject.addClass("alert-success");
                msg = $msgEditProject.find("span.msgText")[0];
                $(msg).text("The operation completed successfully");
            }else{
                $msgEditProject.show();
                $msgEditProject.addClass("alert-danger");
                msg = $msgEditProject.find("span.msgText")[0];
                $(msg).text(result.message);
            }
        },
        error: function(error){
            console.log(error);
        }
    });

    $formUpload.submit(function() {
        $(this).ajaxSubmit({

            beforeSend: function()
            {
                $btnFiles =  $("#upload_input");
                var fileList = $btnFiles[0].files;

                console.log("CALL: Before Send - " + fileList);

                initProgress(fileList);
            },

            uploadProgress: function(event, position, total, percentage)
            {
                console.log('uploadProgress: ' + percentage);
                updateProgress(percentage);
            },

            error: function(xhr) {
                console.log('Status error: ' + xhr.status);
            },

            success: function(response) {
                console.log("success: " + JSON.stringify(response) );
                $btnFiles.fileinput('clear');
            }
        });

        // Have to stop the form from submitting and causing
        // a page refresh - don't forget this
        return false;

    });

    $btnSyncProject.click(function(){
        windowSyncDataTags = window.open("/view/terminal#syncproject");
    });

    $btnDelete.click(function(){
        bootbox.confirm("Are you sure to delete ALL data?", function(confirm){
            if(confirm){
                $imgWaitDelete.removeClass("hidden");
                $.ajax({
                    type: 'post',
                    url: '/datas/deldata',
                    data: {project: window.PROJECT},
                    success: function(res){},
                    error: function(){ console.error("error"); }
                });
            }
        });
    });

    /// TABLE TAG CLICK
    window.cmdDeleteTagClick = function(tag){

        bootbox.confirm('<h4>Are you sure to delete tag: ' + tag + "?</h4>",
            function (result) {
                if (result) {
                    console.log("User confirmed delete dialog");
                    $.ajax({
                        url: '/vocabulary/tag', type: 'DELETE', dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({tag:tag}),
                        success: function() {
                            getUserTag();
                        },
                        error: function(xhr, status, error){
                            alert("Error: " + error);
                        }
                    });
                } else {
                    console.log("User declined delete dialog");
                }
            });
    };

    window.cmdEditTagClick = function(tag) {
        bootbox.prompt({
            title: "Edit tag: " + JSON.stringify(tag),
            value: tag,
            callback: function (result) {
                if (result === null) {
                    console.log("Prompt edit tag dismissed");
                } else {
                    console.log("New tag: " + result);
                    var data = {
                        newTag: result,
                        oldTag: tag
                    };
                    $.ajax({
                        url: '/vocabulary/tag', type: 'move',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify(data), dataType: "json",
                        success: function () {
                            getUserTag();
                        },
                        error: function (xhr, status, error) {
                            alert("Error: " + error);
                        }
                    });
                }
            }
        });
    };

    window.cmdEditVocabularyClick = function(tag){
        var data = $tableTag.bootstrapTable('getData');
        var row = null;
        for(var i = 0; i< data.length; i++) {
            if(data[i].tag == tag){
                row = data[i];
                break;
            }
        }
        bootbox.prompt({
            title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
            value: row.tokens,
            callback: function (result) {
                if (result === null) {
                    console.log("Prompt edit vocabulary dismissed");
                } else {
                    console.log("New words: " + result);
                    var data = { tag: row.tag, words: result };
                    $.ajax({
                        url: '/vocabulary/words', dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: 'PUT', data: JSON.stringify(data),
                        success: function() {
                            getUserTag();
                        },
                        error: function(xhr, status, error){
                            alert("Error: " + error);
                        }
                    });
                }
            }
        });
    };

    //carico le regioni nel grafico
    function loadPie() {
        DataCtrl.getFromUrl(DataCtrl.FIELD.DATANATIONS, null, function(doc) {
            var data = [];
            data[0] = ['Nation', 'Count data'];
            _.each(doc, function(row){
                data.push([row.nation, row.sum]);
            });
            var dataTable = google.visualization.arrayToDataTable(data);
            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
            chart.draw(dataTable, optionsPie);
        });
    }

    function getInfoData(){
        $.ajax({
            url: '/datas/info',
            success:function(res){
                $scope.infodata = res;
                $scope.$apply();
            },
            error: function(err){
                console.error(JSON.stringify(err));
            }
        });
    }

    function getUserTag(){
        $.ajax({
            url: '/vocabulary/getUserTags',
            success:function(res){
                $scope.$apply(function(){
                    $scope.uservocabulary = res;
                    $tableTag.bootstrapTable('load', res);
                });
            },
            error: function(err){
                console.error(JSON.stringify(err));
            }
        });
    }

    //chiedo stat per i tag memorizzati nei dati
    function getStat() {
        $.ajax({
            url: '/project/stat',
            success:function(res){
                $scope.$apply(function(){
                    $scope.stat = res;
                });
            },
            error: function(err){
                console.error(JSON.stringify(err));
            }
        });
    }

    /// ####  EVENTI  ####

    /**
     * CLICK override tokens in data
     */
    $btnOverrideDataTokens.click( function(){
        $terminal.text('');
        $.ajax({
            type:'get',
            url: "/datas/overrideTokensData",
            error: function(err){
                alert(err)
            }
        });
    });

    /**
     * Click data tag sync
     */
    $btnSyncDataTags.click( function(){
        $terminal.text('');
        $.ajax({
            type:'get',
            url: "/vocabulary/syncDataTags",
            error: function(err){
                alert(err)
            }
        });
    });

    /**
     * Click user tag sync
     */
    $btnSyncUserTags.click( function(){
        $terminal.text('');
        $.ajax({
            type:'get',
            url: "/vocabulary/syncUserTags",
            error: function(err){
                alert(err)
            }
        });
    });

    /**
     * Messaggio da parte della sincronizzazione
     */
    socket.on("overrideDataTokens_msg", function(msg){
        if( msg != '.' )
            $terminal.append(msg + '<br>');
        else
            $terminal.append(msg);
    });

    /**
     * Fine della sincronizzazione data tokens
     */
    socket.on("overrideDataTokens_end", function(msg){
        $terminal.append(msg + "<br>");
        getInfoData();
    });

    /**
     * Messaggio della sync con i token nei dati
     */
    socket.on("syncDataTags_msg", function(msg){
        if( msg != '.' )
            $terminal.append(msg + '<br>');
        else
            $terminal.append(msg);
    });

    /**
     * Fine Messaggio della sync con i token nei dati
     */
    socket.on("syncDataTags_end", function(msg){
        $terminal.append(msg + "<br>");
    });

    /**
     * Messaggio della sync con i token nei dati usando il vocabolario dell'utente
     */
    socket.on("syncUserTags_msg", function(msg){
        if( msg != '.' )
            $terminal.append(msg + "<br>");
        else
            $terminal.append(msg);
    });

    /**
     * Fine Messaggio della sync con i token nei dati usando il vocabolario dell'utente
     */
    socket.on("syncUserTags_end", function(msg){
        $terminal.append(msg + "<br>");
    });

    socket.on('deldatas', function(result){
        $imgWaitDelete.addClass("hidden");
        var msg = "Deleted: " + result.data + " records";
        $("#resultdelete").text(msg);
        loadPie();
    });

    socket.on('uploaddata_startsave', function(){
        updateProgress_reset();
    });

    socket.on('uploaddata_progress', function(result){
        updateProgress_save(result);
    });

    socket.on('uploaddata_end', function(result){
        writeResultProgress(result);
    });

    $(document).ready(function(){
        if(!window.PROJECT || window.PROJECT == "")
        {
            $("#container").hide();
            $("#msgProject").show();
        }
        else
        {
            getInfoData();
            getUserTag();
            getStat();
            loadPie();
            getProject();
            //getExample();
        }
    });

}]);


//function getExample() {
//
//    console.log("CALL getExample");
//
//    var selected = $cmbExample.find("option:selected").val();
//    type = selected;
//
//    var msg = "";
//
//    if (selected == "csv") {
//        msg = "id,[date],[latitude],[longitude],[source],text,[user],[tag]\n" +
//            "'<unique_id>'," +
//            "['<AAAA-MM-GG>']," +
//            "[Float]," +
//            "[Float]," +
//            "[String]," +
//            "String," +
//            "[String]," +
//            "[String]\n" +
//            "'<unique_id>'," +
//            "['<AAAA-MM-GG>']," +
//            "[Float]," +
//            "[Float]," +
//            "[String]'," +
//            "String," +
//            "[String]," +
//            "[String]\n" +
//            "...\n";
//    }
//
//    if (selected == "json") {
//        msg = "[\n" +
//            "  {\n" +
//            "    id: '<unique_id>',\n" +
//            "    [date: '<AAAA-MM-GG>'],\n" +
//            "    [latitude: Float],\n" +
//            "    [longitude: Float],\n" +
//            "    [source: String],\n" +
//            "    text: String,\n" +
//            "    [user: String],\n" +
//            "    [tag: String]\n" +
//            "  },{\n" +
//            "    id: '<unique_id>',\n" +
//            "    [date: '<AAAA-MM-GG>'],\n" +
//            "    [latitude: Float],\n" +
//            "    [longitude: Float],\n" +
//            "    [source: String],\n" +
//            "    text: String,\n" +
//            "    [user: String],\n" +
//            "    [tag: String]\n" +
//            "  },\n" +
//            "  ...\n" +
//            "]";
//    }
//
//    if (selected == "json-crowdpulse"){
//        msg = "[\n" +
//            "  {\n" +
//            "    id: '<unique_id>',\n" +
//            "    [date: '<AAAA-MM-GG>'],\n" +
//            "    [latitude: Float],\n" +
//            "    [longitude: Float],\n" +
//            "    [fromUser: String],\n" +
//            "    text:  String,\n" +
//            "    [user: String,\n" +
//            "    [customTags:  [String] ]\n" +
//            "    [tokens: String\n" +
//            "  },{\n" +
//            "    id: '<unique_id>',\n" +
//            "    [date: '<AAAA-MM-GG>'],\n" +
//            "    [latitude: Float],\n" +
//            "    [longitude: Float],\n" +
//            "    [fromUser: String],\n" +
//            "    text:  String,\n" +
//            "    [user: String,\n" +
//            "    [customTags:  [String] ]\n" +
//            "    [tokens: String]\n" +
//            "  },\n" +
//            "  ...\n" +
//            "]";
//    }
//
//    try{
//        $scope.$apply(function(){
//            $scope.Example = msg;
//        });
//    }catch(e){}
//}


