
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("produtoFiltroController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', 'FiltroService', function ($rootScope, $scope, $http, Factory, Utilitario, FiltroService) {
            $scope.buscaAvancada = {};
            $scope.valorBusca = "";
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
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBusca = "";
            };
            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.getListaProdutoAll(1);
            };
            $scope.filtrarAvancado = function () {
                $scope.valorBusca = "";
                $scope.getListaProdutoAll(1);
                Utilitario.fecharDialog('#filtroProdutoAvancado');
            };

            $scope.localizarFornecedor = function () {
                FiltroService.localizarFornecedor($scope.buscaAvancada);
            };

            $scope.getListaProdutoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca};
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
                $(".produtoModalFiltro").modal('hide');
            };

            $scope.fechar = function (idComponente) {
                $(".produtoModalFiltro").modal('hide');
            };

            $scope.fecharDialog = function (idComponente) {
                $(idComponente).modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaProduto = [];
                $scope.currentPage = 1;
                $scope.buscaAvancada = {};
            }

            $scope.filtrar = function () {
                $scope.listaProduto = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaProdutoAll($scope.currentPage);
            };

            $rootScope.inicioGlobalProdutoModalFiltro = function () {
                $('.produtoModalFiltro').off();
                $('.produtoModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.produtoModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaProdutoAll(1);
                });
            };
        }]);
})();