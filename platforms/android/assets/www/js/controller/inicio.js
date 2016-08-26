(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("inicioControler", ['$rootScope', '$scope', '$http', 'Factory', function ($rootScope, $scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnHome');
            $rootScope.paginaAtual = "Home";
            $rootScope.paginaAtualClass = "fa fa-home botaoComIconeMenuLateral";
        }]);
})();