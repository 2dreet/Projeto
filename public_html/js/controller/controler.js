app.controller("inicioControler", function ($scope, UserFactory, $http, Produto) {
    
//    $('#menu-lateral ul li').removeClass('active');
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


app.controller("fornecedorControler", function ($scope, UserFactory, $http, Produto) {
    
//    $('#menu-lateral ul li').removeClass('active');
    $('#btnFornecedor').addClass('active');
    
    $scope.alerta = function(){
        alert('asdasd');
    };
    
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


app.controller("produtoControler", function ($scope, UserFactory, $http, Produto) {
     
//    $('#menu-lateral ul li').removeClass('active');
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

app.controller("clienteControler", function ($scope, UserFactory, $http, Produto) {
    
//    $('#menu-lateral ul li').removeClass('active');
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

app.controller("boletoControler", function ($scope, UserFactory, $http, Produto) {
    
//    $('#menu-lateral ul li').removeClass('active');
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

app.controller("pedidoControler", function ($scope, UserFactory, $http, Produto) {
    
//    $('#menu-lateral ul li').removeClass('active');
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

app.controller("usuarioControler", function ($scope, UserFactory, $http, Produto) {
    
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

app.controller("infoControler", function ($scope, UserFactory, $http, Produto) {
     
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

