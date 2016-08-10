(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("pedidoControler", ['$rootScope', '$scope', '$http', 'Factory', 'Formulario', 'Utilitario', function ($rootScope, $scope, $http, Factory, Formulario, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnPedido');
            $rootScope.paginaAtual = "Pedidos";
            $rootScope.paginaAtualClass = "fa fa-shopping-cart botaoComIconeMenuLateral";
            $scope.listaPedido = [];
            $scope.listaTipoPedido = Formulario.getTipoPedido();
            $scope.listaFormaPagamento = Formulario.getFormaPagamento();
            $scope.pedidoAtual = {};
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

            $scope.iniciarLocalizacaoProduto = false;
            $scope.iniciarLocalizacaoCliente = false;

            $scope.getTituloCrudPedido = function () {
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
                        Utilitario.fecharDialog('#pedidoDialog');
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

            $scope.getClientePedido = function () {
                var clientePedido = "";
                if ($scope.pedidoAtual.cliente !== undefined && $scope.pedidoAtual.cliente.pessoa !== undefined) {
                    clientePedido = $scope.pedidoAtual.cliente.pessoa.nome + ' ' + $scope.pedidoAtual.cliente.pessoa.sobreNome;
                }
                return clientePedido;
            };

            $scope.getValorPedido = function () {
                var valorTotal = 0;
                if ($scope.pedidoAtual.listaProduto !== undefined) {
                    for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                        valorTotal = valorTotal + ($scope.pedidoAtual.listaProduto[i].valor * $scope.pedidoAtual.listaProduto[i].quantidadeCompra);
                    }
                }
                return valorTotal;
            };

            $scope.novoPedido = function () {
                $scope.pedidoAtual = {tipoPedido: $scope.listaTipoPedido[0], formaPagamento: $scope.listaFormaPagamento[0], pedidoConfirmado: true, cliente: {pessoa: {nome: "", sobreNome: ""}}};
                $scope.tipoFuncao = 0;
            };

            $scope.localizarProduto = function () {
                Utilitario.abrirDialog("#filtroProduto");
                if ($scope.iniciarLocalizacaoProduto === false) {
                    $('#filtroProduto').on('hide.bs.modal', function (event) {
                        $scope.iniciarLocalizacaoProduto = true;
                        if ($scope.pedidoAtual.listaProduto === undefined) {
                            $scope.pedidoAtual.listaProduto = [];
                        }
                        var encontrou = false;
                        for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                            if ($rootScope.produtoSelecionado.id !== undefined && $scope.pedidoAtual.listaProduto[i].id !== undefined &&
                                    $rootScope.produtoSelecionado.id === $scope.pedidoAtual.listaProduto[i].id) {
                                $scope.pedidoAtual.listaProduto[i].quantidadeCompra++;
                                encontrou = true;
                                $rootScope.produtoSelecionado = {};
                            }
                        }
                        if (encontrou === false) {
                            var produtoAux = JSON.parse(JSON.stringify($rootScope.produtoSelecionado));
                            $rootScope.produtoSelecionado = {};
                            if (produtoAux.id !== undefined) {
                                produtoAux.quantidadeCompra = 1;
                                $scope.pedidoAtual.listaProduto.push(produtoAux);
                            }
                        }
                    });
                }
            };

            $scope.localizarCliente = function () {
                Utilitario.abrirDialog("#filtroCliente");
                if ($scope.iniciarLocalizacaoCliente === false) {
                    $('#filtroCliente').on('hide.bs.modal', function (event) {
                        $scope.iniciarLocalizacaoCliente = true;
                        if ($rootScope.clienteSelecionado.id !== undefined) {
                            if ($scope.pedidoAtual.cliente === undefined) {
                                $scope.pedidoAtual.cliente = {};
                            }
                            $scope.pedidoAtual.cliente = JSON.parse(JSON.stringify($rootScope.clienteSelecionado));
                            $rootScope.clienteSelecionado = {};
                        }
                    });
                }
            };

            $scope.removeProduto = function (produto) {
                for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                    if ($scope.pedidoAtual.listaProduto[i] === produto) {
                        $scope.pedidoAtual.listaProduto.splice(i, 1);
                    }
                }
            };

            $scope.novoPedido();
        }]);
})();