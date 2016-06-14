function refazerLogin($cookies) {
    $cookies.remove('www.gerven.com.br.token');
    $(window.document.location).attr('href', "login.html");
}

app.controller("inicioControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnHome').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});


app.controller("fornecedorControler", function ($scope, $http, $cookies) {
    $('#menu-lateral ul li').removeClass('active');
    $('#btnFornecedor').addClass('active');

    $scope.fornecedorAtual = {};
    $scope.listaFornecedores = [];

    $scope.getListaFornecedorAll = function () {
        var token = $cookies.get('www.gerven.com.br.token');
        if (token != null) {
            var tokenRetorno = {'token': token};
            
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "fornecedor/getAllfornecedor",
                data: tokenRetorno,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (!response.data[1].token) {
                    refazerLogin($cookies);
                } else {
                    $scope.listaFornecedores = response.data[0].dados;
                }
            });
        } else {
            refazerLogin($cookies);
        }
    };

    $scope.novoFornecedor = function () {
        $scope.fornecedorAtual = {};
    };

    $scope.preparaFornecedor = function (fornecedor) {
        $scope.fornecedorAtual = fornecedor;
    };

    $scope.updateFornecedor = function () {
        var token = $cookies.get('www.gerven.com.br.token');
        if (token != null) {
            var envio = {'dados': $scope.fornecedorAtual, 'token': token};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "fornecedor/updateFornecedor",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                $scope.fecharDialog('#cadastroFornecedorDialogAlterar');
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    alert('Salvado com sucesso!');
                    $scope.getListaFornecedorAll();
                }
            });
        } else {
            refazerLogin($cookies);
        }
    };

    $scope.fecharDialog = function (idModal) {
        $(idModal).modal('hide');
        if (idModal == '#cadastroFornecedorDialogAlterar') {
            $scope.getListaFornecedorAll();
        }
    };

    $scope.getListaFornecedorAll();

});


app.controller("produtoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("clienteControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnCliente').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("boletoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnBoleto').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("pedidoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnPedido').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("usuarioControler", function ($scope, $http, $cookies) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.logar = function () {
        $http({
            method: 'GET',
            crossDomain: true,
            url: urlWs + "usuario/logar",
            headers: {'Content-Type': 'application/json'}
        }).then(function successCallback(response) {
            if (!response.data.token) {

            } else {
                $cookies.put('www.gerven.com.br.token', response.data.token);
                verifica();
            }
        });
    }

    var verifica = function () {
        if ($cookies.get('www.gerven.com.br.token')) {
            $(window.document.location).attr('href', "index.html");
        } else {
            alert('fazer Login');
        }
    };

    verifica();

});

app.controller("infoControler", function ($scope, $http) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnInfor').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

