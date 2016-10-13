
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroProdutoController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.buscaAvancadaProduto = {};
            $scope.valorBuscaProduto = "";
            $scope.listaProduto = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.tipoFuncao = 0;
            $scope.getImagem = function (idItem) {
                if (Factory.verificaToken(true) && idItem > 0) {
                    var random = (new Date()).toString();
                    return Factory.urlImagem + idItem + "/" + Factory.getToken() + "?cb=" + random;
                }
            };
            $scope.limpaFiltroAvancado = function () {
                $scope.buscaAvancadaProduto = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBuscaProduto = "";
            };
            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancadaProduto = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.getListaProdutoAll(1);
            };
            $scope.filtrarAvancado = function () {
                $scope.valorBuscaProduto = "";
                $scope.getListaProdutoAll(1);
                Utilitario.fecharDialog('#filtroProdutoAvancado');
            };
            $scope.getListaProdutoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancadaProduto, 'buscaDescricao': $scope.valorBuscaProduto};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "produto/getAllproduto",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaProduto = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltroProduto');
                    });
                }
            };
            $scope.selecionarProduto = function (produto) {
                $rootScope.produtoSelecionado = JSON.parse(JSON.stringify(produto));
                Utilitario.fecharDialog("#filtroProduto");
            };
            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $('#filtroProduto').on('show.bs.modal', function (event) {
                $scope.limpaFiltroAvancado();
                $scope.getListaProdutoAll(1);
            });
        }]);
})();