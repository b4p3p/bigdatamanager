ngApp.controller('ngPrjNewCtrl', ['$scope', function($scope) {

    var $message = null;
    var mainCtrl = angular.element($("body")).scope();

    $scope.name = "ngPrjNewCtrl";
    $scope.message = "messaggio di test";

    var options = {
        success: function(result){
            if( result.status > 0 ) {
                $scope.$apply(function () {
                    $scope.message = result.message;
                });
                $message.show();
            }else{
                mainCtrl.Refresh(result.newproject);
                window.location = "/view/app#/project/editproject";
            }
        },
        error: function(error){
            console.log("error");
        }
    };

    $(document).ready(function() {
        $message = $("#message");
        $('#newproject_form').ajaxForm(options);
    });
}]);