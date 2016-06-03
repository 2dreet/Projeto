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
    return $resource("http://localhost:8081/WebJoseWS/texto", {},
            {
                create: {
                    method: 'POST'

                }

            });
});
