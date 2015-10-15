var PrjOpenFormatter = {
    date: function(value){
        var d = new Date(value);
        return d.toStringDate();
    },
    delete: function(value, row){

        if( window.LEVEL == -1) return;

        var btn = $("<a />")
            .addClass("btn btn-danger btn-all")
            .attr("onclick", "cmdDeleteClick(\"" + row.projectName + "\")" )
            .append("<i class='img-delete'></i>")
            .addClass("fa fa-trash-o fa-lg");

        return $("<div>").append(btn).html();
    },
    open: function(value, row){
        var btn = $("<a />")
            .addClass("btn btn-success btn-all btn-open")
            .attr("onclick", "cmdOpenClick(\"" + row.projectName + "\")" )
            .append("<i></i>")
            .addClass("fa fa-check fa-lg");

        return $("<div>").append(btn).html();
    }
};
var $table = $("#tableProjects");

function cmdDeleteClick(project) {
    bootbox.confirm("Are you sure you want to delete this project?<br><b>" + project + "</b>", function(result)
    {
        if(result) deleteProject(project);
    });
}

function cmdOpenClick(project) {
    $.ajax({
        type: "POST",
        crossDomain:true,
        dataType: "json",
        url: "/project/setproject",
        data: { project: project } ,
        success: function(msg) {
            if(msg.status == 200) { location.replace("/view/app/#home"); }
        },
        error: function(xhr, status, error) {
            console.error("ERR: cmdOpenClick: " + status + " " + xhr.status + "\n" + error);
        }
    });
}

function deleteProject(project) {
    /**
     *      success message: {
         *          status: 0 | >0   0:OK  >0:Error
         *          message: info
         *      }
     */
    var html = "";
    $.ajax( {
        type: "POST",
        crossDomain:true,
        dataType: "json",
        url: "/project/delproject",
        data: { project: project } ,
        success: function(msg)
        {
            if(msg.status == 0)
            {
                html =
                    '<div class="alert alert-success">' +
                    "Project has been removed" + '<br>' +
                    'Deleted: ' + msg.deletedCount + " items" +
                    '</div>';

                bootbox.alert(html, function() {
                    //window.location.reload();
                    $table.bootstrapTable("refresh", {silent: true});
                });
            }
            else
            {
                html = '<div class="alert alert-danger">' + msg.message + '</div>';
                bootbox.alert(html, function() {
                    //window.location.reload();
                    $table.bootstrapTable("refresh", {silent: true});
                });
            }
        },
        error: function(xhr, status, error)
        {
            console.error("ERR: openProject_Click: " + status + " " + xhr.status + "\n" + error);
            $table.bootstrapTable("refresh", {silent: true});
        }
    });
}

ngApp.controller('ngPrjOpenCtrl', ['$scope', function($scope) {

    $scope.name = "ngPrjOpenCtrl";

    var $table = $("#tableProjects");





    $(document).ready(function(){
        $("#tableProjects").bootstrapTable( {url:"/project/projects"} );
    });

}]);