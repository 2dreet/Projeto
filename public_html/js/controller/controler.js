app.controller("inicioControler", function ($scope, $http, Produto) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnHome').addClass('active');

    $scope.produto = new Produto();
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

    $scope.fecharDialog = function (idModal) {
        $(idModal).modal('hide');
    };

    $scope.getListaFornecedorAll();

});


app.controller("produtoControler", function ($scope, UserFactory, $http, Produto) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $scope.produto = new Produto();
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

app.controller("clienteControler", function ($scope, $http, Produto) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnCliente').addClass('active');

    $scope.produto = new Produto();
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

app.controller("boletoControler", function ($scope, $http, Produto) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnBoleto').addClass('active');

    $scope.produto = new Produto();
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

app.controller("pedidoControler", function ($scope, $http, Produto) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnPedido').addClass('active');

    $scope.produto = new Produto();
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

app.controller("usuarioControler", function ($scope, $http, Produto) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.produto = new Produto();
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

app.controller("infoControler", function ($scope, $http, Produto) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnInfor').addClass('active');

    $scope.produto = new Produto();
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

