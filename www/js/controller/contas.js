(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("contasController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnContas');
            $rootScope.paginaAtual = "Contas";
            $rootScope.paginaAtualClass = "fa fa-briefcase botaoComIconeMenuLateral";
            $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});

            $scope.listaTipo = [{'id': '1', 'descricao': 'Boleto'}, {'id': '2', 'descricao': 'Cartão Crédito'}];
            $scope.listaStatus = [{'id': '3', 'descricao': 'Pago'}, {'id': '4', 'descricao': 'Não Pago'}];
            $scope.valorTotal = '0,00';
            $scope.contaAtual = {};
            $scope.listaContas = [];

            $scope.valorBusca = "";
            $scope.buscaAvancada = {};

            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 15;

            $scope.data = {opened: true};
            $scope.openData = function () {
                $scope.data.opened = true;
            };

            $scope.dataInicioFiltro = {opened: true};
            $scope.openDataInicioFiltro = function () {
                $scope.dataInicioFiltro.opened = true;
            };
            $scope.dataFimFiltro = {opened: true};
            $scope.openDataFimFiltro = function () {
                $scope.dataFimFiltro.opened = true;
            };

            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;

                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novaContas();
                }
            };

            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.contaAtual = {};
            };

            $scope.preparaFiltrar = function () {
                $scope.abrir("#localizarContasDialog");
            };

            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#localizarContasDialog");
                }
                $scope.currentPage = 1;
                $scope.getListaContasAll(1);
            };

            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaContasAll(1);
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Contas";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Contas";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Contas";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Contas";
                }
            };

            $scope.getListaContasAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "conta/getAllContas",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.valorTotal = '0,00';
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaContas = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                            $scope.valorTotal = response.data.valorTotal;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgContasGeral');
                    });
                }
            };

            $scope.enviarContas = function () {
                if (Factory.verificaToken(true) && validaContas()) {
                    var fd = new FormData();
                    var campoArquivo = $('#arquivo').prop('files');
                    var arquivo = campoArquivo[0];
                    fd.append('arquivo', arquivo);
                    fd.append('token', Factory.getToken());
                    fd.append('tipoFuncao', $scope.tipoFuncao);
                    fd.append('dados', angular.toJson($scope.contaAtual));

                    $scope.send = $http({
                        url: Factory.urlWs + 'contas/enviarContas' + Factory.debug,
                        method: 'POST',
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.setModoView();
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgContasGeral');
                            $scope.limpaFiltro();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterContas');
                    });
                }
            };

            var validaContas = function () {
                var retorno = false;
                if ($scope.contaAtual !== null) {
                    if ($scope.contaAtual.descricao !== undefined && $scope.contaAtual.descricao !== null && $scope.contaAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Descrição!', '#msgManterContas');
                        $('#descricao').focus();
                        return false;
                    }

                    if ($scope.contaAtual.valor !== undefined && $scope.contaAtual.valor !== null && $scope.contaAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Valor!', '#msgManterContas');
                        $('#valor').focus();
                        return false;
                    }

                    if ($scope.contaAtual.data_vencimento !== undefined && $scope.contaAtual.data_vencimento !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Data!', '#msgManterContas');
                        $('#data').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novaContas = function () {
                $scope.contaAtual = {'status': $scope.listaStatus[1], 'tipo': $scope.listaTipo[0]};
                $(":file").val(null);
                $(":file").filestyle('clear');
            };

            $scope.preparaContas = function (conta) {
                $scope.contaAtual = JSON.parse(JSON.stringify(conta));
                $scope.contaAtual.data_lancamento = Utilitario.dataDbToJS($scope.contaAtual.data_lancamento);
            };

            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.preparaCrud = function (idModal, tipoFuncao) {
                $scope.tipoFuncao = tipoFuncao;
                $(idModal).modal('hide');
            };

            $scope.getListaContasAll(1);
        }]);
})();