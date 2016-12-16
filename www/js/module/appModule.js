var app = angular.module('www.geve.com.br', ['ngRoute', 'ui.utils.masks', 'ui.mask', 'cgBusy', 'ui.bootstrap', 'ngMaterial', 'chart.js']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'inicio/inicio.html'
            })
            .when('/fornecedor', {
                templateUrl: 'fornecedor/fornecedor.html'
            })
            .when('/cliente', {
                templateUrl: 'cliente/cliente.html'
            })
            .when('/produto', {
                templateUrl: 'produto/produto.html'
            })
            .when('/pedido', {
                templateUrl: 'pedido/pedido.html'
            })
            .when('/despesas', {
                templateUrl: 'despesas/despesas.html'
            })
            .when('/contas', {
                templateUrl: 'contas/contas.html'
            })
            .when('/usuario', {
                templateUrl: 'usuario/usuario.html'
            })
            .when('/info', {
                templateUrl: 'info/info.html'
            })
            .otherwise({
                redirectTo: '/'
            });
});

app.filter('tel', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        if (str.length === 11) {
            str = str.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else {
            str = str.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return str;
    };
});

app.filter('cpf', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        str = str.replace(/(\d{3})(\d)/, '$1.$2');
        str = str.replace(/(\d{3})(\d)/, '$1.$2');
        str = str.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return str;
    };
});

app.filter('cep', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        str = str.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2-$3');
        return str;
    };
});

app.value('cgBusyDefaults', {
    backdrop: false,
    templateUrl: 'loadin.html',
    delay: 0,
    minDuration: 0
});

app.config(['ChartJsProvider', function (ChartJsProvider) {
        ChartJsProvider.setOptions({
        });
        ChartJsProvider.setOptions('line', {
        });
    }]);
