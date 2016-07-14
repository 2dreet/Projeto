(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("clienteControler", ['$rootScope', '$scope', '$http', 'BuscaCep', 'Formulario', function ($rootScope, $scope, $http, BuscaCep, Formulario) {
            verificaToken(true);
            ajustaMenuLateral('#btnCliente');
            $scope.clienteAtual = {};
            $scope.clienteEndereco = {};
            $scope.listaCliente = [];
            $scope.valorBuscaCliente = "";
            $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
            $scope.listaSexo = ["Masculino", "Feminino"];
            $scope.dataNascimento = {opened: true};
            $scope.opendataNascimento = function () {
                $scope.dataNascimento.opened = true;
            };

            $scope.listaUF = Formulario.getUF();

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
                BuscaCep.getViaCep($scope.clienteEndereco.cep).then(function (d) {
                    $scope.clienteEndereco.logradouro = d.data.logradouro;
                    $scope.clienteEndereco.bairro = d.data.bairro;
                    $scope.clienteEndereco.cidade = d.data.localidade;
                    $scope.clienteEndereco.uf = d.data.uf;
                });
            };

            $scope.insertCliente = function () {
                if (verificaToken(true) && validaEnvioCliente()) {
                    $scope.clienteAtual.endereco = $scope.clienteEndereco;
                    $scope.clienteAtual.telefone = $scope.listaTelefone;
                    var envio = {'dados': $scope.clienteAtual, 'token': getToken()};
                    $rootScope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: urlWs + "cliente/insertCliente",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#clienteDialogCadastro');
                        if (!response.data.token) {
                            refazerLogin();
                        } else {
                            setMensagemTemporaria('sucesso', 'Cliente cadastrado!', '#msgClienteGeral');
                            //$scope.getListaClienteAll(1);
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
                        if (i === $scope.telefone.index) {
                            $scope.listaTelefone[i] = $scope.telefone;
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
            };

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

            var validaListaFone = function () {
                var retorno = false;
                if ($scope.listaTelefone !== null && $scope.listaTelefone.length > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Informar Telefone!', '#msgClienteCadatro');
                    return false;
                }
                return retorno;
            };

            var validaEndereco = function () {
                var retorno = false;
                if ($scope.clienteEndereco.cep !== undefined && $scope.clienteEndereco.cep !== null && ($scope.clienteEndereco.cep.trim()).length === 8) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Cep Inválido!', '#msgClienteCadatro');
                    return false;
                }
                if ($scope.clienteEndereco.logradouro !== undefined && $scope.clienteEndereco.logradouro !== null && ($scope.clienteEndereco.logradouro.trim()).length > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Logradouro Inválido!', '#msgClienteCadatro');
                    return false;
                }
                if ($scope.clienteEndereco.bairro !== undefined && $scope.clienteEndereco.bairro !== null && ($scope.clienteEndereco.bairro.trim()).length > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Bairro Inválido!', '#msgClienteCadatro');
                    return false;
                }
                if ($scope.clienteEndereco.cidade !== undefined && $scope.clienteEndereco.cidade !== null && ($scope.clienteEndereco.cidade.trim()).length > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Cidade Inválida!', '#msgClienteCadatro');
                    return false;
                }
                if ($scope.clienteEndereco.uf !== undefined && $scope.clienteEndereco.uf !== null && ($scope.clienteEndereco.uf.trim()).length === 2) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'UF Inválida!', '#msgClienteCadatro');
                    return false;
                }
                if ($scope.clienteEndereco.numero !== undefined && $scope.clienteEndereco.numero !== null && $scope.clienteEndereco.numero > 0) {
                    retorno = true;
                } else {
                    setMensagemTemporaria('erro', 'Número Inválido!', '#msgClienteCadatro');
                    return false;
                }
                return retorno;
            };

            var validaEnvioCliente = function () {
                var retorno = false;
                if (validaCliente()) {
                    retorno = true;
                } else {
                    $scope.indice = 0;
                }
                if (validaEndereco()) {
                    retorno = true;
                } else {
                    $scope.indice = 1;
                }
                if (validaListaFone()) {
                    retorno = true;
                } else {
                    $scope.indice = 2;
                }
                return  retorno;
            };

            $scope.avancaCliente = function (i) {
                if (i === 0 && validaCliente()) {
                    $scope.indice = i + 1;
                } else if (i === 1 && validaEndereco()) {
                    $scope.indice = i + 1;
                }
            };

            var validaCliente = function () {
                var retorno = false;
                if ($scope.clienteAtual !== null) {

                    if ($scope.clienteAtual.nome !== null && $scope.clienteAtual.nome !== undefined && $scope.clienteAtual.nome.trim() !== "") {
                        retorno = true;
                    } else {
                        setMensagemTemporaria('erro', 'Nome Inválido!', '#msgClienteCadatro');
                        return false;
                    }
                    if ($scope.clienteAtual.sobreNome !== null && $scope.clienteAtual.sobreNome !== undefined && $scope.clienteAtual.sobreNome.trim() !== "") {
                        retorno = true;
                    } else {
                        setMensagemTemporaria('erro', 'Sobrenome Inválido!', '#msgClienteCadatro');
                        return false;
                    }

                    if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email !== undefined && $scope.clienteAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        setMensagemTemporaria('erro', 'Email Inválido!', '#msgClienteCadatro');
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
                $scope.clienteEndereco = {};
                $scope.clienteEndereco.uf = "AC";
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