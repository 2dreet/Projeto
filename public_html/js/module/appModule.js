var app = angular.module('app', ['ngRoute', 'ngResource','ngCookies', 'ui.utils.masks']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'com.br.html/inicio/inicio.html'
            })
            .when('/fornecedor', {
                templateUrl: 'com.br.html/fornecedor/fornecedor.html'
            })
            .when('/cliente', {
                templateUrl: 'com.br.html/cliente/cliente.html'
            })
            .when('/produto', {
                templateUrl: 'com.br.html/produto/produto.html'
            })
            .when('/boleto', {
                templateUrl: 'com.br.html/boleto/boleto.html'
            })
            .when('/pedido', {
                templateUrl: 'com.br.html/pedido/pedido.html'
            })
            .when('/usuario', {
                templateUrl: 'com.br.html/usuario/usuario.html'
            })
            .when('/info', {
                templateUrl: 'com.br.html/info/info.html'
            })
            .otherwise({
                redirectTo: '/'
            });
});

