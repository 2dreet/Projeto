(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("fornecedorControler", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnFornecedor');
            $rootScope.paginaAtual = "Fornecedores";
            $rootScope.paginaAtualClass = "fa fa-briefcase botaoComIconeMenuLateral";

            $scope.fornecedorAtual = {};
            $scope.listaFornecedores = [];
            $scope.valorBusca = "";
            $scope.buscaAvancada = {descricao: "", email: "", telefone: ""};
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 15;

            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novoFornecedor();
                }
            };
            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.fornecedorAtual = {};
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#localizarFornecedorDialog");
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#localizarFornecedorDialog");
                }
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll(1);
            };

            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll(1);
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Fornecedor";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Fornecedor";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Fornecedor";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Fornecedor";
                }
            };

            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/getAllfornecedor/",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaFornecedores = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                    });
                }
            };

            $scope.enviarFornecedor = function () {
                if (Factory.verificaToken(true) && validaFornecedor()) {
                    var envio = {'dados': $scope.fornecedorAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/enviarFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgFornecedorGeral');
                            if ($scope.tipoFuncao === "inserir" || $scope.tipoFuncao === "alterar") {
                                $scope.listaFornecedores = [];
                                $scope.listaFornecedores.push($scope.fornecedorAtual);
                                $scope.totalItems = 1;
                            } else {
                                $scope.currentPage = 1;
                                $scope.getListaFornecedorAll(1);
                            }
                            $scope.setModoView();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterFornecedor');
                    });
                }
            };

            var validaFornecedor = function () {
                var retorno = false;
                if ($scope.fornecedorAtual !== null) {

                    if ($scope.fornecedorAtual.descricao !== undefined && $scope.fornecedorAtual.descricao !== null && $scope.fornecedorAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Fornecedor!', '#msgManterFornecedor');
                        $('#fornecedor').focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.email !== undefined && $scope.fornecedorAtual.email !== null && $scope.fornecedorAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Email!', '#msgManterFornecedor');
                        $('#fornecedorEmail').focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.telefone !== undefined && $scope.fornecedorAtual.telefone !== null && $scope.fornecedorAtual.telefone.trim() !== "" && ($scope.fornecedorAtual.telefone.length === 10 || $scope.fornecedorAtual.telefone.length === 11)) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Telefone!', '#msgManterFornecedor');
                        $('#fornecedorFone').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novoFornecedor = function () {
                $scope.fornecedorAtual = {};
            };

            $scope.preparaFornecedor = function (fornecedor) {
                $scope.fornecedorAtual = JSON.parse(JSON.stringify(fornecedor));
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

            $scope.getListaFornecedorAll(1);
        }]);

})();