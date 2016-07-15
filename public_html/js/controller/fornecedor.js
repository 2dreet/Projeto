(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("fornecedorControler", ['$rootScope', '$scope', '$http', 'Factory', function ($rootScope, $scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnFornecedor');

            $scope.fornecedorAtual = {};
            $scope.listaFornecedores = [];
            $scope.valorBusca = "";
            $scope.buscaAvancada = {descricao: "", email: "", telefone: ""};

            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 15;

            $scope.limpaFiltroAvancado = function () {
                $scope.buscaAvancada = {descricao: "", email: "", telefone: ""};
                $scope.valorBusca = "";
                $scope.getListaFornecedorAll(1);
            };

            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancada = {descricao: "", email: "", telefone: ""};
                $scope.getListaFornecedorAll(1);
            };

            $scope.filtrarAvancado = function () {
                $scope.valorBusca = "";
                $scope.getListaFornecedorAll(1);
                $scope.fecharDialog('#localizarFornecedorDialog');
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

            $scope.updateFornecedor = function () {
                if (Factory.verificaToken(true) && $scope.validaFornecedor('#msgFornecedorAlt', 'Alterar')) {
                    var envio = {'dados': $scope.fornecedorAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/updateFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#cadastroFornecedorDialogAlterar');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Fornecedor alterado!', '#msgFornecedorGeral');
                            $scope.getListaFornecedorAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                    });
                }
            };

            $scope.insertFornecedor = function () {
                if (Factory.verificaToken(true) && $scope.validaFornecedor('#msgFornecedorCad', '')) {
                    var envio = {'dados': $scope.fornecedorAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/insertFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#cadastroFornecedorDialog');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Fornecedor cadastrado!', '#msgFornecedorGeral');
                            $scope.getListaFornecedorAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                    });
                }
            };

            $scope.deleteFornecedor = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'dados': $scope.fornecedorAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/deleteFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#cadastroFornecedorDialogDeletar');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Fornecedor deletado!', '#msgFornecedorGeral');
                            $scope.getListaFornecedorAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                    });
                }
            };

            $scope.validaFornecedor = function (idMsg, idComplementar) {
                var retorno = false;
                if ($scope.fornecedorAtual !== null) {

                    if ($scope.fornecedorAtual.descricao !== undefined && $scope.fornecedorAtual.descricao !== null && $scope.fornecedorAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Fornecedor!', idMsg);
                        $('#fornecedor' + idComplementar).focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.email !== undefined && $scope.fornecedorAtual.email !== null && $scope.fornecedorAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Email!', idMsg);
                        $('#fornecedorEmail' + idComplementar).focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.telefone !== undefined && $scope.fornecedorAtual.telefone !== null && $scope.fornecedorAtual.telefone.trim() !== "" && ($scope.fornecedorAtual.telefone.length === 10 || $scope.fornecedorAtual.telefone.length === 11)) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Telefone!', idMsg);
                        $('#fornecedorFone' + idComplementar).focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novoFornecedor = function () {
                $scope.fornecedorAtual = {};
            };

            $scope.preparaFornecedor = function (fornecedor) {
                $scope.fornecedorAtual = Object.assign({}, fornecedor);
            };

            $scope.fecharDialog = function (idModal) {
                $(idModal).modal('hide');
            };

            $scope.getListaFornecedorAll(1);
        }]);

})();