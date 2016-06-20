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
                if (!response.data[1].token) {
                    refazerLogin($cookies);
                } else {
                    $scope.listaProduto = response.data[0].dados;
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };


    $scope.onFileSelect = function () {
        $scope.message = "";
        if (verificaToken($cookies)) {
            var envio = {'dados': $scope.produtoAtual, 'token': getToken($cookies)};
            var fd = new FormData();
            var myFile = $('#cadastroProdutoDialogImagemProduto').prop('files');
            fd.append('file', myFile[0]);
            fd.append('envio', envio);

            console.log(myFile);
            $http({
                url: 'produto/updateProduto',
                method: 'POST',
                data: fd,
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function (data, status, headers, config) {
                $scope.message = data;
            }).error(function (data, status) {
                $scope.message = data;
            });
        }
    };


    $scope.preparaProduto = function (produto) {
        $scope.produtoAtual = Object.assign({}, produto);
    };


    $scope.getListaProdutoAll();
});
