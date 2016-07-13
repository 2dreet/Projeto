(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("fornecedorControler", function ($rootScope, $scope, $http) {
        verificaToken(true);
        ajustaMenuLateral('#btnFornecedor');

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
            if (verificaToken(true)) {
                var envio = {'pagina': (pagina - 1), 'token': getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                $rootScope.loading = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "fornecedor/getAllfornecedor/" + getToken(),
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        $scope.listaFornecedores = response.data.dados;
                        $scope.totalItems = response.data.totalRegistro;
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                });
            }
        };

        $scope.updateFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $scope.send = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "fornecedor/updateFornecedor",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    $scope.fecharDialog('#cadastroFornecedorDialogAlterar');
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        setMensagemTemporaria('sucesso', 'Fornecedor alterado!', '#msgFornecedorGeral');
                        $scope.getListaFornecedorAll(1);
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                });
            }
        };

        $scope.insertFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $scope.send = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "fornecedor/insertFornecedor",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    $scope.fecharDialog('#cadastroFornecedorDialog');
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        setMensagemTemporaria('sucesso', 'Fornecedor cadastrado!', '#msgFornecedorGeral');
                        $scope.getListaFornecedorAll(1);
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                });
            }
        };

        $scope.deleteFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $scope.send = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "fornecedor/deleteFornecedor",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    $scope.fecharDialog('#cadastroFornecedorDialogDeletar');
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        setMensagemTemporaria('sucesso', 'Fornecedor deletado!', '#msgFornecedorGeral');
                        $scope.getListaFornecedorAll(1);
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                });
            }
        };

        $scope.validaFornecedor = function () {
            var retorno = false;
            if ($scope.fornecedorAtual !== null) {

                if ($scope.fornecedorAtual.descricao !== null && $scope.fornecedorAtual.descricao.trim() !== "") {
                    retorno = true;
                } else {
                    return false;
                }

                if ($scope.fornecedorAtual.email !== null && $scope.fornecedorAtual.email.trim() !== "") {
                    retorno = true;
                } else {
                    return false;
                }

                if ($scope.fornecedorAtual.telefone !== null && $scope.fornecedorAtual.telefone.trim() !== "") {
                    retorno = true;
                } else {
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
    });

})();