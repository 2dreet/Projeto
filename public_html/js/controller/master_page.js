angular.module('www.geve.com.br').controller("masterPageControler", function ($scope, $http) {

    $scope.pessoa = {nome: ''};

    $scope.sair = function () {
        refazerLogin();
    };

    $scope.verifica = function () {
        if (verificaToken(true)) {
            var envio = {'token': getToken(true)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "usuario/getUsuario",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (!response.data[1].token) {
                    refazerLogin();
                } else {
                    $scope.pessoa = response.data[0].dados;
                }
            }, function errorCallback(response) {
                alert('Erro Sistema');
            });
        }
    };

    $scope.verifica();

});