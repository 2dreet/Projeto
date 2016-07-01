var app = angular.module('www.geve.com.br', ['ngRoute', 'ngResource', 'ui.utils.masks', 'ui.mask', 'cgBusy', 'ngBusy', 'ui.bootstrap']);
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

app.value('cgBusyDefaults',{
  backdrop: false,
  templateUrl: 'loadin.html',
  delay: 0,
  minDuration: 0
});
