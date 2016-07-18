(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("clienteControler", ['$rootScope', '$scope', '$http', 'BuscaCep', 'Formulario', 'Utilitario', 'Factory',
        function ($rootScope, $scope, $http, BuscaCep, Formulario, Utilitario, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnCliente');

            $scope.clienteAtual = {};
            $scope.clienteEndereco = {};
            $scope.listaCliente = [];
            $scope.valorBuscaCliente = "";
            $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
            $scope.listaSexo = Formulario.getSexo();
            $scope.dataNascimento = {opened: true};
            $scope.opendataNascimento = function () {
                $scope.dataNascimento.opened = true;
            };
            $scope.listaUF = Formulario.getUF();
            $scope.telefone = {};
            $scope.listaTelefone = [];
            $scope.editandoTelefone = false;
            $scope.listaTipoTelefone = Formulario.getTipoTelefone();
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.getListaClienteAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/getAllCliente" + Factory.debug,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaCliente = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            };

            $scope.getCep = function () {
                if ($scope.clienteEndereco.cep !== undefined && $scope.clienteEndereco.cep !== null && $scope.clienteEndereco.cep.trim().length === 8) {
                    BuscaCep.getViaCep($scope.clienteEndereco.cep).then(function (d) {
                        $scope.clienteEndereco.logradouro = d.data.logradouro;
                        $scope.clienteEndereco.bairro = d.data.bairro;
                        $scope.clienteEndereco.cidade = d.data.localidade;
                        $scope.clienteEndereco.uf = d.data.uf;
                    });
                }
            };

            $scope.insertCliente = function () {
                if (Factory.verificaToken(true) && validaEnvioCliente('#msgClienteCadatro', '')) {
                    $scope.clienteAtual.endereco = $scope.clienteEndereco;
                    $scope.clienteAtual.telefone = $scope.listaTelefone;
                    var envio = {'dados': $scope.clienteAtual, 'token': Factory.getToken()};
                    $rootScope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/insertCliente",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#clienteDialogCadastro');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Cliente cadastrado!', '#msgClienteGeral');
                            //$scope.getListaClienteAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgClienteGeral');
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

            $scope.salvaTelefone = function (idMsg, idComplementar) {
                if (validaFone(idMsg, idComplementar)) {
                    for (var i = $scope.listaTelefone.length; i--; ) {
                        if (i === $scope.telefone.index) {
                            $scope.listaTelefone[i] = $scope.telefone;
                            $scope.novoTelefone();
                        }
                    }
                }
            };


            $scope.addTelefone = function (idMsg, idComplementar) {
                if (validaFone(idMsg, idComplementar)) {
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

            var validaFone = function (idMsg, idComplementar) {
                var retorno = false;
                if ($scope.telefone.numero !== null && $scope.telefone.numero !== undefined && $scope.telefone.numero.trim() !== "") {
                    retorno = true;
                } else {
                    $('#clienteTelefone' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Informar Telefone!', idMsg);
                    return false;
                }

                if ($scope.telefone.tipoTelefone !== null && $scope.telefone.tipoTelefone !== undefined) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'Informar Tipo!', idMsg);
                    return false;
                }
                return retorno;
            };

            var validaListaFone = function (idMsg) {
                $scope.indice = 2;
                var retorno = false;
                if ($scope.listaTelefone !== null && $scope.listaTelefone.length > 0) {
                    retorno = true;
                } else {
                    if ($scope.clienteAtual.id === undefined) {
                        Factory.setMensagemTemporaria('erro', 'Informar Telefone!', idMsg);
                    }
                    return false;
                }
                return retorno;
            };

            var validaEndereco = function (idMsg, idComplementar) {
                $scope.indice = 1;
                var retorno = false;
                if ($scope.clienteEndereco.cep !== undefined && $scope.clienteEndereco.cep !== null && ($scope.clienteEndereco.cep.trim()).length === 8) {
                    retorno = true;
                } else {
                    $('#clienteCep' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Cep Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteEndereco.logradouro !== undefined && $scope.clienteEndereco.logradouro !== null && ($scope.clienteEndereco.logradouro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteLogradouro' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Logradouro Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteEndereco.bairro !== undefined && $scope.clienteEndereco.bairro !== null && ($scope.clienteEndereco.bairro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteBairro' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Bairro Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteEndereco.cidade !== undefined && $scope.clienteEndereco.cidade !== null && ($scope.clienteEndereco.cidade.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteCidade' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Cidade Inválida!', idMsg);
                    return false;
                }
                if ($scope.clienteEndereco.uf !== undefined && $scope.clienteEndereco.uf !== null && ($scope.clienteEndereco.uf.trim()).length === 2) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'UF Inválida!', idMsg);
                    return false;
                }
                if ($scope.clienteEndereco.numero !== undefined && $scope.clienteEndereco.numero !== null && $scope.clienteEndereco.numero > 0) {
                    retorno = true;
                } else {
                    $('#clienteNumero' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Número Inválido!', idMsg);
                    return false;
                }
                return retorno;
            };

            var validaEnvioCliente = function (idMsg, idComplementar) {
                var retorno = false;
                if (validaCliente(idMsg, idComplementar)) {
                    retorno = true;
                } else {
                    $scope.indice = 0;
                    return false;
                }
                if (validaEndereco(idMsg, idComplementar)) {
                    retorno = true;
                } else {
                    $scope.indice = 1;
                    return false;
                }
                if (validaListaFone(idMsg)) {
                    retorno = true;
                } else {
                    $scope.indice = 2;
                    return false;
                }
                return  retorno;
            };

            $scope.avancaCliente = function (i, idMsg, idComplementar) {
                if (i === 0 && validaCliente(idMsg, idComplementar)) {
                    $scope.indice = i + 1;
                } else if (i === 1 && validaEndereco(idMsg, idComplementar)) {
                    $scope.indice = i + 1;
                }
            };

            var validaCliente = function (idMsg, idComplementar) {
                $scope.indice = 0;
                var retorno = false;
                if ($scope.clienteAtual !== null) {

                    if ($scope.clienteAtual.nome !== null && $scope.clienteAtual.nome !== undefined && $scope.clienteAtual.nome.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteNome' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Nome Inválido!', idMsg);
                        return false;
                    }
                    if ($scope.clienteAtual.sobreNome !== null && $scope.clienteAtual.sobreNome !== undefined && $scope.clienteAtual.sobreNome.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteSobreNome' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Sobrenome Inválido!', idMsg);
                        return false;
                    }
                    if ($scope.clienteAtual.dataNascimento !== null && $scope.clienteAtual.dataNascimento !== undefined) {
                        retorno = true;
                    } else {
                        $('#clienteDataNascimento' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Informar Data Nascimento!', idMsg);
                        return false;
                    }

                    if ($scope.clienteAtual.cpf === null || $scope.clienteAtual.cpf === undefined || $scope.clienteAtual.cpf.trim() === "" || ($scope.clienteAtual.cpf !== null && $scope.clienteAtual.cpf !== undefined && $scope.clienteAtual.cpf.trim() !== "" && Utilitario.validaCPF($scope.clienteAtual.cpf))) {
                        retorno = true;
                    } else {
                        $('#clienteCpf' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'CPF é Inválido!', idMsg);
                        return false;
                    }

                    if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email !== undefined && $scope.clienteAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteEmail' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Email Inválido!', idMsg);
                        return false;
                    }
                }
                return retorno;
            };


            var dataDbToJS = function (data) {
                if (data !== undefined && data !== null) {
                    return (new Date(data.substring(0, 4), data.substring(5, 7) - 1, data.substring(8, 10)));
                } else {
                    return "";
                }
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
                $scope.clienteAtual.sexo = $scope.listaSexo[0];
                limparDadosCliente();
                $scope.abrirDialog('#clienteDialogCadastro');
            };

            $scope.preparaCliente = function (cliente) {
                $scope.clienteAtual = Object.assign({}, cliente);
                $scope.clienteAtual.pessoa.dataNascimento = dataDbToJS($scope.clienteAtual.pessoa.dataNascimento);
                limparDadosCliente();
            };
            $scope.fecharDialog = function (idModal) {
                $(idModal).modal('hide');
            };
            $scope.abrirDialog = function (idModal) {
                $(idModal).modal('show');
            };

            $scope.getListaClienteAll(1);

        }]);
})();