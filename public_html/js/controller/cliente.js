angular.module('www.geve.com.br').controller("clienteControler", function ($rootScope, $scope, $http) {
    verificaToken(true);
    ajustaMenuLateral('#btnCliente');

    $scope.listaCliente = [];
    $scope.valorBusca = "";
    $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};

    $scope.maxSize = 3;
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.itensPorPagina = 10;

    $scope.getListaClienteAll = function (pagina) {
        if (verificaToken(true)) {
            var envio = {'pagina': (pagina - 1), 'token': getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca};

            $rootScope.loading = $http({
                method: 'POST',
                data: envio,
                crossDomain: true,
                url: urlWs + "produto/getAllproduto",
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (!response.data.token) {
                    refazerLogin();
                } else {
                    $scope.listaCliente = response.data.dados;
                    $scope.totalItems = response.data.totalRegistro;
                }
            }, function errorCallback(response) {
                setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
            });
        }
    };

});
