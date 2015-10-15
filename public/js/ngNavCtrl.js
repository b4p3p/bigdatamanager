"use strict";

//ngApp.controller('ngNavCtrl', ['$scope', function($scope) {
ngApp.controller('ngNavCtrl', function($scope) {

    $scope.Logout = function(){
        $.get("/logout", function(result){
            if(result=="ok") location.reload();
        });
    };



});