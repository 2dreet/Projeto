
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroFornecedorController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.valorBusca = "";
            $scope.listaFornecedor = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/getAllFornecedor",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaFornecedor = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltrarFornecedor');
                    });
                }
            };

            $scope.selecionarFornecedor = function (fornecedor) {
                $rootScope.fornecedorSelecionado = JSON.parse(JSON.stringify(fornecedor));
                $(".fornecedorModalFiltro").modal('hide');
            };

            $scope.fechar = function () {
                $(".fornecedorModalFiltro").modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaFornecedor = [];
                $scope.currentPage = 1;
            }
            
            $scope.filtrar = function () {
                $scope.listaFornecedor = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll($scope.currentPage);
            };

            $rootScope.inicioGlobalFornecedorModalFiltro = function () {
                $('.fornecedorModalFiltro').off();
                $('.fornecedorModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.fornecedorModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaFornecedorAll(1);
                });
            };
        }]);
})();