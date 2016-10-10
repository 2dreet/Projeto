(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("loginControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            $scope.usuario = {usuario: '', senha: ''};
            $scope.logar = function () {
                var usuario = $scope.usuario.usuario;
                var senha = $scope.usuario.senha;
                if (usuario !== null && usuario.trim() !== "" && usuario !== null && usuario.trim() !== "") {
                    var envio = {'dados': $scope.usuario};
                    $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "usuario/logar",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (response.data.msgErro) {
                            Factory.setMensagemTemporaria('erro', response.data.msgErro, '#msgUsuario');
                        } else {
                            Factory.setToken(response.data.token);
                            $scope.verifica();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', "Erro de comunicação", '#msgUsuario');
                    });
                }
            };

            $scope.verifica = function () {
                if (Factory.verificaToken(false)) {
                    $(window.document.location).attr('href', "home.html");
                }
            };

            onload = function () {
                document.body.style.visibility = "visible";
            };

            $scope.verifica();
        }]);
})();