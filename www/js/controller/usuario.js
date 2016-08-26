(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("usuarioControler", ['$rootScope', '$scope', '$http', 'Factory', function ($rootScope, $scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnUsuario');
            $rootScope.paginaAtual = "Usuário";
            $rootScope.paginaAtualClass = "fa fa-cog botaoComIconeMenuLateral";
            $scope.usuario = {usuario: '', senha: ''};
        }]);
})();