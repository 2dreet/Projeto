(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("pedidoControler", ['$rootScope', '$scope', '$http', 'Factory', 'Formulario', function ($rootScope, $scope, $http, Factory, Formulario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnPedido');
            $rootScope.paginaAtual = "Pedidos";
            $rootScope.paginaAtualClass = "fa fa-shopping-cart botaoComIconeMenuLateral";
            $scope.listaPedido = [];
            $scope.listaTipoPedido = Formulario.getTipoPedido();
            $scope.listaFormaPagamento = Formulario.getFormaPagamento();
            $scope.pedidoAtual = {tipoPedido: $scope.listaTipoPedido[0], formaPagamento: $scope.listaFormaPagamento[0], pedidoConfirmado: true};
            $scope.valorBuscaPedido = "";
            $scope.buscaAvancada = {};
            $scope.dataVencimento = {opened: true};
            $scope.opendataVencimento = function () {
                $scope.dataVencimento.opened = true;
            };
            $scope.dataEntrega = {opened: true};
            $scope.opendataEntrega = function () {
                $scope.dataEntrega.opened = true;
            };
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.tipoFuncao = 0;
            $scope.getTituloCrudAssociado = function () {
                if ($scope.tipoFuncao === 0) {
                    return  "Cadastro de Pedido";
                } else if ($scope.tipoFuncao === 1) {
                    return  "Alterar Pedido";
                } else if ($scope.tipoFuncao === 2) {
                    return  "Deletar Pedido";
                } else if ($scope.tipoFuncao === 3) {
                    return  "Vizualizar Pedido";
                }
            };

            $scope.getImagem = function (idItem) {
                if (Factory.verificaToken(true) && idItem > 0) {
                    var random = (new Date()).toString();
                    return Factory.urlImagem + idItem + "/" + Factory.getToken() + "?cb=" + random;
                }
            };

            $scope.getListaPedidoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
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
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            };

            $scope.enviarPedido = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'dados': $scope.pedidoAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/enviarPedido",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#pedidoDialog');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                            $scope.getListaClienteAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };

        }]);
})();