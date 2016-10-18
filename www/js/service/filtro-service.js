(function () {
    'use strict';
    angular.module('www.geve.com.br').service('FiltroService', function ($rootScope) {

        this.localizarFornecedor = function (objeto) {
            $rootScope.inicioGlobalFornecedorModalFiltro();
            $(".fornecedorModalFiltro").modal('show');
            $('.fornecedorModalFiltro').on('hide.bs.modal', function (event) {
                if (objeto === undefined || objeto === null) {
                    objeto = {'fornecedor': null};
                } else if (objeto.fornecedor === undefined) {
                    objeto.fornecedor = null;
                }

                if ($rootScope.fornecedorSelecionado !== undefined && $rootScope.fornecedorSelecionado !== null && $rootScope.fornecedorSelecionado.id !== undefined) {
                    var fornecedorAux = JSON.parse(JSON.stringify($rootScope.fornecedorSelecionado));
                    fornecedorAux = {id: fornecedorAux.id, descricao: fornecedorAux.descricao};
                    objeto.fornecedor = fornecedorAux;
                }
                $rootScope.fornecedorSelecionado = null;
                $('.fornecedorModalFiltro').off('hide.bs.modal');
            });
        };

        this.localizarProduto = function (objeto) {
            $rootScope.inicioGlobalProdutoModalFiltro();
            $(".produtoModalFiltro").modal('show');
            $('.produtoModalFiltro').on('hide.bs.modal', function (event) {
                if ($rootScope.produtoSelecionado !== undefined) {
                    if (objeto.listaProduto === undefined) {
                        objeto.listaProduto = [];
                    }
                    var encontrou = false;
                    for (var i = objeto.listaProduto.length; i--; ) {
                        if ($rootScope.produtoSelecionado.id !== undefined && objeto.listaProduto[i].id !== undefined &&
                                $rootScope.produtoSelecionado.id === objeto.listaProduto[i].id) {
                            objeto.listaProduto[i].quantidade++;
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
                            objeto.listaProduto.push(produtoAux);
                        }
                    }
                }
                $('.produtoModalFiltro').off('hide.bs.modal');
            });
        };

        this.localizarCliente = function (objeto) {
            $rootScope.inicioGlobalClienteModalFiltro();
            $(".clienteModalFiltro").modal('show');
            $('.clienteModalFiltro').on('hide.bs.modal', function (event) {
                if (objeto === undefined || objeto === null) {
                    objeto = {'cliente': null};
                } else if (objeto.cliente === undefined) {
                    objeto.cliente = null;
                }

                if ($rootScope.clienteSelecionado !== undefined && $rootScope.clienteSelecionado !== null && $rootScope.clienteSelecionado.id !== undefined) {
                    var clienteAux = JSON.parse(JSON.stringify($rootScope.clienteSelecionado));
                    clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + " " + clienteAux.pessoa.sobreNome};
                    objeto.cliente = clienteAux;
                }
                $rootScope.fornecedorSelecionado = null;
                $('.clienteModalFiltro').off('hide.bs.modal');
            });
        };

    });
})();

