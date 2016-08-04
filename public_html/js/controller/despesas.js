(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("despesasController", ['$rootScope', '$scope', '$http', 'Factory', function ($rootScope, $scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnDespesas');
            $rootScope.paginaAtual = "Despesas";
            $rootScope.paginaAtualClass = "fa fa-usd botaoComIconeMenuLateral";
            
        }]);
})();