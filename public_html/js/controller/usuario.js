(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("usuarioControler", ['$scope', '$http', 'Factory', function ($scope, $http, $cookies, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnUsuario');
            $scope.usuario = {usuario: '', senha: ''};
        }]);
})();