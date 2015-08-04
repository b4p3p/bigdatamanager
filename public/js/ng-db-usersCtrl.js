"use strict";

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
            var date = new Date(value);
            return date.toStringDate();
        }

    };

    $scope.test = function(){
        return "test";
    }

}]);