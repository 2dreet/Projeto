var app = angular.module('www.geve.com.br', ['ngRoute', 'ui.utils.masks', 'ui.mask', 'cgBusy', 'ui.bootstrap']);
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
