(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("masterPageControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            $scope.pessoa = {nome: ''};
            $scope.sair = function () {
                Factory.refazerLogin();
            };
            $scope.verifica = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(true)};
                    $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "usuario/getUsuario",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data[1].token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.pessoa = response.data[0].dados;
                        }
                    }, function errorCallback(response) {
                        alert('Erro Sistema');
                    });
                }
            };
            $scope.verifica();
        }]);
})();