var ngApp = angular.module('bigDataManager', [
    'ngRoute'
]);

ngApp.factory('Todos', function(){
    return [
        { name: 'AngularJS Directives', completed: true, note: 'add notes...' },
        { name: 'Data binding', completed: true, note: 'add notes...' },
        { name: '$scope', completed: true, note: 'add notes...' },
        { name: 'Controllers and Modules', completed: true, note: 'add notes...' },
        { name: 'Templates and routes', completed: true, note: 'add notes...' },
        { name: 'Filters and Services', completed: false, note: 'add notes...' },
        { name: 'Get started with Node/ExpressJS', completed: false, note: 'add notes...' },
        { name: 'Setup MongoDB database', completed: false, note: 'add notes...' },
        { name: 'Be awesome!', completed: false, note: 'add notes...' }
    ];
});

ngApp.controller('ngAppCtrl', ['$scope', function($scope) {

    var _self = $scope;
    var toggle = true;

    $(".page-container")
        .removeClass("sidebar-collapsed")
        .addClass("sidebar-collapsed-back");
    setTimeout(function() {
        $("#menu span").css({"position":"relative"});
    }, 400);

    $(".sidebar-icon").click(function() {

        //notifico che è stato modificato il layout
        var $scopeNgView = angular.element($("#ngview")).scope();
        if( $scopeNgView.resize )
            $scopeNgView.resize();

        if (toggle){
            $(".row-footer").addClass("row-footer-collapsed");
            $(".page-container")
                .addClass("sidebar-collapsed")
                .removeClass("sidebar-collapsed-back");
            $("#menu span").css({"position":"absolute"});
        }
        else {
            $(".page-container")
                .removeClass("sidebar-collapsed")
                .addClass("sidebar-collapsed-back");
            setTimeout(function() {
                $("#menu span").css({"position":"relative"});
                $(".row-footer").removeClass("row-footer-collapsed");
            }, 400);
        }

        toggle = !toggle;

    });

    var links = $("#sidebar-menu").find("a");
    links.click(function(e){
        var item = e.currentTarget;
        var className = item.className;
        if(className == "link-menu")
        {
            //notifico che è cambiata la pagina
            var $scopeNgView = angular.element($("#ngview")).scope();
            if( $scopeNgView.onItemClick)
                $scopeNgView.onItemClick();

            var href = $(item).attr( 'href' );
            location.href = href;
        }
        e.preventDefault();
    });

    $(window).resize(function () { _self.resizeMenu(); });

    $scope.name = "ngAppCtrl";

    $scope.resizeMenu = function(){
        $("#menu>nav").height( $("#content").height() + 120 );
    };

    $scope.collapseStart = function(){ console.log("collapseStart"); };

    $scope.srcUser = function() {
        return window.ISGUEST == "true" ?
            "fa fa-user-secret fa-2x" :
            "fa fa-user fa-2x"

    };

    $scope.Username = function(){
        return window.ISGUEST == "true" ?
            "guest" :
            window.USERNAME
    };

    $scope.Project =  window.PROJECT;

    $scope.Refresh = function(project){
        $scope.$apply(function () {
            $scope.Project = project
        });
    };

    $scope.GetCtrl = function(){
        var $scope = angular.element($("#ngview")).scope();
        console.log($scope.name);
        return $scope;
    }

}]);

// -----------
// router
// -----------

ngApp.config( ['$routeProvider', function ($routeProvider) {

    $routeProvider
        .when('/', {
            templateUrl: '/view/home'
        })
        .when('/home', {
            templateUrl: '/view/home'
        })
        //DB
        .when('/db/users', {
            templateUrl: '/view/db/users',
            controller: 'ngDbUsersCtrl'
        })
        .when('/db/nations', {
            templateUrl: '/view/db/nations',
            controller: 'ngDbNationsCtrl'
        })
        //PROJECTS
        .when('/project/openproject', {
            templateUrl: '/view/project/openproject'
        })
        .when('/project/editproject', {
            templateUrl: '/view/project/editproject',
            controller: 'ngPrjEditCtrl'
        })
        .when('/project/newproject', {
            controller: 'ngPrjNewCtrl',
            templateUrl: '/view/project/newproject'
        })
        //STATISTICS
        .when('/stat/showdata', {
            templateUrl: '/view/stat/showdata',
            controller: 'ngStatDataCtrl'
        })
        .when('/stat/showmap', {
            templateUrl: '/view/stat/showmap',
            controller: 'ngStatMapCtrl'
        })
        .when('/stat/compare', {
            templateUrl: '/view/stat/compare',
            controller: "ngStatCompareCtrl"
        })
        .when('/stat/timeline', {
            controller: 'ngStatTimeLineCtrl',
            templateUrl: '/view/stat/timeline'
        })
        .when('/stat/showtag', {
            templateUrl: '/view/stat/showtag',
            controller: 'ngStatCloudCtrl'
        })
        .when('/stat/showusers', {
            templateUrl: '/view/stat/showusers',
            controller: 'ngStatUsersCtrl'
        })
}]);


