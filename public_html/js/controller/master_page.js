app.controller("masterPageControler", function ($scope, $http, $cookies) {

    $scope.pessoa = {nome: ''};

    $scope.sair = function () {
        refazerLogin($cookies);
    };

    $scope.verifica = function () {
        if (verificaToken($cookies)) {
            var envio = {'token': getToken($cookies)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "usuario/getUsuario",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (!response.data[1].token) {
                    refazerLogin($cookies);
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