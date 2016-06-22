var urlWs = "http://localhost:8084/WsJosePhp/";
var debug = "?XDEBUG_SESSION_START=netbeans-xdebug";


$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/fornecedor.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/boleto.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/cliente.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/info.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/inicio.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/login.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/master_page.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/pedido.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/produto.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/usuario.js'></script>");

app.controller("produtoControler", function ($scope, $http, $cookies) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $scope.produtoAtual = {};
    $scope.listaProduto = [];
    $scope.getImagem = urlWs + "produto/getProdutoImagem/";

    $scope.getImagem = function (idItem) {
        if (verificaToken($cookies)) {
            return urlWs + "produto/getProdutoImagem/" + idItem + "/" + getToken($cookies);
        }
    };

    $scope.getListaProdutoAll = function () {
        if (verificaToken($cookies)) {
            $http({
                method: 'GET',
                crossDomain: true,
                url: urlWs + "produto/getAllproduto/" + getToken($cookies)
            }).then(function successCallback(response) {
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    $scope.listaProduto = response.data.dados;
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.insertProduto = function () {
        if ($scope.validaProduto()) {
            alert('produto' + $scope.produtoAtual.fornecedor);
        }
    }


    $scope.onFileSelect = function () {
        $scope.message = "";
        if (verificaToken($cookies)) {
            $scope.produtoAtual = {id: 1};
            var fd = new FormData();
            var myFile = $('#cadastroProdutoDialogImagemProduto').prop('files');
            fd.append('file', myFile[0]);
            fd.append('token', getToken($cookies));
            fd.append('dados', angular.toJson($scope.produtoAtual));
            $http({
                url: urlWs + 'produto/updateProduto' + debug,
                method: 'POST',
                data: fd,
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response) {
                if (!response.data.token) {
                    refazerLogin($cookies);
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.validaProduto = function () {
        var retorno = false;
        if ($scope.produtoAtual != null) {

            if ($scope.produtoAtual.descricao != null && $scope.produtoAtual.descricao.trim() != "") {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.produtoAtual.valor != null && $scope.produtoAtual.valor.trim() != "" && $scope.produtoAtual.valor > 0) {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.produtoAtual.estoque != null && $scope.produtoAtual.estoque.trim() != "" && $scope.produtoAtual.valor > 0) {
                retorno = true;
            } else {
                retorno = false;
            }
        }
        return retorno;
    };

    $scope.preparaProduto = function (produto) {
        $scope.produtoAtual = Object.assign({}, produto);
    };


    $scope.getListaProdutoAll();
});
