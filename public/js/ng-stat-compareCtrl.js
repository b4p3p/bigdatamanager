ngApp.controller('ngStatCompareCtrl', ['$scope', function($scope) {

    $scope.name = "ngStatCompareCtrl";

    var intervalResize = setInterval( function(){
        $(window).trigger('resize');
        console.log("resize");
    }, 500 );

    //quando clicck sul menu devo disattivare sempre il timer dei dati
    $scope.onItemClick = function() {
        clearInterval(intervalResize);
    };

}]);