(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("inicioControler", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnHome');
            $rootScope.paginaAtual = "Home";
            $rootScope.paginaAtualClass = "fa fa-home botaoComIconeMenuLateral";
            $scope.valorReceber = '0,00';
            $scope.valorRecebido = '0,00';
            $scope.valorDespesas = '0,00';
            var dataAtual = new Date();
            $scope.busca = {dataInicio: (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)), dataFim: (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0))};
            $scope.dataInicioDialog = {opened: false};
            $scope.dataFimDialog = {opened: false};
            $scope.openDataInicioDialog = function () {
                $scope.dataInicioDialog.opened = true;
            };
            $scope.openDataFimDialog = function () {
                $scope.dataFimDialog.opened = true;
            };
            $scope.getDados = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(), 'dados': $scope.busca};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "inicio/getDados",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.valorReceber = response.data.valorReceber;
                            $scope.valorRecebido = response.data.valorRecebido;
                            $scope.valorDespesas = response.data.valorDespesas;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgInicioGeral');
                    });
                }
            };
            $scope.localizarCliente = function (entidade) {
                Utilitario.abrirDialog("#filtroCliente");
                $('#filtroCliente').on('hide.bs.modal', function (event) {
                    if ($rootScope.clienteSelecionado !== undefined && $rootScope.clienteSelecionado.id !== undefined) {
                        var clienteAux = JSON.parse(JSON.stringify($rootScope.clienteSelecionado));
                        clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + ' ' + clienteAux.pessoa.sobreNome};
                        if ($scope.busca.cliente === undefined) {
                            $scope.busca.cliente = {};
                        }
                        $scope.busca.cliente = clienteAux;
                        $rootScope.clienteSelecionado = {};
                    }
                    $('#filtroCliente').off('hide.bs.modal');
                });
            };
            $scope.getDados();
        }]);
})();