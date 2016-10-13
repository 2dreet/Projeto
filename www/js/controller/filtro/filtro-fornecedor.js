
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroFornecedorController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.buscaAvancadaCliente = {};
            $scope.valorBuscaFornecedor = "";
            $scope.listaFornecedor = [];

            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.tipoFuncao = 0;

            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancadaCliente, 'buscaDescricao': $scope.valorBuscaCliente, 'limit': $scope.itensPorPagina};
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
                Utilitario.fecharDialog("#filtroFornecedor");
            };
            
            $scope.fechar = function () {
                Utilitario.fecharDialog("#filtroFornecedor");
            };
            
            $('#filtroFornecedor').on('show.bs.modal', function (event) {
                $scope.valorBuscaCliente = "";
                $scope.getListaFornecedorAll(1);
            });
        }]);
})();