var scope = null;

var Formatter = {
    deleteFormatter: function(value, row, index)
    {
        var $button = $('<button type="button" class="btn btn-danger btn-delete">')
            .attr("onclick", "scope.delNation(\"" + row.nation + "\")" )
            .append('<i class="glyphicon glyphicon-remove"></i>');

        return $button.outerHTML();
    }
};

ngApp.controller('ngDbNationsCtrl', ['$scope', function($scope) {

    var optionsCtrl = {

        timeout: 1000 * 120,  //120s,

        beforeSend: function (event) { uploaderCtrl.initProgress(); },

        uploadProgress: function (event, position, total, percentage, file) {
            uploaderCtrl.updateProgress(percentage);
        },

        error: function (xhr) { uploaderCtrl.onError(xhr); } ,

        success: function (response) {
            uploaderCtrl.onSuccess(response);
            updateTable();
        }

    };

    var uploaderCtrl = new UploaderCtrl(
        $("#uploadNationsForm"),
        $("#btnFilesNations"),
        $("#progress-container"),
        optionsCtrl, submitFn);

    function updateTable() {
        $tableNations.bootstrapTable('refresh', {silent: true});
    }

    var $tableNations = $("#table-nations");

    scope = $scope;

    $scope.name = 'ngDbNationsCtrl';

    $scope.delNation = function(nation)
    {
        bootbox.confirm("Are you sure you want to delete the follow nation:<br>" + nation.toUpperCase() ,
            function(confirm) {
                if(confirm) {
                    $.ajax({
                        type: "delete",
                        url: "/regions/nation",
                        data: {nation: nation},
                        success: function (data) {

                            //example data: deletedRegion: {Number}, updatedData: {Number}
                            console.log("SUCCESS delete nation - " + JSON.stringify(data));

                            bootbox.alert("<b>Deleted region:</b> " + data.deletedRegion + "<br>" +
                                "<b>Updated data:</b> " + data.updatedData);

                            updateTable();
                        },
                        error: function (xhr, status, error) {
                            console.error("ERR: ShowmapCtrl.delNation " + status + " " + xhr.status);
                            console.error("     Status: " + status + " " + xhr.status);
                            console.error("     Error: " + error);
                        }
                    });

                }
            }
        );
    };

    $scope.uploadNation = function(){
        uploaderCtrl.upload();
    };

    function submitFn()
    {
        $(this).ajaxSubmit( optionsCtrl ) ;

        // Have to stop the form from submitting and causing
        // a page refresh - don't forget this
        return false;

    }

    //var DBNationsCtrl =
    //{
    //    regions: null,
    //
    //    getNations: function()
    //    {
    //        console.log("CALL: getNations");
    //
    //        $.ajax({
    //            type: "get",
    //            crossDomain: true,
    //            dataType: "json",
    //            url: "/getregions?DEBUG=1",
    //            success: function (data) {
    //                DBNationsCtrl.regions = data;
    //                DBNationsCtrl.$tableNations.bootstrapTable('load', DBNationsCtrl.regions );
    //            },
    //            error: function (xhr, status, error) {
    //                console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
    //                console.error("     Status: " + status + " " + xhr.status);
    //                console.error("     Error: " + error);
    //            }
    //        });
    //
    //    },
    //
    //
    //};

}]);


//DBNationsCtrl.init();
//
//uploaderCtrl = new UploaderCtrl(
//    $("#uploadNationsForm"),
//    $("#btnFilesNations"),
//    $("#progress-container"),
//    optionsCtrl, submitFn);