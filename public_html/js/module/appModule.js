var app = angular.module('app', ['ngRoute', 'ngResource']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'home.html'
            })
            .when('/info', {
                templateUrl: 'info.html'
            })
            .otherwise({
                redirectTo: '/'
            });
});