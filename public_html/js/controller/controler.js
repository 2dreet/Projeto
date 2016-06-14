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


app.controller("fornecedorControler", function ($scope, $http) {
    $('#menu-lateral ul li').removeClass('active');
    $('#btnFornecedor').addClass('active');

    $scope.fornecedorAtual = {};
    $scope.listaFornecedores = [];

    $scope.getListaFornecedorAll = function () {
        $http({
            method: 'GET',
            crossDomain: true,
            url: urlWs + "fornecedor/getAllfornecedor",
            headers: {'Content-Type': 'application/json'}
        }).then(function successCallback(response) {
            $scope.listaFornecedores = response.data;
        });
    };

    $scope.novoFornecedor = function () {
        $scope.fornecedorAtual = {};
    };

    $scope.preparaFornecedor = function (fornecedor) {
        $scope.fornecedorAtual = fornecedor;
    };

    $scope.updateFornecedor = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: urlWs + "fornecedor/updateFornecedor",
            data: $scope.fornecedorAtual,
            headers: {'Content-Type': 'application/json'}
        }).then(function successCallback(response) {
            $scope.fecharDialog('#cadastroFornecedorDialogAlterar');
            alert('Salvado com sucesso!\n'+response.data.descricao);
        });
    };

    $scope.fecharDialog = function (idModal) {
        $(idModal).modal('hide');
        if(idModal == '#cadastroFornecedorDialogAlterar'){
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

app.controller("usuarioControler", function ($scope, $http) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

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

