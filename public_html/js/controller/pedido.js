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
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.indice = 0;
            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                $scope.indice = 0;
                if (isNovo) {
                    $scope.novoPedido();
                }
            };
            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.pedidoAtual = {};
            };
            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Pedido";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Pedido";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Pedido";
                } else if ($scope.tipoFuncao === "vizualizar") {
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
                        url: Factory.urlWs + "pedido/getAllPedido" + Factory.debug,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaPedido = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            };
            $scope.enviarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valorPedido = $scope.getValorPedido();
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
                            $scope.getListaPedidoAll(1);
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
                $scope.pedidoAtual = {tipoPedido: $scope.listaTipoPedido[0], formaPagamento: $scope.listaFormaPagamento[0], pedidoPago: true, cliente: {pessoa: {nome: "", sobreNome: ""}}};
                $scope.tipoFuncao = "inserir";
            };
            $scope.localizarProduto = function () {
                Utilitario.abrirDialog("#filtroProduto");
                if ($scope.iniciarLocalizacaoProduto === false) {
                    $('#filtroProduto').on('hide.bs.modal', function (event) {
                        if ($rootScope.produtoSelecionado !== undefined) {
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
                        if ($scope.tipoFuncao === "alterar") {
                            if ($scope.pedidoAtual.listaProdutoRemovido === undefined) {
                                $scope.pedidoAtual.listaProdutoRemovido = [];
                            }
                            $scope.pedidoAtual.listaProdutoRemovido.push(JSON.parse(JSON.stringify(produto)));
                        }
                    }
                }
            };
            function validarPedido() {
                if ($scope.pedidoAtual.listaProduto === undefined || $scope.pedidoAtual.listaProduto === null || $scope.pedidoAtual.listaProduto.length <= 0) {
                    Factory.setMensagemTemporaria('erro', 'Adicionar produtos!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.cliente === undefined || $scope.pedidoAtual.cliente === null) {
                    $('#pedidoAtualCliente').focus();
                    Factory.setMensagemTemporaria('erro', 'Selecionar cliente!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.descricao === undefined || $scope.pedidoAtual.descricao === null || $scope.pedidoAtual.descricao.trim() === "") {
                    $('#produtoDescricao').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar descrição!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.dataVencimento === undefined || $scope.pedidoAtual.dataVencimento === null) {
                    $('#pedidoDataVencimento').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar vencimento', "#msgManterPedido");
                    return false;
                }
                return true;
            }
            ;
            var dataDbToJS = function (data) {
                if (data !== undefined && data !== null) {
                    return (new Date(data.substring(0, 4), data.substring(5, 7) - 1, data.substring(8, 10)));
                } else {
                    return "";
                }
            };
            $scope.preparaPedido = function (pedido) {
                $scope.pedidoAtual = JSON.parse(JSON.stringify(pedido));
                $scope.pedidoAtual.dataVencimento = dataDbToJS($scope.pedidoAtual.dataVencimento);
            };
            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };

            $scope.getTipoPedido = function (id) {
                for (var i = $scope.listaTipoPedido.length; i--; ) {
                    if ($scope.listaTipoPedido[i].id === id) {
                        return $scope.listaTipoPedido[i].descricao;
                    }
                }
            };
            
            $scope.novoPedido();
            $scope.getListaPedidoAll(1);
        }]);
})();