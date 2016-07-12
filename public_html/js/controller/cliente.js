(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("clienteControler", function ($rootScope, $scope, $http) {
        verificaToken(true);
        ajustaMenuLateral('#btnCliente');

        $scope.clienteAtual = {};
        $scope.listaCliente = [];
        $scope.valorBuscaCliente = "";
        $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};

        $scope.listaSexo = ["Masculino", "Feminino"];

        $scope.dataNascimento = {opened: true};
        $scope.opendataNascimento = function () {
            $scope.dataNascimento.opened = true;
        };


        $scope.telefone = {};
        $scope.tipoTelefone = {};
        $scope.listaTelefone = [];

        $scope.listaTipoTelefone = [
            {id: 1, descricao: 'Residencial'},
            {id: 2, descricao: 'Celular'},
            {id: 3, descricao: 'WhatsApp'}
        ];

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
                    url: urlWs + "cliente/getAllCliente",
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

        $scope.novoTelefone = function () {
            $scope.telefone = {};
            $scope.tipoTelefone = {};
        };

        $scope.addTelefone = function () {
            if ($scope.validaFone()) {
                var telefoneAdd = Object.assign({}, $scope.telefone);
                telefoneAdd.tipoTelefone = Object.assign({}, $scope.tipoTelefone);
                $scope.listaTelefone.push(telefoneAdd);
                $scope.novoTelefone();
            }
        };

        $scope.validaFone = function () {
            if ($scope.telefone.numero !== null && $scope.telefone.numero !== undefined && $scope.telefone.numero.trim() !== "") {
                return true;
            } else {
                setMensagemTemporaria('erro', 'Informar Telefone!', '#msgClienteCadatro');
                return false;
            }

            if ($scope.telefone.tipoTelefone !== null && $scope.telefone.tipoTelefone !== undefined && $scope.telefone.tipoTelefone.id !== undefined) {
                return true;
            } else {
                setMensagemTemporaria('erro', 'Informar Tipo!', '#msgClienteCadatro');
                return false;
            }
        };

        $scope.avancaCliente = function (i) {
//            if (i === 0 && $scope.validaCliente()) {
//                $scope.indice = i + 1;
//            } else if (i === 1 && $scope.validaCliente()) {
//                $scope.indice = i + 1;
//            } else if (i === 2 && $scope.validaCliente()) {
//                $scope.indice = i + 1;
//            }
            $scope.novoTelefone();
            $scope.indice = i + 1;
        };

        $scope.validaCliente = function () {
            var retorno = false;
            if ($scope.clienteAtual !== null) {

                if ($scope.clienteAtual.nome !== null && $scope.clienteAtual.nome !== undefined && $scope.clienteAtual.nome.trim() !== "") {
                    retorno = true;
                } else {
                    return false;
                }
                if ($scope.clienteAtual.sobreNome !== null && $scope.clienteAtual.sobreNome !== undefined && $scope.clienteAtual.sobreNome.trim() !== "") {
                    retorno = true;
                } else {
                    return false;
                }

                if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email !== undefined && $scope.clienteAtual.email.trim() !== "") {
                    retorno = true;
                } else {
                    return false;
                }
                if ($scope.clienteAtual.dataNascimento !== null && $scope.clienteAtual.dataNascimento !== undefined) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Informar Data Nascimento!', '#msgClienteCadatro');
                    return false;
                }
            }
            return retorno;
        };

        $scope.limparDadosCliente = function () {
            $scope.telefone = {};
            $scope.listaTelefone = [];
            $scope.indice = 0;
        };

        $scope.novoCliente = function () {
            $scope.clienteAtual = {};
            $scope.clienteAtual.sexo = $scope.listaSexo[0].value;
            $scope.abrirDialog('#clienteDialogCadastro');
            $scope.limparDadosCliente();
            $scope.novoTelefone();
        };

        $scope.preparaCliente = function (cliente) {
            $scope.clienteAtual = Object.assign({}, cliente);
            $scope.limparDadosCliente();
        };

        $scope.fecharDialog = function (idModal) {
            $(idModal).modal('hide');
        };

        $scope.abrirDialog = function (idModal) {
            $(idModal).modal('show');
        };

    });

})();