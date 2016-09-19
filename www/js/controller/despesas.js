(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("despesasController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnDespesas');
            $rootScope.paginaAtual = "Despesas";
            $rootScope.paginaAtualClass = "fa fa-usd botaoComIconeMenuLateral";
            $scope.valorTotal = '0,00';
            $scope.despesaAtual = {};
            $scope.listaDespesas = [];
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
                    $scope.novaDespesa();
                }
            };
            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.despesaAtual = {};
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#localizarDespesaDialog");
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#localizarDespesaDialog");
                }
                $scope.currentPage = 1;
                $scope.getListaDespesaAll(1);
            };

            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaDespesaAll(1);
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Despesa";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Despesa";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Despesa";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Despesa";
                }
            };

            $scope.getListaDespesaAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "despesa/getAllDespesa/",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.valorTotal = '0,00';
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaDespesas = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                            $scope.valorTotal = response.data.valorTotal;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgDespesaGeral');
                    });
                }
            };

            $scope.enviarDespesa = function () {
                if (Factory.verificaToken(true) && validaDespesa()) {
                    var envio = {'dados': $scope.despesaAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "despesa/enviarDespesa",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgDespesaGeral');
                            if ($scope.tipoFuncao === "inserir" || $scope.tipoFuncao === "alterar") {
                                $scope.listaDespesas = [];
                                $scope.listaDespesas.push($scope.despesaAtual);
                                $scope.totalItems = 1;
                                $scope.valorTotal = $scope.despesaAtual.valor;
                            } else {
                                if ($scope.tipoFuncao === "deletar") {
                                    $scope.limpaFiltro();
                                }
                            }
                            $scope.setModoView();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterDespesa');
                    });
                }
            };

            var validaDespesa = function () {
                var retorno = false;
                if ($scope.despesaAtual !== null) {

                    if ($scope.despesaAtual.descricao !== undefined && $scope.despesaAtual.descricao !== null && $scope.despesaAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Descrição!', '#msgManterDespesa');
                        $('#descricao').focus();
                        return false;
                    }

                    if ($scope.despesaAtual.valor !== undefined && $scope.despesaAtual.valor !== null && $scope.despesaAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Valor!', '#msgManterDespesa');
                        $('#valor').focus();
                        return false;
                    }

                    if ($scope.despesaAtual.data_lancamento !== undefined && $scope.despesaAtual.data_lancamento !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Data!', '#msgManterDespesa');
                        $('#data').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novaDespesa = function () {
                $scope.despesaAtual = {};
            };

            $scope.preparaDespesa = function (despesa) {
                $scope.despesaAtual = JSON.parse(JSON.stringify(despesa));
                $scope.despesaAtual.data_lancamento = Utilitario.dataDbToJS($scope.despesaAtual.data_lancamento);
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

            $scope.getListaDespesaAll(1);
        }]);
})();