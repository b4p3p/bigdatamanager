"use strict";

var DBUsersCtrl = function(){};

DBUsersCtrl.cmdDeleteClick = function(username){
    console.log("click:" + username);

    bootbox.dialog({
        title: "Confirm operation",
        message: "<div>Do you really want to delete the user and ALL your projects?</div>" +
                 "<div style='margin-top: 10px' id='progress'></div>",
        buttons: {
            //success: {
            //    label: "Oh no!",
            //    className: "btn-success",
            //    callback: function() {
            //        Example.show("great success");
            //    }
            //},
            danger: {
                label: "Yes, sure!",
                className: "btn-danger",
                callback: function(e) {

                    $.ajax({
                        type:'post',
                        url: '/users/deluser',
                        data: {user: username},
                        success:function(result){
                            $("#progress").text("Fatto!");
                            setTimeout(function(){
                                window.location.reload();
                            },1000);
                        },
                        error:function(err){
                            alert(err.responseText);
                        }
                    });

                    return false;
                }
            }
        }
    });
};

ngApp.controller('ngDbUsersCtrl', ['$scope', function($scope) {

    $scope.name = "ngDbUsersCtrl";

    $("#table-users").bootstrapTable({});

    $scope.formatter = {

        level: function(value, obj, index){

            var ris = $("<div/>")
                .addClass("level")
                .text(value);

            switch(value){
                case 1: ris.addClass("admin"); break;
                case 0: ris.addClass("user"); break;
            }

            return ($("<div/>").append(ris)).html();
        },

        toStringDate: function(value, obj, index) {
            if(!value) return "-";
            var date = new Date(value);
            return date.toStringDate();
        },

        delete: function(value, obj, index){

            var btn = $("<a />")
                .addClass("btn btn-danger btn-delete")
                .attr("onclick", "DBUsersCtrl.cmdDeleteClick(\"" + obj.username + "\")" )
                .append("<i class='img-delete'></i>")
                .addClass("fa fa-trash-o fa-lg");

            return $("<div>").append(btn).html();

        }
    };

}]);