(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("clienteControler", ['$rootScope', '$scope', '$http', 'BuscaCep', 'Formulario', 'Utilitario', 'Factory',
        function ($rootScope, $scope, $http, BuscaCep, Formulario, Utilitario, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnCliente');

            $scope.clienteAtual = {};
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
                        url: Factory.urlWs + "cliente/getAllCliente",
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
                if ($scope.clienteAtual.endereco.cep !== undefined && $scope.clienteAtual.endereco.cep !== null && $scope.clienteAtual.endereco.cep.trim().length === 8) {
                    BuscaCep.getViaCep($scope.clienteAtual.endereco.cep).then(function (d) {
                        $scope.clienteAtual.endereco.logradouro = d.data.logradouro;
                        $scope.clienteAtual.endereco.bairro = d.data.bairro;
                        $scope.clienteAtual.endereco.cidade = d.data.localidade;
                        $scope.clienteAtual.endereco.uf = d.data.uf;
                    });
                }
            };

            $scope.insertCliente = function () {
                if (Factory.verificaToken(true) && validaEnvioCliente('#msgClienteCadatro', '')) {
                    var envio = {'dados': $scope.clienteAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
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
                            $scope.getListaClienteAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgClienteGeral');
                    });
                }
            };

            $scope.updateCliente = function () {
                if (Factory.verificaToken(true) && validaEnvioCliente('#msgClienteAlterar', 'Alterar')) {
                    var envio = {'dados': $scope.clienteAtual, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/updateCliente",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#clienteDialogAlterar');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Cliente Alterado!', '#msgClienteGeral');
                            $scope.getListaClienteAll(1);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgClienteGeral');
                    });
                }
            };

            $scope.deleteCliente = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'dados': $scope.clienteAtual.pessoa, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/deleteCliente",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.fecharDialog('#clienteDialogDeletar');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', 'Cliente Deletado!', '#msgClienteGeral');
                            $scope.getListaClienteAll(1);
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
                $scope.telefone = JSON.parse(JSON.stringify(telefone));
            };

            $scope.salvaTelefone = function (idMsg, idComplementar) {
                if (validaFone(idMsg, idComplementar)) {
                    for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                        if (($scope.telefone.id !== undefined && $scope.clienteAtual.listaTelefone[i].id !== undefined &&
                                $scope.telefone.id === $scope.clienteAtual.listaTelefone[i].id) || i === $scope.telefone.index) {

                            $scope.clienteAtual.listaTelefone[i] = $scope.telefone;
                            $scope.novoTelefone();
                        }
                    }
                }
            };


            $scope.addTelefone = function (idMsg, idComplementar) {
                if (validaFone(idMsg, idComplementar)) {
                    var telefoneAux = JSON.parse(JSON.stringify($scope.telefone));
                    telefoneAux.index = $scope.clienteAtual.listaTelefone.length;
                    $scope.clienteAtual.listaTelefone.push(telefoneAux);
                    $scope.novoTelefone();
                }
            };

            $scope.removeTelefone = function (item) {
                for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                    if ($scope.clienteAtual.listaTelefone[i] === item) {
                        $scope.clienteAtual.listaTelefone.splice(i, 1);
                    }
                }
            };

            $scope.removeTelefoneEditando = function (item) {
                if ($scope.clienteAtual.listaTelefoneRemovido === undefined) {
                    $scope.clienteAtual.listaTelefoneRemovido = [];
                }
                for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                    if ($scope.clienteAtual.listaTelefone[i] === item) {
                        if ($scope.clienteAtual.listaTelefone[i].id !== undefined) {
                            $scope.clienteAtual.listaTelefoneRemovido.push($scope.clienteAtual.listaTelefone[i]);
                        }
                        $scope.clienteAtual.listaTelefone.splice(i, 1);
                    }
                }
            };

            var validaFone = function (idMsg, idComplementar) {
                var retorno = false;
                if ($scope.telefone.numero !== null && $scope.telefone.numero !== undefined && $scope.telefone.numero.trim() !== "" && ($scope.telefone.numero.length === 10 || $scope.telefone.numero.length === 11)) {
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
                if ($scope.clienteAtual.listaTelefone !== null && $scope.clienteAtual.listaTelefone.length > 0) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'Informar Telefone!', idMsg);
                    return false;
                }
                return retorno;
            };

            var validaEndereco = function (idMsg, idComplementar) {
                $scope.indice = 1;
                var retorno = false;
                if ($scope.clienteAtual.endereco.cep !== undefined && $scope.clienteAtual.endereco.cep !== null && ($scope.clienteAtual.endereco.cep.trim()).length === 8) {
                    retorno = true;
                } else {
                    $('#clienteCep' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Cep Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteAtual.endereco.logradouro !== undefined && $scope.clienteAtual.endereco.logradouro !== null && ($scope.clienteAtual.endereco.logradouro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteLogradouro' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Logradouro Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteAtual.endereco.bairro !== undefined && $scope.clienteAtual.endereco.bairro !== null && ($scope.clienteAtual.endereco.bairro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteBairro' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Bairro Inválido!', idMsg);
                    return false;
                }
                if ($scope.clienteAtual.endereco.cidade !== undefined && $scope.clienteAtual.endereco.cidade !== null && ($scope.clienteAtual.endereco.cidade.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteCidade' + idComplementar).focus();
                    Factory.setMensagemTemporaria('erro', 'Cidade Inválida!', idMsg);
                    return false;
                }
                if ($scope.clienteAtual.endereco.uf !== undefined && $scope.clienteAtual.endereco.uf !== null && ($scope.clienteAtual.endereco.uf.trim()).length === 2) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'UF Inválida!', idMsg);
                    return false;
                }
                if ($scope.clienteAtual.endereco.numero !== undefined && $scope.clienteAtual.endereco.numero !== null && $scope.clienteAtual.endereco.numero > 0) {
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

                    if ($scope.clienteAtual.pessoa.nome !== null && $scope.clienteAtual.pessoa.nome !== undefined && $scope.clienteAtual.pessoa.nome.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteNome' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Nome Inválido!', idMsg);
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.sobreNome !== null && $scope.clienteAtual.pessoa.sobreNome !== undefined && $scope.clienteAtual.pessoa.sobreNome.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteSobreNome' + idComplementar).focus();
                        Factory.setMensagemTemporaria('erro', 'Sobrenome Inválido!', idMsg);
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.dataNascimento !== null && $scope.clienteAtual.pessoa.dataNascimento !== undefined) {
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
                $scope.clienteAtual = {pessoa: {sexo: $scope.listaSexo[0]}, endereco: {uf: "AC"}, listaTelefone: [], listaTelefoneRemovido: []};
                $scope.indice = 0;
            };

            $scope.novoCliente = function () {
                limparDadosCliente();
                $scope.abrirDialog('#clienteDialogCadastro');
            };

            $scope.preparaCliente = function (varAux) {
                limparDadosCliente();
                $scope.clienteAtual = JSON.parse(JSON.stringify(varAux));
                $scope.clienteAtual.pessoa.dataNascimento = dataDbToJS($scope.clienteAtual.pessoa.dataNascimento);
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