
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroClienteController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.valorBusca = "";
            $scope.listaCliente = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.getListaClienteAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/getAllCliente",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaCliente = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltrarCliente');
                    });
                }
            };

            $scope.selecionarCliente = function (cliente) {
                $rootScope.clienteSelecionado = JSON.parse(JSON.stringify(cliente));
                $scope.fechar();
            };

            $scope.fechar = function () {
                $(".clienteModalFiltro").modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaCliente = [];
                $scope.currentPage = 1;
                $scope.buscaAvancada = {};
            }

            $scope.filtrar = function () {
                $scope.listaCliente = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaClienteAll($scope.currentPage);
            };

            $rootScope.inicioGlobalClienteModalFiltro = function () {
                $('.clienteModalFiltro').off();
                $('.clienteModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.clienteModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaClienteAll(1);
                });
            };

        }]);
})();