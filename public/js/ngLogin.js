"use strict";
var app = angular.module('login', []);

app.controller("LoginCtrl", function ($scope) {

    $scope.userAdded = function(){
        return location.hash == "#useradd";
    };
});