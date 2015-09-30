"use strict";

var prjEditCtrl = null;

ngApp.controller('ngPrjEditCtrl', ['$scope', function( $scope ) {

    $(".selectpicker").selectpicker();
    var tableTag = $("#tagsTable");
    var socket = io.connect();
    var $btnOverrideDataTokens = $("#overrideDataTokens");
    var $btnSyncUserTags = $("#synUserTag");
    var $btnSyncDataTags = $("#synDataTag");
    var $terminal = $("#terminal");

    var PrjEditCtrl = function() {

        var _self = this;

        //this.intervalScroll = null;
        this.optionsPie = {
            title: null,
            pieSliceText: 'label',
            backgroundColor: 'transparent',
            chartArea: {left:0,top:0,bottom: 0, width:"100%",height:"100%"},
            legend:{position:'right', alignment:'start'},
            sliceVisibilityThreshold: 0
        };

        this.files = {};
        this.progress = {};
        this.username = null;
        this.project = null;
        this.type = "";

        //control
        this.$btnFiles =  $("#upload_input");
        this.$btnFiles.fileinput( {
            previewFileType: "json",
            allowedFileExtensions: ["json"]
        });
        this.$cmbExample = $('#cmbType');
        this.$btnSyncProject = $("#btnsyncproject");
        this.$tableTag = $('#tagsTable');
        this.$formEditProject = $("#form_editproject");
        this.$formUpload = $("#uploadForm");
        this.$btnUpload = $('#upload_btn');
        this.$btnDelete = $("#btndeletedata");
        this.$imgWaitDelete = $('#waitdelete');

        //message
        this.$msgEditProject = $("#msgEditProject");

        this.showInsertTag = function () {

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

                            var tag = $('#newTag').val().trim();
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
                                    //_self.$tableTag.bootstrapTable('refresh');
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
            });

        };

        //this.setIntervalScroll = function () {
        //    clearInterval(_self.intervalScroll);
        //    _self.intervalScroll = setInterval(function() {
        //
        //        try {
        //            _self.$terminal.contents().scrollTop(
        //                _self.$terminal.contents().height() + 200
        //            );
        //
        //            _self.$terminal.contents().find("body")
        //                .css('color', '#fff')
        //                .css('font-family', 'monospace')
        //                .css('font-size', '15px')
        //                .css('text-align', 'left')
        //                .css('position', 'static')
        //                .css('word-wrap', 'break-word');
        //        } catch (e) {
        //            clearInterval(_self.intervalScroll);
        //        }
        //
        //    } , 500);
        //};

        this.getProject = function(callback) {
            console.log("CALL: getProject - project=" + $scope.Project);


            jQuery.ajax({
                type: "GET",
                url: '/project/getproject?project=' + $scope.Project,
                dataType: 'json',
                async: true,
                success: function (data) {
                    callback(data)
                },
                error: function (data) {
                    alert('getProject fail');
                }
            });
        };

        this.loadEditForm = function(data) {
            console.log("CALL: loadEditForm");

            $("#project").val(data.projectName);
            $("#description").val(data.description);
        };

        this.getExample = function() {

            var selected = _self.$cmbExample.find("option:selected").val();
            this.type = selected;

            if (selected == "csv") {
                return "id,[date],[latitude],[longitude],[source],text,[user],[tag]\n" +
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
                return "[\n" +
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
                return "[\n" +
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
                    "    [tokens: String\n" +
                    "  },\n" +
                    "  ...\n" +
                    "]";
            }

        };

        this.sendFiles = function () {
            var files = _self.$btnFiles[0].files;
            if ( files.length == 0)
                bootbox.alert("No file selected");
            else
                this.$formUpload.submit();
        };

        this.getSelectedFiles = function() {
            console.log("CALL: getSelectedFiles");
            var fileInput = document.getElementById("upload_input");
            return fileInput.files;
        };

        /**
         * Crea delle progress bar vuote
         * @param files
         */
        this.initProgress = function(files) {
            _self.files = {};
            _self.progress = {};
            for(var i=0; i<files.length;i++)
            {
                _self.files[files[i].name] = i;
                _self.progress[files[i].name] = _self.createProgress(files[i].name);
            }
        };

        /**
         * Modifica la lunghezza della progress bar
         * @param percentage
         */
        this.updateProgress = function (percentage) {
            var keys = _.keys(_self.progress);
            for(var k in keys){

                var p = _self.progress[ keys[k] ];
                var pc = $(p).find(".progress-bar");

                //$(pc).width(percentage + "%");
                //$(pc).attr("aria-valuenow", percentage.toString() );
                $(pc).css( "width", percentage.toString() + "%" );
            }
        };

        /**
         *
         * @param progress
         * @param progress.percentage
         * @param progress.file
         * @param progress.done
         *
         */
        this.updateProgress_save = function (progress) {
            var p = _self.progress[ progress.file ];
            var pc = $(p).find(".progress-bar");
            $(pc).css( "width", progress.percentage + "%" );
        };

        this.updateProgress_reset = function() {
            var keys = _.keys(_self.progress);
            for(var k in keys){

                var p = _self.progress[ keys[k] ];
                var pc = $(p).find(".progress-bar");
                //$(pc).width(0 + "%");
                //$(pc).attr("aria-valuenow", "0" );
                $(pc).css( "width", "0%" );
            }
        };

        /**
         * Scrive i risultati delle insert sotto le progress bar
         *
         * @param result - { fail:{Number}, success:{Number} }
         * @param fileName - {String}
         */
        this.writeResultProgress = function(result) {
            var keys = _.keys(_self.progress);
            for(var k in keys){

                var p = _self.progress[ keys[k] ];
                var pb = $(p).find(".progress-bar");
                $(pb).css( "width", "100%" );
                $(pb).removeClass("active");
                var resContainer = $(p).find(".progress-result")[0];

                if ( result[keys[k]] == null) {
                    $(resContainer).text('Undefined error...');
                }
                else
                {
                    $(resContainer).text('');
                    $(resContainer).append("Added: " + result[keys[k]].success + " ");
                    $(resContainer).append('<span class="glyphicon glyphicon-ok" style="color: green" aria-hidden="true"></span>');
                    $(resContainer).append(" - ");
                    $(resContainer).append("Discard:" + result[keys[k]].fail + " ");
                    $(resContainer).append('<span class="glyphicon glyphicon-remove" style="color: red" aria-hidden="true"></span>');
                }
            }
            _self.loadPie();
        };

        this.createProgress = function(name) {

            var html = '<div class="progress-object"> \
                    <div class="progress"> \
                        <div class="progress-bar progress-bar-success progress-bar-striped active" \
                             role="progressbar" \
                             aria-valuenow="0" \
                             aria-valuemin="0" \
                             aria-valuemax="100" \
                             style="width:0%;text-align:left;color:black;padding-left:10px;"> \
                             ' + name + ' \
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

        };

        ////evento della combo
        this.$cmbExample.on('change', function () {
            $scope.$apply();
        });

        this.$btnUpload.click(function(){ _self.sendFiles(); });

        this.$formEditProject.ajaxForm( {
            success:function(result){
                if(result.status == 0){
                    _self.$msgEditProject.show();
                    _self.$msgEditProject.addClass("alert-success");
                    var msg = _self.$msgEditProject.find("span.msgText")[0];
                    $(msg).text("The operation completed successfully");
                }else{
                    _self.$msgEditProject.show();
                    _self.$msgEditProject.addClass("alert-danger");
                    var msg = _self.$msgEditProject.find("span.msgText")[0];
                    $(msg).text(result.message);
                }
            },
            error: function(error){
                console.log(error);
            }
        });

        this.$formUpload.submit(
            function() {

                $(this).ajaxSubmit({

                    beforeSend: function(event, files, altro)
                    {
                        console.log("CALL: Before Send");
                        var fileList = _self.$btnFiles[0].files;
                        _self.initProgress(fileList);
                    },

                    uploadProgress: function(event, position, total, percentage, file)
                    {
                        _self.updateProgress(percentage);
                    },

                    error: function(xhr) {
                        status('Error: ' + xhr.status);
                    },

                    success: function(response) {
                        console.log("success: " + JSON.stringify(response) );
                        _self.$btnFiles.fileinput('clear');
                        //_self.writeResultProgress(response);
                    }
                });

                // Have to stop the form from submitting and causing
                // a page refresh - don't forget this
                return false;

            }
        );

        //this.windowSyncDataTags = null;
        //this.documentSyncDataTags = null;
        this.$btnSyncProject.click(function(){
            _self.windowSyncDataTags = window.open("/view/terminal#syncproject");
        });

        this.$btnDelete.click(function(){
            bootbox.confirm("Are you sure to delete ALL data?", function(confirm){
                if(confirm){
                    _self.$imgWaitDelete.removeClass("hidden");
                    $.ajax({
                        type: 'post',
                        url: '/datas/deldata',
                        data: {project: window.PROJECT},
                        success: function(res){

                        },
                        error: function(res){
                            console.error("error");
                        }
                    });
                }
            });
        });

        /// socket.io

        socket.on('deldatas', function(result){
            _self.$imgWaitDelete.addClass("hidden");
            var msg = "Deleted: " + result.data + " records";
            $("#resultdelete").text(msg);
            _self.loadPie();
        });

        socket.on('uploaddata_startsave', function(result){
            _self.updateProgress_reset();
        });

        socket.on('uploaddata_progress', function(result){
            _self.updateProgress_save(result);
        });

        socket.on('uploaddata_end', function(result){
            _self.writeResultProgress(result);
        });

        /// TABLE TAG CLICK
        this.cmdDeleteTagClick = function(tag){

            bootbox.confirm("<h4>Are you sure to delete tag: " + tag + "?</h4>",
                function (result) {
                    if (result) {
                        console.log("User confirmed delete dialog");
                        $.ajax({
                            url: '/vocabulary/tag', type: 'DELETE', dataType: "json",
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify({tag:tag}),
                            success: function(html) {
                                getUserTag();
                                //_self.$tableTag.bootstrapTable('refresh');
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

        this.cmdEditTagClick = function(tag) {
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
                                //_self.$tableTag.bootstrapTable('refresh');
                            },
                            error: function (xhr, status, error) {
                                alert("Error: " + error);
                            }
                        });
                    }
                }
            });
        };

        this.cmdEditVocabularyClick = function(tag){
            var data = _self.$tableTag.bootstrapTable('getData');
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
                                //_self.$tableTag.bootstrapTable("refresh");
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
        this.loadPie = function() {
            DataCtrl.getFromUrl(DataCtrl.FIELD.DATANATIONS, null, function(doc) {
                var data = [];
                data[0] = ['Nation', 'Count data'];
                _.each(doc, function(row){
                    data.push([row.nation, row.sum]);
                });
                var dataTable = google.visualization.arrayToDataTable(data);
                var chart = new google.visualization.PieChart(document.getElementById('piechart'));
                chart.draw(dataTable, _self.optionsPie);
            });
        };
        this.loadPie();

        //chiedo il progetto
        this.getProject( function(prj) {
            $scope.$apply(function(){
                $scope.Description =  prj.description;
            })
        })
    };

    $scope.name = "ngPrjEditCtrl";

    $scope.ProjectName = window.PROJECT;

    $scope.Description = window.DESCRIPTION;

    $scope.Example = function(){ if(prjEditCtrl) return prjEditCtrl.getExample(); };

    $scope.formatter = {

        $table: $("#tableTags"),

        delete : function(value, obj){
            var btn = $("<a />")
                .addClass("btn btn-danger btn-delete")
                .attr("onclick", "prjEditCtrl.cmdDeleteTagClick(\"" + obj.tag + "\")" )
                .append("<i class='img-delete'></i>")
                .addClass("fa fa-trash-o fa-lg");

            return $("<div>").append(btn).html();
        },

        tag : function(value, obj){

            var link = $('<a src="#" />');
            link.append('<i class="fa fa-pencil"/>')
                .css("cursor", "pointer")
                .css("margin-left", "10px")
                .attr("onclick", "prjEditCtrl.cmdEditTagClick(\"" + obj.tag + "\")" )

            var ris = $("<div />")
                .append(value)
                .append(link);

            return $(ris).outerHTML();
        },

        vocabulary : function(value, row, index) {
            var link = $('<a src="#" />');
            link.append('<i class="fa fa-pencil"/>')
                .css("cursor", "pointer")
                .css("margin-left", "10px")
                .attr("onclick", "prjEditCtrl.cmdEditVocabularyClick(\"" + row.tag + "\")" );

            var ris = $("<div />")
                .append(value.join(', '))
                .append(link);

            return $(ris).outerHTML();
        }

    };

    $scope.infodata = null;

    $scope.uservocabulary = null;

    $scope.stat = null;

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
                    tableTag.bootstrapTable('load', res);
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

    $(document).ready(function(){
        if(!window.PROJECT || window.PROJECT == "") {
            $("#container").hide();
            $("#msgProject").show();
        }else {
            prjEditCtrl = new PrjEditCtrl($scope);
            getInfoData();
            getUserTag();
            getStat();
        }
    });

}]);