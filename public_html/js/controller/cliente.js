(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("clienteControler", ['$rootScope', '$scope', '$http', 'BuscaCep', function ($rootScope, $scope, $http, BuscaCep) {
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
        $scope.listaTelefone = [];
        $scope.editandoTelefone = false;
        $scope.listaTipoTelefone = [{id: 1, descricao: "Residencial"}, {id: 2, descricao: "Celular"}, {id: 3, descricao: "WhatsApp"}];
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
        
        $scope.getCep = function () {
            var cep = BuscaCep.getViaCep("81310000");
            alert(cep);
        };
        
        $scope.getCep();

        $scope.insertCliente = function () {
            if (verificaToken(true) && validaCliente()) {
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
            $scope.editandoTelefone = false;
            $scope.telefone.tipoTelefone = $scope.listaTipoTelefone[0];
        };

        $scope.editaTelefone = function (telefone) {
            $scope.editandoTelefone = true;
            $scope.telefone = Object.assign({}, telefone);
        };

        $scope.salvaTelefone = function () {
            if (validaFone()) {
                for (var i = $scope.listaTelefone.length; i--; ) {
                    if (i ===  $scope.telefone.index) {
                        $scope.listaTelefone[i] =  $scope.telefone;
                        $scope.novoTelefone();
                    }
                }
            }
        };


        $scope.addTelefone = function () {
            if (validaFone()) {
                var telefoneAux = Object.assign({}, $scope.telefone);
                telefoneAux.index = $scope.listaTelefone.length;
                $scope.listaTelefone.push(telefoneAux);
                $scope.novoTelefone();
            }
        };

        $scope.removeTelefone = function (item) {
            for (var i = $scope.listaTelefone.length; i--; ) {
                if ($scope.listaTelefone[i] === item) {
                    $scope.listaTelefone.splice(i, 1);
                }
            }
        }

        var validaFone = function () {
            var retorno = false;
            if ($scope.telefone.numero !== null && $scope.telefone.numero !== undefined && $scope.telefone.numero.trim() !== "") {
                retorno = true;
            } else {
                setMensagemTemporaria('erro', 'Informar Telefone!', '#msgClienteCadatro');
                return false;
            }

            if ($scope.telefone.tipoTelefone !== null && $scope.telefone.tipoTelefone !== undefined) {
                retorno = true;
            } else {
                setMensagemTemporaria('erro', 'Informar Tipo!', '#msgClienteCadatro');
                return false;
            }
            return retorno;
        };

        $scope.avancaCliente = function (i) {
//            if (i === 0 && validaCliente()) {
//                $scope.indice = i + 1;
//            } else if (i === 1 && validaCliente()) {
//                $scope.indice = i + 1;
//            } else if (i === 2 && validaCliente()) {
//                $scope.indice = i + 1;
//            }
            $scope.indice = i + 1;
        };

        var validaCliente = function () {
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

        var limparDadosCliente = function () {
            $scope.novoTelefone();
            $scope.listaTelefone = [];
            $scope.indice = 0;
        };

        $scope.novoCliente = function () {
            $scope.clienteAtual = {};
            $scope.abrirDialog('#clienteDialogCadastro');
            limparDadosCliente();
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
    }]);
})();