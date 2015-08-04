"use strict";

ngApp.controller('ngPrjEditCtrl', ['$scope', function( $scope ) {

    $(".selectpicker").selectpicker();

    var PrjEditCtrl = function() {

        var _self = this;

        this.intervalScroll = null;
        this.optionsPie = {
            title: null,
            pieSliceText: 'label',
            backgroundColor: 'transparent',
            chartArea: {left:0,top:0,bottom: 0, width:"100%",height:"100%"},
            legend:{position:'right', alignment:'start'}
        };

        this.files = {};
        this.progress = {};
        this.username = null;
        this.project = null;
        this.type = "";

        //control
        this.$btnFiles =  $("#upload_input");
        this.$cmbExample = $('#cmbType');
        this.$btnSyncUserTags = $("#synUserTag");
        this.$btnSyncDataTags = $("#synDataTag");
        this.$btnOverrideDataTokens = $("#overrideDataTokens");
        this.$btnSyncProject = $("#btnsyncproject");
        this.$terminal = $("#terminal");
        this.$tableTag = $('#tagsTable');
        this.$formEditProject = $("#form_editproject");
        this.$formUpload = $("#uploadForm");
        this.$btnUpload = $('#upload_btn');

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
                                type: 'put',
                                async: false,
                                data: JSON.stringify(data),
                                dataType: "json",
                                success: function(html) {
                                    PrjEditFormCtrl.updateTableTag();
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

        this.setTableTag = function() {
            this.$tableTag.bootstrapTable('destroy');
            this.$tableTag.bootstrapTable({
                columns: [{

                    field: 'tag',
                    title: 'Tag',
                    //align: 'center',
                    //switchable: false,
                    sortable: true,
                    formatter: operateFormatterTag,
                    events:
                    {
                        'click .editT': function (e, value, row, index) {
                            console.log(JSON.stringify(row), index);

                            bootbox.prompt({
                                title: "Edit tag: " + JSON.stringify(row.tag),
                                value: row.tag,
                                callback: function (result) {
                                    if (result === null) {
                                        console.log("Prompt edit tag dismissed");
                                    } else {
                                        console.log("New tag: " + result);
                                        var data = {
                                            newTag: result,
                                            oldTag: row.tag
                                        };
                                        $.ajax({
                                            url: '/vocabulary/tag',
                                            contentType: "application/json; charset=utf-8",
                                            type: 'move',
                                            async: true,
                                            data: JSON.stringify(data),
                                            dataType: "json",
                                            success: function(html) {
                                                DatabaseCtrl.loadTags();
                                            },
                                            error: function(xhr, status, error){
                                                alert("Error: " + error);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                },
                    {
                        field: 'words',
                        title: 'Vocabulary',
                        formatter: operateFormatterVocabulary,
                        events:
                        {
                            'click .editV': function (e, value, row, index) {
                                console.log(row, index);

                                bootbox.prompt({
                                    title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
                                    value: row.words,
                                    callback: function (result) {
                                        if (result === null) {
                                            console.log("Prompt edit vocabulary dismissed");
                                        } else {
                                            console.log("New words: " + result);
                                            var data = {
                                                tag: row.tag,
                                                words: result
                                            };
                                            $.ajax({
                                                url: '/vocabulary/words',
                                                contentType: "application/json; charset=utf-8",
                                                type: 'PUT',
                                                async: false,
                                                data: JSON.stringify(data),
                                                dataType: "json",
                                                success: function(html) {
                                                    DatabaseCtrl.loadTags();
                                                },
                                                error: function(xhr, status, error){
                                                    alert("Error: " + error);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    },
                    {
                        field: 'operate',
                        title: 'Delete tag',
                        align: 'center',
                        formatter: operateFormatterDelete,
                        events: {
                            'click .remove': function (e, value, row, index) {
                                console.log(row, index);

                                bootbox.confirm("<h4>Are you sure to delete tag: "
                                    + JSON.stringify(row.tag)
                                    + "?</h4>",
                                    function (result) {
                                        if (result) {
                                            console.log("User confirmed delete dialog");
                                            //var data = {
                                            //    type: "tag",
                                            //    data: {
                                            //        tag: row.tag
                                            //    }
                                            //};
                                            $.ajax({
                                                url: '/vocabulary/tag',
                                                contentType: "application/json; charset=utf-8",
                                                type: 'DELETE',
                                                async: false,
                                                data: JSON.stringify({tag:row.tag}),
                                                dataType: "json",
                                                success: function(html) {
                                                    DatabaseCtrl.loadTags();
                                                },
                                                error: function(xhr, status, error){
                                                    alert("Error: " + error);
                                                }
                                            });
                                        } else {
                                            console.log("User declined delete dialog");
                                        }
                                    });
                            }
                        }
                    }],
                data: DatabaseCtrl.tags,
                search: true,
                striped: true,
                dataType: 'json',
                smartDisplay: true
            });

        };

        this.loadTags = function () {
            jQuery.ajax({
                type: "GET",
                url: '/vocabulary/vocabulary',
                dataType: 'json',
                async: true,
                success: function (data) {

                    console.log("      success GetTagsVocabulary.php");
                    DatabaseCtrl.tags = data;
                    DatabaseCtrl.setTableTag()
                },
                error: function (data) {
                    alert('GetTagsVocabulary fail');
                }
            });
        };

        this.setIntervalScroll = function () {
            clearInterval(_self.intervalScroll);
            _self.intervalScroll = setInterval(function() {

                try {
                    _self.$terminal.contents().scrollTop(
                        _self.$terminal.contents().height() + 200
                    );

                    _self.$terminal.contents().find("body")
                        .css('color', '#fff')
                        .css('font-family', 'monospace')
                        .css('font-size', '15px')
                        .css('text-align', 'left')
                        .css('position', 'static')
                        .css('word-wrap', 'break-word');
                } catch (e) {
                    clearInterval(_self.intervalScroll);
                }

            } , 500);
        };

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
                    "    [tag:  String\n" +
                    "    [tokens: String\n" +
                    "  },{\n" +
                    "    id: '<unique_id>',\n" +
                    "    [date: '<AAAA-MM-GG>'],\n" +
                    "    [latitude: Float],\n" +
                    "    [longitude: Float],\n" +
                    "    [fromUser: String],\n" +
                    "    text:  String,\n" +
                    "    [user: String,\n" +
                    "    [tag:  String\n" +
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

                $(pc).width(percentage + "%");
                $(pc).attr("aria-valuenow", percentage.toString() );
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
                pb.removeClass("active");
                var resContainer = $(p).find(".progress-result")[0];

                if ( result[keys[k]] == null)
                {
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

        ///EVENT

        //click user tag sync
        this.$btnSyncUserTags.click( function(){
            _self.$terminal.attr("src", "/vocabulary/syncUserTags" );
            _self.setIntervalScroll();
        });

        //click data tag sync
        this.$btnSyncDataTags.click( function(){
            _self.$terminal.attr("src", "/vocabulary/syncDataTags" );
            _self.setIntervalScroll();
        });

        //override tokens in data
        this.$btnOverrideDataTokens.click( function(){
            _self.$terminal.attr("src", "/datas/overrideTokensData" );
            _self.setIntervalScroll();
        });

        //cancello l'evento dello scroll
        this.$terminal.on("load", function() {
            _self.$terminal.contents().scrollTop( _self.$terminal.contents().height() + 200);
            clearInterval(_self.intervalScroll);
        });

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
            function()
            {

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
                        _self.writeResultProgress(response);
                        //DomUtil.replaceItSelf( $("#upload_input") );
                    }
                });

                // Have to stop the form from submitting and causing
                // a page refresh - don't forget this
                return false;

            }
        );

        //inizializzo il file input
        this.$btnFiles.fileinput( {
            previewFileType: "json",
            allowedFileExtensions: ["json"]
        });

        this.windowSyncDataTags = null;
        this.documentSyncDataTags = null;
        this.$btnSyncProject.click(function(){
            _self.windowSyncDataTags = window.open("/view/terminal#syncproject");
        });

        //carico il pie delle nazioni
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

        //chiedo il progetto
        this.getProject(function(prj){
            $scope.$apply(function(){
                $scope.Description =  prj.description;
            })
        })
    };

    var prjCtrl = null;

    $scope.name = "ngPrjEditCtrl";

    $scope.ProjectName = window.PROJECT;

    $scope.Description = window.DESCRIPTION;

    $scope.Example = function(){ return prjCtrl.getExample(); };

    $(document).ready(function(){

        prjCtrl = new PrjEditCtrl($scope);

    });

}]);

//var prjEditFormatterTag = new PrjEditFormatterTag();
//var prjEditCtrl = new PrjEditCtrl($scope);
//var PrjEditTableTagAction = {
//
//    tag_click : function(row)  {
//        bootbox.prompt({
//            title: "Edit tag: " + JSON.stringify(row.tag),
//            value: row.tag,
//            callback: function (result) {
//                if (result === null) {
//                    console.log("Prompt edit tag dismissed");
//                } else {
//                    console.log("New tag: " + result);
//                    var data = {
//                        newTag: result,
//                        oldTag: row.tag
//                    };
//                    $.ajax({
//                        url: '/vocabulary/tag',
//                        contentType: "application/json; charset=utf-8",
//                        type: 'move',
//                        async: true,
//                        data: JSON.stringify(data),
//                        dataType: "json",
//                        success: function(html) {
//                            PrjEditFormCtrl.updateTableTag();
//                        },
//                        error: function(xhr, status, error){
//                            alert("Error: " + error);
//                        }
//                    });
//                }
//            }
//        });
//    },
//
//    tokens_click: function(row){
//        bootbox.prompt({
//            title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
//            value: row.tokens,
//            callback: function (result) {
//                if (result === null) {
//                    console.log("Prompt edit vocabulary dismissed");
//                } else {
//                    console.log("New words: " + result);
//                    var data = {
//                        tag: row.tag,
//                        words: result
//                    };
//                    $.ajax({
//                        url: '/vocabulary/words',
//                        contentType: "application/json; charset=utf-8",
//                        type: 'PUT',
//                        async: false,
//                        data: JSON.stringify(data),
//                        dataType: "json",
//                        success: function(html) {
//                            PrjEditFormCtrl.updateTableTag();
//                        },
//                        error: function(xhr, status, error){
//                            alert("Error: " + error);
//                        }
//                    });
//                }
//            }
//        });
//    },
//
//    delete_click: function(row){
//        bootbox.confirm("<h4>Are you sure to delete tag: "
//            + JSON.stringify(row.tag)
//            + "?</h4>",
//            function (result) {
//                if (result) {
//                    console.log("User confirmed delete dialog");
//                    $.ajax({
//                        url: '/vocabulary/tag',
//                        contentType: "application/json; charset=utf-8",
//                        type: 'DELETE',
//                        async: false,
//                        data: JSON.stringify({tag:row.tag}),
//                        dataType: "json",
//                        success: function(html) {
//                            PrjEditFormCtrl.updateTableTag();
//                        },
//                        error: function(xhr, status, error){
//                            alert("Error: " + error);
//                        }
//                    });
//                } else {
//                    console.log("User declined delete dialog");
//                }
//            });
//    }
//};
//var PrjEditFormCtrl = {
//
//    $tableTags : $("#tagsTable") ,
//
//    updateTableTag : function()
//    {
//        this.$tableTags.bootstrapTable('refresh', {silent: true});
//    }
//
//};

///**
// *
// * @param value
// * @param row - riga del json passato come parametro
// *              - row.project: nome del progetto
// *              - row.userProject: utente proprietario del progetto
// * @returns {string} - Html da inserire nella cella
// */
//this.openColumnFormatter = function (value, row)
//{
//    return '<button type="button" class="btn btn-success btn-open">' +
//        '<span class="glyphicon glyphicon-ok selectProj" aria-hidden="true" ' +
//        'project="' + row.projectName + '"' +
//        'onclick="ProjectCtrl.openProject_Click(\'' + row.projectName + '\')"/>' +
//        '</button>';
//};
//
//this.deleteColumnFormatter = function (value, row) {
//
//    return '<button type="button" class="btn btn-danger btn-delete">' +
//        '<span class="glyphicon glyphicon-remove img-delete" aria-hidden="true" ' +
//        'project="' + row.project + '"' +
//        'onclick="ProjectCtrl.deleteProject_Click(\'' + row.projectName + '\')"/>' +
//        '</button>';
//},
//
//    dateCreationFormatter : function (value, row) {
//    var d = new Date(value);
//    return d.toStringDate();
//},
//
//dateLastUpdateFormatter : function (value, row) {
//    var d = new Date(value);
//    return d.toStringDate();
//},

//function progressCaption(value, name) {
//    return  value + "% - " + name;
//}

//var PrjEditFormatterTag = function(){
//
//    function addElement(value, row, index, suffix, event, isDelete) {
//        var $div = $("<div></div>");
//        var $a = $("<a></a>").addClass( suffix + index );
//        var icon = isDelete ? "glyphicon-remove" : "glyphicon-pencil";
//
//        $div.append(
//            $("<div>")
//                .text(value)
//                .css("float", "left")
//                .css("margin-right", "10px")
//        ).append(
//            $a.append(
//                $('<i>')
//                    .addClass("glyphicon")
//                    .addClass(icon)
//                    .css("cursor", "pointer")
//            )
//        );
//
//        if(isDelete)
//        {
//            $div.find("i")
//                .css("left", "39%")
//                .css("right", "40%");
//        }
//
//        $(".tag-" + index).off();
//        PrjEditFormCtrl.$tableTags
//            .off('click', 'a.' + suffix + index)
//            .on('click', 'a.' + suffix + index, function(){
//                event(row);
//            });
//
//        return $div.html();
//    };
//
//    this.tag = function(value, row, index){
//        return addElement(value, row, index, "tag", PrjEditTableTagAction.tag_click );
//    };
//
//    this.vocabulary = function(value, row, index) {
//        return addElement(value.join(', '), row, index, "voc", PrjEditTableTagAction.tokens_click );
//    };
//
//    this.delete = function(value, row, index)
//    {
//        return addElement("", row, index, "del", PrjEditTableTagAction.delete_click, true );
//    };
//
//};