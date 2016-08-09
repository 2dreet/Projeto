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

            $scope.buscaAvancadaProduto = {};
            $scope.valorBuscaProduto = "";
            $scope.listaProduto = [];
            $scope.totalItemsProduto = 0;
            $scope.currentPageProduto = 1;

            $scope.listaCliente = [];
            $scope.valorBuscaCliente = "";
            $scope.totalItemsCliente = 0;
            $scope.currentPageCliente = 1;

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

            $scope.limpaBuscaClienteComBusca = function () {
                $scope.valorBuscaCliente = "";
            };

            $scope.limpaBuscaProdutoComBusca = function () {
                $scope.buscaAvancadaProduto = {};
                $scope.valorBuscaProduto = "";
            };

            $scope.selecionarCliente = function (cliente) {
                if ($scope.pedidoAtual.cliente === undefined) {
                    $scope.pedidoAtual.cliente = {};
                }
                $scope.pedidoAtual.cliente = JSON.parse(JSON.stringify(cliente));
                $scope.fecharDialog("#localizarClienteDialog");
                $scope.limpaBuscaClienteComBusca();
            };

            $scope.incluirProduto = function (produto) {
                if ($scope.pedidoAtual.listaProduto === undefined) {
                    $scope.pedidoAtual.listaProduto = [];
                }
                var encontrou = false;
                for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                    if (produto.id !== undefined && $scope.pedidoAtual.listaProduto[i].id !== undefined &&
                            produto.id === $scope.pedidoAtual.listaProduto[i].id) {
                        $scope.pedidoAtual.listaProduto[i].quantidadeCompra++;
                        encontrou = true;
                    }
                }
                if (encontrou === false) {
                    var produtoAux = JSON.parse(JSON.stringify(produto));
                    produtoAux.quantidadeCompra = 1;
                    $scope.pedidoAtual.listaProduto.push(produtoAux);
                }
                $scope.fecharDialog("#localizarProdutoPedidoDialog");
                $scope.limpaBuscaProdutoComBusca();
            };

            $scope.removeProduto = function (produto) {
                for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                    if ($scope.pedidoAtual.listaProduto[i] === produto) {
                        $scope.pedidoAtual.listaProduto.splice(i, 1);
                    }
                }
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
                            $scope.totalItemsProduto = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgLocalizarProdutoDialog');
                    });
                }
            };

            $scope.getListaClienteAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': {}, 'buscaDescricao': $scope.valorBuscaCliente, 'limit': $scope.itensPorPagina};
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
                            $scope.totalItemsCliente = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgLocalizarClienteDialog');
                    });
                }
            };

            $scope.abrirDialog = function (idModal) {
                $(idModal).modal('show');
            };
            $scope.fecharDialog = function (idModal) {
                $(idModal).modal('hide');
            };

            $scope.novoPedido();
        }]);
})();