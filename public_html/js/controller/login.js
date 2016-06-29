angular.module('www.geve.com.br').controller("loginControler", function ($scope, $http) {

    $scope.usuario = {usuario: '', senha: ''};

    $scope.logar = function () {
        var usuario = $scope.usuario.usuario;
        var senha = $scope.usuario.senha;
        if (usuario !== null && usuario.trim() !== "" && usuario !== null && usuario.trim() !== "") {
            var envio = {'dados': $scope.usuario};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "usuario/logar",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (response.data.msgErro) {
                    setMensagemTemporaria('erro', response.data.msgErro, '#msgUsuario');
                } else {
                    setToken(response.data.token);
                    $scope.verifica();
                }
            }, function errorCallback(response) {
                setMensagemTemporaria('erro', "Erro de comunicação", '#msgUsuario');
            });
        }
    };

    $scope.verifica = function () {
        if (verificaToken(false)) {
            $(window.document.location).attr('href', "index.html");
        }
    };

    $scope.verifica();
});