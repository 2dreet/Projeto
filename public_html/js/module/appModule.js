var app = angular.module('app', ['ngResource', 'ngRoute']);
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

app.factory('UserFactory', function NoteNgResourceFactory($resource) {
    return $resource("/WebJoseWS/texto", {}, {
        'get': {
            method: 'GET', 
            cache: false,
            isArray:false,
            headers:{'Content-Type':'application/json; charset=UTF-8'} 
        }
    });
});
