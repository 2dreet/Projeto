
(function () {
    'use strict'

    angular.module('www.geve.com.br').controller("produtoControler", function ($scope, $http) {
        verificaToken(true);
        ajustaMenuLateral('#btnProduto');

        $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});

        $scope.estoqueFuturo = 0;

        $scope.listaFornecedores = [];
        $scope.valorBuscaFornecedor = {valor: ""};

        $scope.produtoAtual = {observacao: ""};
        $scope.listaProduto = [];

        $scope.buscaAvancada = {};

        $scope.entidadeSelecionada = {};

        $scope.valorBuscaProduto = "";

        $scope.listaTipoMovimentacaoCorrecao = [
            {id: 4, descricao: 'Cortesia'},
            {id: 5, descricao: 'Correção'},
            {id: 1, descricao: 'Entrada'},
            {id: 3, descricao: 'Perda'}
        ];

        $scope.listaProdutoMovimentacao = [];


        $scope.maxSize = 3;
        $scope.totalItems = 0;
        $scope.currentPage = 1;
        $scope.itensPorPagina = 10;

        $scope.totalItemsMovimentacao = 0;
        $scope.currentPageMovimentacao = 1;

        $scope.limpaFiltroAvancado = function () {
            $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
        };

        $scope.getImagem = function (idItem) {
            if (verificaToken(true) && idItem > 0) {
                var random = (new Date()).toString();
                return urlImagem + idItem + "/" + getToken() + "?cb=" + random;
            }
        };


        $scope.filtrarAvancado = function () {
            $scope.getListaProdutoAll(1, 1);
            $scope.fecharDialog('#localizarProdutoDialog');
        };

        $scope.getListaProdutoAll = function (pagina, tipoBusca) {
            if (verificaToken(true)) {
                var envio = null;
                if (tipoBusca == 1) {
                    envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': getToken(), 'buscaAvancada': $scope.buscaAvancada};
                } else if (tipoBusca == 2) {
                    envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': getToken(), 'buscaDescricao': $scope.valorBuscaProduto};
                } else {
                    envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': getToken()};
                }

                $scope.loadinProduto = $http({
                    method: 'POST',
                    data: envio,
                    crossDomain: true,
                    url: urlWs + "produto/getAllproduto" + debug,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        $scope.listaProduto = response.data.dados;
                        $scope.totalItems = response.data.totalRegistro;
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        };

        $scope.getListaMovimentacao = function (pagina) {
            $scope.listaProdutoMovimentacao = [];
            if (verificaToken(true)) {
                var envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': getToken()};
                $scope.loadinProduto = $http({
                    method: 'POST',
                    data: envio,
                    crossDomain: true,
                    url: urlWs + "produto/getMovimentacaoProduto",
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        $scope.listaProdutoMovimentacao = response.data.dados;
                        $scope.totalItemsMovimentacao = response.data.totalRegistro;
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        };

        $scope.validaImagem = function (mostraMenssagemErro, idCampoImagem, idCampoMsg) {
            var campoImagem = $(idCampoImagem).prop('files');
            if (campoImagem !== null && $(idCampoImagem).eq(0).val() != "") {
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
            if (verificaToken(true)) {
                if ($scope.validaProduto('#msgProduto')) {
                    var fd = new FormData();
                    if ($scope.validaImagem(false, '#produtoImagemCadastro', '#msgProduto')) {
                        var campoImagem = $('#produtoImagemCadastro').prop('files');
                        var imagem = campoImagem[0];
                        fd.append('imagem', imagem);
                    }
                    fd.append('token', getToken());
                    fd.append('dados', angular.toJson($scope.produtoAtual));
                    $scope.enviarProduto = $http({
                        url: urlWs + 'produto/insertProduto',
                        method: 'POST',
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            refazerLogin();
                        } else {
                            $scope.fecharDialog("#produtoCadastroDialog");
                            setMensagemTemporaria('sucesso', 'Produto cadastrado!', '#msgProdutoGeral');
                            $scope.getListaProdutoAll(1, 0);
                        }
                    }, function errorCallback(response) {
                        $scope.fecharDialog("#produtoCadastroDialog");
                        setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            }
        };

        $scope.updateProduto = function () {
            $scope.message = "";
            if (verificaToken(true)) {
                if ($scope.validaProduto('#msgProdutoAlterar')) {
                    var fd = new FormData();
                    if ($scope.validaImagem(false, '#produtoImagemAlterar', '#msgProdutoAlterar')) {
                        var campoImagem = $('#produtoImagemAlterar').prop('files');
                        var imagem = campoImagem[0];
                        fd.append('imagem', imagem);
                    }
                    fd.append('token', getToken());
                    fd.append('dados', angular.toJson($scope.produtoAtual));
                    $scope.enviarProduto = $http({
                        url: urlWs + 'produto/updatetProduto',
                        method: 'POST',
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            refazerLogin();
                        } else {
                            $scope.getListaProdutoAll(1, 0);
                            $scope.fecharDialog("#produtoDialogAlterar");
                            setMensagemTemporaria('sucesso', 'Produto alterado!', '#msgProdutoGeral');
                        }
                    }, function errorCallback(response) {
                        $scope.fecharDialog("#produtoDialogAlterar");
                        setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            }
        };

        $scope.deleteProduto = function () {
            if (verificaToken(true)) {
                var envio = {'dados': $scope.produtoAtual, 'token': getToken()};
                $scope.enviarProduto = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "produto/deleteProduto",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        $scope.getListaProdutoAll(1, 0);
                        $scope.fecharDialog("#produtoDialogDeletar");
                        setMensagemTemporaria('sucesso', 'Produto Deletado!', '#msgProdutoGeral');
                    }
                }, function errorCallback(response) {
                    $scope.fecharDialog("#produtoDialogDeletar");
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        };

        $scope.movimentarProdutoCorrecao = function () {
            $scope.message = "";
            if (verificaToken(true)) {
                if ($scope.validaCorrecao()) {
                    var produto = {id: $scope.produtoAtual.id, estoque: $scope.produtoAtual.estoque, tipoMovimentacao: $scope.produtoAtual.tipoMovimentacao, estoque_movimento_observacao: $scope.produtoAtual.estoque_movimento_observacao, estoque_movimento: $scope.produtoAtual.estoque_movimento};
                    var envio = {'dados': produto, 'token': getToken()};
                    $scope.enviarProduto = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: urlWs + "produto/movimentarProduto",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            refazerLogin();
                        } else {
                            $scope.getListaProdutoAll(1, 0);
                            $scope.fecharDialog("#produtoDialogMovimentacaoCorrecao");
                            setMensagemTemporaria('sucesso', 'Estoque Movimentado!', '#msgProdutoGeral');
                        }
                    }, function errorCallback(response) {
                        $scope.fecharDialog("#produtoDialogMovimentacaoCorrecao");
                        setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            }
        };

        $scope.getListaFornecedorBusca = function () {
            if (verificaToken(true)) {
                var valorBusca = $scope.valorBuscaFornecedor.valor;
                if (valorBusca === null || valorBusca.trim() === "") {
                    $scope.getListaFornecedorAll();
                } else {
                    var envio = {'valor_busca': valorBusca, 'token': getToken()};
                    $http({
                        method: 'POST',
                        crossDomain: true,
                        url: urlWs + "fornecedor/getFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data[1].token) {
                            refazerLogin();
                        } else {
                            $scope.listaFornecedores = response.data[0].dados;
                        }
                    }, function errorCallback(response) {
                        setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            }
        };

        $scope.getListaFornecedorAll = function () {
            if (verificaToken(true)) {
                $http({
                    method: 'GET',
                    crossDomain: true,
                    url: urlWs + "fornecedor/getAllfornecedor/" + getToken()
                }).then(function successCallback(response) {
                    if (!response.data[1].token) {
                        refazerLogin();
                    } else {
                        $scope.listaFornecedores = response.data[0].dados;
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        };

        $scope.validaCorrecao = function () {
            var retorno = false;
            if ($scope.produtoAtual != null) {
                if ($scope.produtoAtual.estoque_movimento != null && $scope.produtoAtual.estoque_movimento > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Deve informar Quantidade!', '#msgCorrecao');
                    return false;
                }

                if ($scope.produtoAtual.estoque_movimento_observacao != null && $scope.produtoAtual.estoque_movimento_observacao.trim() != "") {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Deve informar observação!', '#msgCorrecao');
                    return false;
                }

                if ($scope.produtoAtual.tipoMovimentacao != null && $scope.produtoAtual.tipoMovimentacao > 0) {
                    if ($scope.produtoAtual.tipoMovimentacao > 1 && $scope.produtoAtual.tipoMovimentacao < 5) {
                        var valorFinal = $scope.produtoAtual.estoque - $scope.produtoAtual.estoque_movimento;
                        if (valorFinal >= 0) {
                            retorno = true;
                        } else {
                            setMensagemTemporaria('erro', 'Valor final não deve ser negativo!', '#msgCorrecao');
                            return false;
                        }
                    } else {
                        retorno = true;
                    }
                } else {
                    setMensagemTemporaria('erro', 'Deve informar tipo movimentação!', '#msgCorrecao');
                    return false;
                }
            }
            return retorno;
        };

        $scope.validaProduto = function (idMsg) {
            var retorno = false;
            if ($scope.produtoAtual != null) {
                if ($scope.produtoAtual.descricao != null && $scope.produtoAtual.descricao.trim() != "") {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Deve informar descrição!', idMsg);
                    return false;
                }
                if ($scope.produtoAtual.valor != null && $scope.produtoAtual.valor > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Deve informar valor!', idMsg);
                    return false;
                }
                if ($scope.produtoAtual.fornecedor != null) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Deve informar o fornecedor!', idMsg);
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

        $scope.preparaProdutoMovimentacao = function () {
            $scope.getListaMovimentacao(1);
            $scope.produtoAtual.tipoMovimentacao = 0;
            $scope.produtoAtual.estoque_movimento_observacao = "";
            $scope.preparaProdutoView('#produtoDialogFuncoes', '#produtoDialogMovimentacao');
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
        };

        $scope.abrirDialog = function (idModal) {
            $(idModal).modal('show');
        };

        $scope.fecharDialog = function (idModal) {
            $(idModal).modal('hide');
        };

        $scope.limpaBuscaFornecedor = function ($entidade) {
            $scope.listaFornecedores = [];
            $scope.valorBuscaFornecedor = {valor: ""};
            $scope.entidadeSelecionada = $entidade;

        };

        $scope.getListaProdutoAll(1, 0);

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

    });
})();