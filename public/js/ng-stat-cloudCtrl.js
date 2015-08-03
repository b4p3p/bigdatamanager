ngApp.controller('ngStatCloudCtrl', ['$scope', function($scope) {

    $scope.name = "ngStatCloudCtrl";

    $scope.resize = function()
    {
        setTimeout(function() {
            $(window).trigger('resize');
            if (mapCtrl && mapCtrl.mainMap)
                mapCtrl.mainMap.invalidateSize();
        }, 600);
    };

    //quando clicck sul menu devo disattivare sempre il timer dei dati
    $scope.onItemClick = function() {
        //clearInterval(intervalResize);
    };

}]);