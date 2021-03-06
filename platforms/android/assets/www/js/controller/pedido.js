(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("pedidoControler", ['$rootScope', '$scope', '$http', 'Factory', 'Formulario', 'Utilitario', function ($rootScope, $scope, $http, Factory, Formulario, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnPedido');
            $rootScope.paginaAtual = "Pedidos";
            $rootScope.paginaAtualClass = "fa fa-shopping-cart botaoComIconeMenuLateral";
            $scope.valorTotal = '0,00';
            $scope.descontoTotal = '0,00';
            $scope.listaPedido = [];
            $scope.listaEntregue = [{'valor': true, 'descricao': 'Entregue'}, {'valor': false, 'descricao': 'Não Entregue'}];
            $scope.listaStatusPedido = Formulario.getStatusPedido();
            $scope.listaTipoPedido = Formulario.getTipoPedido();
            $scope.listaFormaPagamento = Formulario.getFormaPagamento();
            $scope.listaStatusPedidoFiltro = Formulario.getStatusPedido();
            $scope.listaTipoPedidoFiltro = Formulario.getTipoPedido();
            $scope.listaFormaPagamentoFiltro = Formulario.getFormaPagamento();
            $scope.listaStatusPedidoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaTipoPedidoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaFormaPagamentoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaEntregue.push({'valor': 0, 'descricao': 'Todos'});
            $scope.pedidoAtual = {};
            $scope.valorBuscaPedido = "";
            $scope.buscaAvancada = {};
            $scope.dataVencimento = {opened: true};
            $scope.dataVencimentoInicial = {opened: true};
            $scope.dataVencimentoFinal = {opened: true};
            $scope.dataPagamentoInicial = {opened: true};
            $scope.dataPagamentoFinal = {opened: true};
            $scope.opendataVencimento = function () {
                $scope.dataVencimento.opened = true;
            };
            $scope.opendataVencimentoInicial = function () {
                $scope.dataVencimentoInicial.opened = true;
            };
            $scope.opendataVencimentoFinal = function () {
                $scope.dataVencimentoFinal.opened = true;
            };
            $scope.opendataPagamentoInicial = function () {
                $scope.dataPagamentoInicial.opened = true;
            };
            $scope.opendataPagamentoFinal = function () {
                $scope.dataPagamentoFinal.opened = true;
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
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaPedidoAll(1);
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#pedidoDialogLocalizar");
                if ($scope.buscaAvancada.tipo_pedido === undefined) {
                    $scope.buscaAvancada = {'tipo_pedido': $scope.listaTipoPedidoFiltro[2], 'status_pedido': $scope.listaStatusPedidoFiltro[3], 'forma_pagamento': $scope.listaFormaPagamentoFiltro[3],
                        'entregue': $scope.listaEntregue[2]};
                }
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#pedidoDialogLocalizar");
                }
                $scope.currentPage = 1;
                $scope.getListaPedidoAll(1);
            };
            $scope.setModoManter = function (isNovo) {
                $scope.mudaTab('#tabProdutosDoPedido', '#tabProdutosDoPedidoTitle');
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.novoPedido();
                    $scope.tipoFuncao = "inserir";
                }
            };
            $scope.setModoView = function () {
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.pedidoAtual = {};
            };
            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastro de Pedido";
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
                        url: Factory.urlWs + "pedido/getAllPedido",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.valorTotal = '0,00';
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaPedido = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                            $scope.valorTotal = response.data.valorTotal;
                            $scope.descontoTotal = response.data.descontoTotal;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.getPedido = function (id) {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(), 'idPedido': id};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/getPedido",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            var pedido = response.data.pedido;
                            pedido.data_vencimento = Utilitario.dataDbToJS(pedido.data_vencimento);
                            pedido.tipo_pedido = $scope.getTipoPedido(pedido.tipo_pedido);
                            pedido.status = $scope.getStatusPedido(pedido.status);
                            pedido.forma_pagamento = $scope.getFormaPagamentoPedido(pedido.forma_pagamento);
                            $scope.pedidoAtual = pedido;
                            if ($scope.pedidoAtual.listaParcelas === undefined || $scope.pedidoAtual.listaParcelas === null) {
                                $scope.pedidoAtual.listaParcelas = [];
                            }
                            for (var i = $scope.pedidoAtual.listaParcelas.length; i--; ) {
                                $scope.pedidoAtual.listaParcelas[i].data_pagamento = Utilitario.dataDbToJS($scope.pedidoAtual.listaParcelas[i].data_pagamento);
                            }
                            $scope.pedidoAtual.parcelas = $scope.pedidoAtual.listaParcelas.length;
                            var clienteAux = JSON.parse(JSON.stringify($scope.pedidoAtual.cliente));
                            if (clienteAux !== null && clienteAux.id !== undefined) {
                                clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + ' ' + clienteAux.pessoa.sobreNome};
                            }
                            if ($scope.pedidoAtual.cliente === undefined) {
                                $scope.pedidoAtual.cliente = {};
                            }
                            $scope.pedidoAtual.cliente = clienteAux;
                            Utilitario.abrirDialog("#pedidoDialogFuncoes");
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.enviarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
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
                            if ($scope.tipoFuncao === "inserir" || $scope.tipoFuncao === "alterar") {
                                $scope.listaPedido = [];
                                $scope.listaPedido.push(response.data.pedido);
                                $scope.totalItems = 1;
                                $scope.valorTotal = response.data.pedido.valor;
                                $scope.descontoTotal = response.data.pedido.desconto;
                            } else {
                                if ($scope.tipoFuncao === "deletar") {
                                    $scope.limpaFiltro();
                                }
                            }
                            $scope.setModoView();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.pagarParcela = function (parcela) {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'parcela': parcela, 'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/pagarParcela",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgParcelaGeral');
                            for (var i = $scope.pedidoAtual.listaParcelas.length; i--; ) {
                                if (parcela.id === $scope.pedidoAtual.listaParcelas[i].id) {
                                    $scope.pedidoAtual.listaParcelas[i].status = 2;
                                }
                                $scope.getListaPedidoAll($scope.currentPage);
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgParcelaGeral');
                    });
                }
            };
            $scope.pagarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/pagarPedido",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                            $scope.getListaPedidoAll($scope.currentPage);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.entregarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/entregarPedido",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                            $scope.getListaPedidoAll($scope.currentPage);
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
                        valorTotal = valorTotal + ($scope.pedidoAtual.listaProduto[i].valor * $scope.pedidoAtual.listaProduto[i].quantidade);
                    }
                }
                return valorTotal;
            };
            $scope.novoPedido = function () {
                $scope.pedidoAtual = {tipo_pedido: $scope.listaTipoPedido[0], forma_pagamento: $scope.listaFormaPagamento[0], cliente: null};
            };
            $scope.localizarProduto = function () {
                Utilitario.abrirDialog("#filtroProduto");
                $('#filtroProduto').on('hide.bs.modal', function (event) {
                    if ($rootScope.produtoSelecionado !== undefined) {
                        if ($scope.pedidoAtual.listaProduto === undefined) {
                            $scope.pedidoAtual.listaProduto = [];
                        }
                        var encontrou = false;
                        for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                            if ($rootScope.produtoSelecionado.id !== undefined && $scope.pedidoAtual.listaProduto[i].id !== undefined &&
                                    $rootScope.produtoSelecionado.id === $scope.pedidoAtual.listaProduto[i].id) {
                                $scope.pedidoAtual.listaProduto[i].quantidade++;
                                encontrou = true;
                                $rootScope.produtoSelecionado = {};
                            }
                        }
                        if (encontrou === false) {
                            var produtoAux = JSON.parse(JSON.stringify($rootScope.produtoSelecionado));
                            produtoAux = {id: produtoAux.id, descricao: produtoAux.descricao, valor: produtoAux.valor};
                            $rootScope.produtoSelecionado = {};
                            if (produtoAux.id !== undefined) {
                                produtoAux.quantidade = 1;
                                $scope.pedidoAtual.listaProduto.push(produtoAux);
                            }
                        }
                    }
                    $('#filtroProduto').off('hide.bs.modal');
                });
            };
            $scope.localizarCliente = function (entidade) {
                Utilitario.abrirDialog("#filtroCliente");
                $('#filtroCliente').on('hide.bs.modal', function (event) {
                    if ($rootScope.clienteSelecionado !== undefined && $rootScope.clienteSelecionado.id !== undefined) {
                        var clienteAux = JSON.parse(JSON.stringify($rootScope.clienteSelecionado));
                        clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + ' ' + clienteAux.pessoa.sobreNome};
                        if (entidade.cliente === undefined) {
                            entidade.cliente = {};
                        }
                        entidade.cliente = clienteAux;
                        $rootScope.clienteSelecionado = {};
                    }
                    $('#filtroCliente').off('hide.bs.modal');
                });
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
            var validarPedido = function () {
                if ($scope.pedidoAtual.listaProduto === undefined || $scope.pedidoAtual.listaProduto === null || $scope.pedidoAtual.listaProduto.length <= 0) {
                    $scope.mudaTab('#tabProdutosDoPedido', '#tabProdutosDoPedidoTitle');
                    Factory.setMensagemTemporaria('erro', 'Adicionar produtos!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.cliente === undefined || $scope.pedidoAtual.cliente === null) {
                    $scope.mudaTab('#tabDadosDoPedido', '#tabDadosDoPedidoTitle');
                    $('#pedidoAtualCliente').focus();
                    Factory.setMensagemTemporaria('erro', 'Selecionar cliente!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.descricao === undefined || $scope.pedidoAtual.descricao === null || $scope.pedidoAtual.descricao.trim() === "") {
                    $scope.mudaTab('#tabDadosDoPedido', '#tabDadosDoPedidoTitle');
                    $('#produtoDescricao').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar descrição!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.data_vencimento === undefined || $scope.pedidoAtual.data_vencimento === null) {
                    $scope.mudaTab('#tabDadosDoPedido', '#tabDadosDoPedidoTitle');
                    $('#pedidoDataVencimento').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar vencimento', "#msgManterPedido");
                    return false;
                }
                return true;
            };
            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };
            $scope.getTipoPedido = function (id) {
                return Formulario.getTipoPedidoId(id);
            };
            $scope.getStatusPedido = function (id) {
                return Formulario.getStatusPedidoId(id);
            };
            $scope.getFormaPagamentoPedido = function (id) {
                return Formulario.getFormaPagamentoId(id);
            };
            $scope.isEntregue = function (entregue) {
                if (entregue == 1) {
                    return " / Entregue";
                } else {
                    return " / Não Entregue";
                }
            };
            $scope.novoPedido();
            $scope.getListaPedidoAll(1);
            $scope.mudaTab = function (tab, title) {
                $('#TabPedidoCrud div').removeClass('active');
                $(tab).addClass('active');
                $('#TabPedidoCrudTitle li').removeClass('active');
                $(title).addClass('active');
            };
        }]);
})();