ngApp.controller('ngNavCtrl', ['$scope', function($scope) {

    $scope.Logout = function(){
        $.get("/logout", function(result){
            if(result=="ok") location.reload();
        });
    }
}]);