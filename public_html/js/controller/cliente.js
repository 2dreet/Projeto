(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("clienteControler", function ($rootScope, $scope, $http) {
        verificaToken(true);
        ajustaMenuLateral('#btnCliente');

        $scope.clienteAtual = {};
        $scope.listaCliente = [];
        $scope.valorBusca = "";
        $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};

        $scope.maxSize = 3;
        $scope.totalItems = 0;
        $scope.currentPage = 1;
        $scope.itensPorPagina = 10;

        $scope.getListaClienteAll = function (pagina) {
            if (verificaToken(true)) {
                var envio = {'pagina': (pagina - 1), 'token': getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca};

                $rootScope.loading = $http({
                    method: 'POST',
                    data: envio,
                    crossDomain: true,
                    url: urlWs + "produto/getAllproduto",
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        $scope.listaCliente = response.data.dados;
                        $scope.totalItems = response.data.totalRegistro;
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        };

        $scope.insertCliente = function () {
            if (verificaToken(true) && $scope.validaCliente()) {
                var envio = {'dados': $scope.clienteAtual, 'token': getToken()};
                $rootScope.send = $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "cliente/insertCliente",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    $scope.fecharDialog('#cadastroFornecedorDialog');
                    if (!response.data.token) {
                        refazerLogin();
                    } else {
                        setMensagemTemporaria('sucesso', 'Cliente cadastrado!', '#msgClienteGeral');
                        $scope.getListaClienteAll(1);
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgClienteGeral');
                });
            }
        };

        $scope.validaCliente = function () {
            var retorno = false;
            if ($scope.clienteAtual !== null) {

                if ($scope.clienteAtual.descricao !== null && $scope.clienteAtual.descricao.trim() !== "") {
                    retorno = true;
                } else {
                    retorno = false;
                }

                if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email.trim() !== "") {
                    retorno = true;
                } else {
                    retorno = false;
                }

                if ($scope.clienteAtual.telefone !== null && $scope.clienteAtual.telefone.trim() !== "") {
                    retorno = true;
                } else {
                    retorno = false;
                }
            }
            return retorno;
        };

        $scope.novoCliente = function () {
            $scope.clienteAtual = {};
        };

        $scope.preparaCliente = function (cliente) {
            $scope.clienteAtual = Object.assign({}, cliente);
        };

        $scope.fecharDialog = function (idModal) {
            $(idModal).modal('hide');
        };

        $scope.abrirDialog = function (idModal) {
            $(idModal).modal('show');
        };

    });

})();