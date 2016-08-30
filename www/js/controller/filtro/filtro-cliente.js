
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroClienteController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.buscaAvancadaCliente = {};
            $scope.valorBuscaCliente = "";
            $scope.listaCliente = [];

            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.tipoFuncao = 0;

            $scope.getListaClienteAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancadaCliente, 'buscaDescricao': $scope.valorBuscaCliente, 'limit': $scope.itensPorPagina};
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
                Utilitario.fecharDialog("#filtroCliente");
            };
            
            $scope.fechar = function () {
                Utilitario.fecharDialog("#filtroCliente");
            };
            
            $scope.getListaClienteAll(1);
        }]);
})();