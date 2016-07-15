
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("produtoControler", ['$rootScope', '$scope', '$http', 'Formulario', 'Factory', function ($rootScope, $scope, $http, Formulario, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnProduto');
            $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});
            var dataAtual = new Date();
            $scope.dataInicialMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
            $scope.dataFinalMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
            $scope.dataInicial = {opened: true};
            $scope.dataFinal = {opened: true};
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
            $scope.estoqueFuturo = 0;
            $scope.listaFornecedores = [];
            $scope.valorBuscaFornecedor = "";
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
            $scope.totalItemsFornecedor = 0;
            $scope.currentPageFornecedor = 1;
            $scope.itensPorPaginaFornecedor = 5;
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
                $scope.fecharDialog('#localizarProdutoDialog');
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
                                    setMensagemTemporaria('erro', 'Tamanho da imagem permitido é 500bytes', idCampoMsg);
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            $(idCampoImagem).val(null);
                            if (mostraMenssagemErro) {
                                setMensagemTemporaria('erro', 'Apenas imagem no formato jpg, jpeg e png!', idCampoMsg);
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
            $scope.insertProduto = function () {
                $scope.message = "";
                if (Factory.verificaToken(true)) {
                    if ($scope.validaProduto('#msgProduto', '')) {
                        var fd = new FormData();
                        if ($scope.validaImagem(false, '#produtoImagemCadastro', '#msgProduto')) {
                            var campoImagem = $('#produtoImagemCadastro').prop('files');
                            var imagem = campoImagem[0];
                            fd.append('imagem', imagem);
                        }
                        fd.append('token', Factory.getToken());
                        fd.append('dados', angular.toJson($scope.produtoAtual));
                        $scope.send = $http({
                            url: Factory.urlWs + 'produto/insertProduto',
                            method: 'POST',
                            data: fd,
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else {
                                $scope.fecharDialog("#produtoCadastroDialog");
                                Factory.setMensagemTemporaria('sucesso', 'Produto cadastrado!', '#msgProdutoGeral');
                                $scope.getListaProdutoAll(1);
                            }
                        }, function errorCallback(response) {
                            $scope.fecharDialog("#produtoCadastroDialog");
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                        });
                    }
                }
            };
            $scope.updateProduto = function () {
                $scope.message = "";
                if (Factory.verificaToken(true)) {
                    if ($scope.validaProduto('#msgProdutoAlterar', 'Alterar')) {
                        var fd = new FormData();
                        if ($scope.validaImagem(false, '#produtoImagemAlterar', '#msgProdutoAlterar')) {
                            var campoImagem = $('#produtoImagemAlterar').prop('files');
                            var imagem = campoImagem[0];
                            fd.append('imagem', imagem);
                        }
                        fd.append('token', Factory.getToken());
                        fd.append('dados', angular.toJson($scope.produtoAtual));
                        $scope.send = $http({
                            url: Factory.urlWs + 'produto/updatetProduto',
                            method: 'POST',
                            data: fd,
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else {
                                $scope.getListaProdutoAll(1);
                                $scope.fecharDialog("#produtoDialogAlterar");
                                Factory.setMensagemTemporaria('sucesso', 'Produto alterado!', '#msgProdutoGeral');
                            }
                        }, function errorCallback(response) {
                            $scope.fecharDialog("#produtoDialogAlterar");
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                        });
                    }
                }
            };
            $scope.deleteProduto = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'dados': $scope.produtoAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "produto/deleteProduto",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.getListaProdutoAll(1);
                            $scope.fecharDialog("#produtoDialogDeletar");
                            Factory.setMensagemTemporaria('sucesso', 'Produto Deletado!', '#msgProdutoGeral');
                        }
                    }, function errorCallback(response) {
                        $scope.fecharDialog("#produtoDialogDeletar");
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
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
                                $scope.fecharDialog("#produtoDialogMovimentacaoCorrecao");
                                $scope.abrirDialog("#produtoDialogMovimentacao");
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
                            $scope.fecharDialog("#produtoDialogMovimentacaoCorrecao");
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                        });
                    }
                }
            };
            $scope.fecharCorrecaoMovimentacao = function () {
                $scope.preparaProdutoMovimentacao(false);
                $scope.fecharDialog("#produtoDialogMovimentacaoCorrecao");
                $scope.abrirDialog("#produtoDialogMovimentacao");
            };
            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaDescricao': $scope.valorBuscaFornecedor, 'limit': $scope.itensPorPaginaFornecedor};
                    $scope.loadingDialog = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/getAllfornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaFornecedores = response.data.dados;
                            $scope.totalItemsFornecedor = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
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
            $scope.validaProduto = function (idMsg, idComplementar) {
                var retorno = false;
                if ($scope.produtoAtual !== null) {
                    if ($scope.produtoAtual.descricao !== undefined && $scope.produtoAtual.descricao !== null && $scope.produtoAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar descrição!', idMsg);
                        $('#produtoDescricao' + idComplementar).focus();
                        return false;
                    }
                    if ($scope.produtoAtual.valor !== undefined && $scope.produtoAtual.valor !== null && $scope.produtoAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar valor!', idMsg);
                        $('#produtoValor' + idComplementar).focus();
                        return false;
                    }
                    if ($scope.produtoAtual.fornecedor !== undefined && $scope.produtoAtual.fornecedor !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar o fornecedor!', idMsg);
                        $('#produtoFornecedor' + idComplementar).focus();
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
                $scope.produtoAtual = Object.assign({}, produto);
                $(":file").val(null);
                $(":file").filestyle('clear');
                $scope.abrirDialog('#produtoDialogFuncoes');
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
            $scope.preparaProdutoView = function (idModalPai, idModalFilho) {
                if (idModalPai !== null) {
                    $scope.fecharDialog(idModalPai);
                }

                if (idModalFilho !== null) {
                    $scope.abrirDialog(idModalFilho);
                }
            };
            $scope.selecionarFornecedor = function (idModal, fornecedor) {
                $scope.entidadeSelecionada.fornecedor = fornecedor;
                $scope.fecharDialog(idModal);
                $scope.limpaBuscaFornecedor(null);
            };
            $scope.abrirDialog = function (idModal) {
                $(idModal).modal('show');
            };
            $scope.fecharDialog = function (idModal) {
                $(idModal).modal('hide');
            };
            $scope.abrirDialogLocalizarFornecedor = function ($entidade) {
                $scope.limpaBuscaFornecedor($entidade);
                $scope.getListaFornecedorAll(1);
                $('#localizarFornecedorDialog').modal('show');
            };
            $scope.limpaBuscaFornecedorComBusca = function () {
                $scope.listaFornecedores = [];
                $scope.valorBuscaFornecedor = "";
                $scope.currentPageFornecedor = 1;
                $scope.totalItemsFornecedor = 0;
                $scope.getListaFornecedorAll(1);
            };
            $scope.limpaBuscaFornecedor = function ($entidade) {
                $scope.listaFornecedores = [];
                $scope.valorBuscaFornecedor = "";
                $scope.currentPageFornecedor = 1;
                $scope.totalItemsFornecedor = 0;
                if ($entidade !== null) {
                    $entidade.fornecedor = null;
                    $scope.entidadeSelecionada = $entidade;
                }
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