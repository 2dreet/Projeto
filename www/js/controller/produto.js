
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("produtoControler", ['$rootScope', '$scope', '$http', 'Formulario', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Formulario, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnProduto');
            $rootScope.paginaAtual = "Produtos";
            $rootScope.paginaAtualClass = "fa fa-gift botaoComIconeMenuLateral";
            $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});
            var dataAtual = new Date();
            $scope.dataInicialMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
            $scope.dataFinalMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
            $scope.dataInicial = {opened: true};
            $scope.dataFinal = {opened: true};
            $scope.estoqueFuturo = 0;
            $scope.produtoAtual = {observacao: ""};
            $scope.listaProduto = [];
            $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
            $scope.entidadeSelecionada = {};
            $scope.valorBuscaProduto = "";
            $scope.listaTipoMovimentacaoCorrecao = Formulario.getTipoMovimentacao();
            $scope.listaProdutoMovimentacao = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.totalItemsMovimentacao = 0;
            $scope.currentPageMovimentacao = 1;
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.openDataInicial = function () {
                $scope.dataInicial.opened = true;
                $scope.dateOptionsInicial.maxDate = $scope.dataFinalMovimento;
            };

            $scope.openDataFinal = function () {
                $scope.dataFinal.opened = true;
                $scope.dateOptionsFinal.minDate = $scope.dataInicialMovimento;
            };

            $scope.dateOptionsInicial = {
                maxDate: $scope.dataFinalMovimento,
                startingDay: 1
            };

            $scope.dateOptionsFinal = {
                minDate: $scope.dataInicialMovimento,
                startingDay: 1
            };

            $scope.limpaFiltroAvancado = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBuscaProduto = "";
                $scope.getListaProdutoAll(1);
            };

            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.getListaProdutoAll(1);
            };

            $scope.filtrarAvancado = function () {
                $scope.valorBuscaProduto = "";
                $scope.getListaProdutoAll(1);
                $scope.fechar('#localizarProdutoDialog');
            };

            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novoProduto();
                }
            };

            $scope.setModoView = function () {
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.produtoAtual = {observacao: ""};
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Produto";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Produto";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Produto";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Produto";
                }
            };

            $scope.getListaProdutoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBuscaProduto};
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
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            };

            $scope.getListaMovimentacao = function (pagina) {
                if (Factory.verificaToken(true) && ($scope.dataInicialMovimento !== null && $scope.dataFinalMovimento !== null)) {
                    var envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': Factory.getToken(), 'data_inicial': $scope.dataInicialMovimento, 'data_final': $scope.dataFinalMovimento};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "produto/getMovimentacaoProduto",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaProdutoMovimentacao = response.data.dados;
                            $scope.totalItemsMovimentacao = response.data.totalRegistro;
                            if (response.data.estoque >= 0) {
                                $scope.produtoAtual.estoque = response.data.estoque;
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                } else if (($scope.dataInicialMovimento === null || $scope.dataFinalMovimento === null)) {
                    $scope.totalItemsMovimentacao = 0;
                }
            };

            $scope.getImagem = function (idItem) {
                if (Factory.verificaToken(true) && idItem > 0) {
                    var random = (new Date()).toString();
                    return Factory.urlImagem + idItem + "/" + Factory.getToken() + "?cb=" + random;
                }
            };

            $scope.validaImagem = function (mostraMenssagemErro, idCampoImagem, idCampoMsg) {
                var campoImagem = $(idCampoImagem).prop('files');
                if (campoImagem !== null && $(idCampoImagem).eq(0).val() !== "") {
                    var imagem = campoImagem[0];
                    if (imagem !== null) {
                        var nomeImagem = imagem.name;
                        var extencao = new RegExp("(.*?)\.(jpg|jpeg|png)$");
                        if ((extencao.test(nomeImagem))) {
                            if (imagem.size <= 500000) {
                                return true;
                            } else {
                                $(idCampoImagem).val(null);
                                if (mostraMenssagemErro) {
                                    Factory.setMensagemTemporaria('erro', 'Tamanho da imagem permitido é 500bytes', idCampoMsg);
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            $(idCampoImagem).val(null);
                            if (mostraMenssagemErro) {
                                Factory.setMensagemTemporaria('erro', 'Apenas imagem no formato jpg, jpeg e png!', idCampoMsg);
                            } else {
                                return false;
                            }
                        }
                    }
                }
            };

            $scope.mostrarImagem = function (idCampoImagem, idCampoMsg, idCampoDestino) {
                if ($scope.validaImagem(true, idCampoImagem, idCampoMsg)) {
                    var campoImagem = $(idCampoImagem).prop('files');
                    var imagem = campoImagem[0];
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $(idCampoDestino).attr('src', e.target.result);
                    };
                    reader.readAsDataURL(imagem);
                }
            };

            $scope.enviarProduto = function () {
                if (Factory.verificaToken(true)) {
                    if ($scope.validaProduto()) {
                        var fd = new FormData();
                        if ($scope.validaImagem(false, '#produtoImagemCadastro', '#msgProduto')) {
                            var campoImagem = $('#produtoImagemCadastro').prop('files');
                            var imagem = campoImagem[0];
                            fd.append('imagem', imagem);
                        }
                        fd.append('token', Factory.getToken());
                        fd.append('tipoFuncao', $scope.tipoFuncao);
                        fd.append('dados', angular.toJson($scope.produtoAtual));
                        $scope.send = $http({
                            url: Factory.urlWs + 'produto/enviarProduto'+Factory.debug,
                            method: 'POST',
                            data: fd,
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else {
                                if ($scope.tipoFuncao === "inserir" || $scope.tipoFuncao === "alterar") {
                                    $scope.listaProduto = [];
                                    $scope.produtoAtual = response.data.produto;
                                    $scope.listaProduto.push($scope.produtoAtual);
                                    $scope.totalItems = 1;
                                } else {
                                    $scope.currentPage = 1;
                                    $scope.getListaProdutoAll(1);
                                }
                                $scope.setModoView();
                                Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgProdutoGeral');
                            }
                        }, function errorCallback(response) {
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterProduto');
                        });
                    }
                }
            };

            $scope.movimentarProdutoCorrecao = function () {
                $scope.message = "";
                if (Factory.verificaToken(true)) {
                    if ($scope.validaCorrecao()) {
                        var produto = {id: $scope.produtoAtual.id, estoque: $scope.produtoAtual.estoque, tipoMovimentacao: $scope.produtoAtual.tipoMovimentacao.id, estoque_movimento_observacao: $scope.produtoAtual.estoque_movimento_observacao, estoque_movimento: $scope.produtoAtual.estoque_movimento};
                        var envio = {'dados': produto, 'token': Factory.getToken()};
                        $scope.send = $http({
                            method: 'POST',
                            crossDomain: true,
                            url: Factory.urlWs + "produto/movimentarProduto",
                            data: envio,
                            headers: {'Content-Type': 'application/json'}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else if (response.data.sucesso) {
                                $scope.preparaProdutoMovimentacao(false);
                                $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                                $scope.abrir("#produtoDialogMovimentacao");
                                Factory.setMensagemTemporaria('sucesso', 'Estoque Movimentado!', '#msgCorrecaoView');
                                $scope.produtoAtual.estoque = response.data.estoque;
                                $scope.getListaProdutoAll(1);
                            } else {
                                $scope.getListaProdutoAll(1);
                                Factory.setMensagemTemporaria('erro', response.data.menssagem, '#msgCorrecao');
                                if (response.data.estoque >= 0) {
                                    $scope.produtoAtual.estoque = response.data.estoque;
                                }
                            }
                        }, function errorCallback(response) {
                            $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                        });
                    }
                }
            };

            $scope.fecharCorrecaoMovimentacao = function () {
                $scope.preparaProdutoMovimentacao(false);
                $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                $scope.abrir("#produtoDialogMovimentacao");
            };

            $scope.validaCorrecao = function () {
                var retorno = false;
                if ($scope.produtoAtual !== null) {
                    if ($scope.produtoAtual.estoque_movimento !== null && $scope.produtoAtual.estoque_movimento > 0) {
                        retorno = true;
                    } else {
                        $('#quantidadeCorrecao').focus();
                        Factory.setMensagemTemporaria('erro', 'Deve informar Quantidade!', '#msgCorrecao');
                        return false;
                    }

                    if ($scope.produtoAtual.estoque_movimento_observacao !== null && $scope.produtoAtual.estoque_movimento_observacao.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#observacaoCorrecao').focus();
                        Factory.setMensagemTemporaria('erro', 'Deve informar observação!', '#msgCorrecao');
                        return false;
                    }

                    if ($scope.produtoAtual.tipoMovimentacao !== null && $scope.produtoAtual.tipoMovimentacao.id !== undefined) {
                        if ($scope.produtoAtual.tipoMovimentacao.id > 1 && $scope.produtoAtual.tipoMovimentacao.id < 5) {
                            var valorFinal = $scope.produtoAtual.estoque - $scope.produtoAtual.estoque_movimento;
                            if (valorFinal >= 0) {
                                retorno = true;
                            } else {
                                Factory.setMensagemTemporaria('erro', 'Valor final não deve ser negativo!', '#msgCorrecao');
                                return false;
                            }
                        } else {
                            retorno = true;
                        }
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar tipo movimentação!', '#msgCorrecao');
                        return false;
                    }
                }
                return retorno;
            };

            $scope.validaProduto = function () {
                var retorno = false;
                if ($scope.produtoAtual !== null) {
                    if ($scope.produtoAtual.descricao !== undefined && $scope.produtoAtual.descricao !== null && $scope.produtoAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar descrição!', '#msgManterProduto');
                        $('#produtoDescricao').focus();
                        return false;
                    }
                    if ($scope.produtoAtual.valor !== undefined && $scope.produtoAtual.valor !== null && $scope.produtoAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar valor!', '#msgManterProduto');
                        $('#produtoValor').focus();
                        return false;
                    }
                    if ($scope.produtoAtual.fornecedor !== undefined && $scope.produtoAtual.fornecedor !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar o fornecedor!', '#msgManterProduto');
                        $('#produtoFornecedor').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novoProduto = function () {
                $scope.produtoAtual = {observacao: ""};
                $(":file").val(null);
                $(":file").filestyle('clear');
                $("#produtoImagemCadastroView").removeAttr('src');
            };

            $scope.preparaProduto = function (produto) {
                $scope.produtoAtual = JSON.parse(JSON.stringify(produto));
                $(":file").val(null);
                $(":file").filestyle('clear');
                $("#produtoImagemCadastroView").attr("src",$scope.getImagem($scope.produtoAtual.id));
                $scope.abrir('#produtoDialogFuncoes');
            };

            $scope.preparaProdutoMovimentacao = function (prepraView) {
                $scope.dataInicialMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
                $scope.dataFinalMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
                $scope.listaProdutoMovimentacao = [];
                $scope.totalItemsMovimentacao = 0;
                $scope.getListaMovimentacao(1);
                $scope.produtoAtual.tipoMovimentacao = $scope.listaTipoMovimentacaoCorrecao[0];
                $scope.produtoAtual.estoque_movimento_observacao = "";
                $scope.produtoAtual.estoque_movimento = "";
                if (prepraView) {
                    $scope.preparaProdutoView('#produtoDialogFuncoes', '#produtoDialogMovimentacao');
                }
            };

            $scope.localizarFornecedor = function (entidade) {
                $scope.abrir("#filtroFornecedor");
                $('#filtroFornecedor').on('hide.bs.modal', function (event) {
                    if ($rootScope.fornecedorSelecionado !== undefined && $rootScope.fornecedorSelecionado.id !== undefined) {
                        var fornecedorAux = JSON.parse(JSON.stringify($rootScope.fornecedorSelecionado));
                        fornecedorAux = {id: fornecedorAux.id, descricao: fornecedorAux.descricao};
                        if (entidade.fornecedor === undefined) {
                            entidade.fornecedor = {};
                        }
                        entidade.fornecedor = fornecedorAux;
                        $rootScope.fornecedorSelecionado = {};
                    }
                    $('#filtroFornecedor').off('hide.bs.modal');
                });
            };

            $scope.preparaProdutoView = function (idModalPai, idModalFilho) {
                if (idModalPai !== null) {
                    $scope.fechar(idModalPai);
                }
                if (idModalFilho !== null) {
                    $scope.abrir(idModalFilho);
                }
            };


            $scope.abrir = function (idModal) {
                Utilitario.abrirDialog(idModal);
            };

            $scope.fechar = function (idModal) {
                Utilitario.fecharDialog(idModal);
            };

            $scope.getListaProdutoAll(1);

            $scope.corLinha = function (tipoMovimentacao) {
                var cor = {color: 'black'};
                if (tipoMovimentacao == 1) {
                    cor.color = '#0066CC';
                } else if (tipoMovimentacao == 2) {
                    cor.color = '#6eaf48';
                } else if (tipoMovimentacao == 3) {
                    cor.color = '#FF3333';
                } else if (tipoMovimentacao == 4) {
                    cor.color = '#FF9933';
                } else if (tipoMovimentacao == 5) {
                    cor.color = '#404040';
                }
                return cor;
            };
        }]);
})();