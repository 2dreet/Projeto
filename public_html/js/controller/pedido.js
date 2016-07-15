(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("pedidoControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnPedido');
        }]);
})();