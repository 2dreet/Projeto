//app.controller("produtoControler", function ($scope, $http, $cookies) {
//
//    $('#menu-lateral ul li').removeClass('active');
//    $('#btnProduto').addClass('active');
//
//    $scope.produtoAtual = {};
//    $scope.listaProduto = [];
//    $scope.getImagem = urlWs + "produto/getProdutoImagem/";
//
//    $scope.getImagem = function (idItem) {
//        if (verificaToken($cookies)) {
//            return urlWs + "produto/getProdutoImagem/" + idItem + "/" + getToken($cookies);
//        }
//    };
//
//    $scope.getListaProdutoAll = function () {
//        if (verificaToken($cookies)) {
//            $http({
//                method: 'GET',
//                crossDomain: true,
//                url: urlWs + "produto/getAllproduto/" + getToken($cookies)
//            }).then(function successCallback(response) {
//                if (!response.data[1].token) {
//                    refazerLogin($cookies);
//                } else {
//                    $scope.listaProduto = response.data[0].dados;
//                }
//            }, function errorCallback(response) {
//                alert('Erro no sistema!');
//            });
//        }
//    };
//
//
//    $scope.updateProduto = function () {
//        if (verificaToken($cookies)) {
//            var envio = {'dados': $scope.produtoAtual, 'token': getToken($cookies)};
//            $http({
//                method: 'POST',
//                crossDomain: true,
//                url: urlWs + "produto/updateProduto",
//                data: envio,
//                headers: {'Content-Type': 'application/json'}
//            }).then(function successCallback(response) {
//                if (!response.data[1].token) {
//                    refazerLogin($cookies);
//                } else {
//                    alert('alterado');
//                }
//            }, function errorCallback(response) {
//                alert('Erro no sistema!');
//            });
//        }
//    };
//
//    $scope.preparaProduto = function (produto) {
//        $scope.produtoAtual = Object.assign({}, produto);
//    };
//
//
//    $scope.getListaProdutoAll();
//});
