ngApp.controller('ngNavCtrl', ['$scope', function($scope) {

    $scope.Logout = function(){
        $.get("/logout", function(result){
            if(result=="ok") location.reload();
        });
    };

    var lvl = window.LEVEL;
    if(window.LEVEL <= 0){
        $(".canberemoved").hide();
        //$("#menu-project-newproject").hide();

    }

}]);