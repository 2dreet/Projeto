app.controller("loginControler", function ($scope, $http, $cookies) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.usuario = {usuario: '', senha: ''};
    $scope.msgErro = null;

    $scope.isMsgErro = function () {
        if ($scope.msgErro !== null) {
            return true;
        } else {
            return false;
        }
    };

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
                    $("#msgUsuario").html(getMensagem('erro', response.data.msgErro));
                } else {
                    setToken(response.data.token, $cookies);
                    if (verificaToken($cookies)) {
                        $(window.document.location).attr('href', "index.html");
                    }
                }
            }, function errorCallback(response) {
                alert('Erro Sistema');
            });
        }
    };

    $scope.verifica = function () {
        if (verificaLogin($cookies)) {
            $(window.document.location).attr('href', "index.html");
        }
    };

    $scope.verifica();
});