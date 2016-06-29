(function () {
    'use strict'

    angular.module('www.geve.com.br').controller("fornecedorControler", function ($scope, $http) {
        verificaToken(true);
        ajustaMenuLateral('#btnFornecedor');

        $scope.fornecedorAtual = {};
        $scope.listaFornecedores = [];
        $scope.valorBusca = {valor: ""};

        $scope.getListaFornecedorBusca = function () {
            if (verificaToken(true)) {
                var valorBusca = $scope.valorBusca.valor;
                if (valorBusca === null || valorBusca.trim() === "") {
                    $scope.getListaFornecedorAll();
                } else {
                    var envio = {'valor_busca': valorBusca, 'token': getToken()};
                    $scope.loadinFornecedor = $http({
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
                        alert('Erro no sistema!');
                    });
                }
            }
        };

        $scope.getListaFornecedorAll = function () {
            if (verificaToken(true)) {
                $scope.loadinFornecedor = $http({
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
                    alert('Erro no sistema!');
                });
            }
        };

        $scope.updateFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $http({
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
                        $scope.getListaFornecedorAll();
                        alert('Salvado com sucesso!');
                    }
                }, function errorCallback(response) {
                    alert('Erro no sistema!');
                });
            }
        };

        $scope.insertFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $http({
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
                        $scope.getListaFornecedorAll();
                        alert('Cadastrado com sucesso!');
                    }
                }, function errorCallback(response) {
                    alert('Erro no sistema!');
                });
            }
        };

        $scope.deleteFornecedor = function () {
            if (verificaToken(true) && $scope.validaFornecedor()) {
                var envio = {'dados': $scope.fornecedorAtual, 'token': getToken()};
                $http({
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
                        $scope.getListaFornecedorAll();
                        alert('Deletador com sucesso!');
                    }
                }, function errorCallback(response) {
                    alert('Erro no sistema!');
                });
            }
        };

        $scope.validaFornecedor = function () {
            var retorno = false;
            if ($scope.fornecedorAtual != null) {

                if ($scope.fornecedorAtual.descricao != null && $scope.fornecedorAtual.descricao.trim() != "") {
                    retorno = true;
                } else {
                    retorno = false;
                }

                if ($scope.fornecedorAtual.email != null && $scope.fornecedorAtual.email.trim() != "") {
                    retorno = true;
                } else {
                    retorno = false;
                }

                if ($scope.fornecedorAtual.telefone != null && $scope.fornecedorAtual.telefone.trim() != "") {
                    retorno = true;
                } else {
                    retorno = false;
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

        $scope.getListaFornecedorAll();
    });

})();