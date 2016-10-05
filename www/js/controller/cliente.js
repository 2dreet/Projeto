(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("clienteControler", ['$rootScope', '$scope', '$http', 'BuscaCep', 'Formulario', 'Utilitario', 'Factory',
        function ($rootScope, $scope, $http, BuscaCep, Formulario, Utilitario, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnCliente');
            $rootScope.paginaAtual = "Clientes";
            $rootScope.paginaAtualClass = "fa fa-users botaoComIconeMenuLateral";
            $scope.clienteAtual = {};
            $scope.listaCliente = [];
            $scope.valorBuscaCliente = "";
            $scope.listaSexo = Formulario.getSexo();
            $scope.listaSexoBusca = Formulario.getSexoPesquisa();
            $scope.buscaAvancada = {sexo: $scope.listaSexoBusca[0]};
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
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novoCliente();
                }
            };
            $scope.setModoView = function () {
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.clienteAtual = {};
            };
            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Cliente";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Cliente";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Cliente";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Cliente";
                }
            };
            $scope.limparFiltroAvancado = function () {
                $scope.buscaAvancada = {sexo: $scope.listaSexoBusca[0]};
            };

            $scope.filtrarAvancado = function () {
                $scope.fechar('#clienteDialogLocalizar');
                $scope.getListaClienteAll(1);
            };
            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaClienteAll(1);
            };

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
                    $scope.loadingLocal = BuscaCep.getViaCep($scope.clienteAtual.endereco.cep).then(function (d) {
                        $scope.clienteAtual.endereco.logradouro = d.data.logradouro;
                        $scope.clienteAtual.endereco.bairro = d.data.bairro;
                        $scope.clienteAtual.endereco.cidade = d.data.localidade;
                        $scope.clienteAtual.endereco.uf = d.data.uf;
                    });
                }
            };

            $scope.getCepFiltro = function () {
                if ($scope.buscaAvancada.cep !== undefined && $scope.buscaAvancada.cep !== null && $scope.buscaAvancada.cep.trim().length === 8) {
                    $scope.loadingLocal = BuscaCep.getViaCep($scope.buscaAvancada.cep).then(function (d) {
                        $scope.buscaAvancada.logradouro = d.data.logradouro;
                        $scope.buscaAvancada.bairro = d.data.bairro;
                        $scope.buscaAvancada.cidade = d.data.localidade;
                        $scope.buscaAvancada.uf = d.data.uf;
                    });
                }
            };

            $scope.enviarCliente = function () {
                if (Factory.verificaToken(true) && validaEnvioCliente()) {
                    var envio = {'dados': $scope.clienteAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "cliente/enviarCliente",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            if ($scope.tipoFuncao === "inserir" || $scope.tipoFuncao === "alterar") {
                                $scope.listaCliente = [];
                                $scope.listaCliente.push($scope.clienteAtual);
                                $scope.totalItems = 1;
                            } else {
                                if ($scope.tipoFuncao === "deletar") {
                                    $scope.limpaFiltro();
                                }
                            }
                            $scope.setModoView();
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgClienteGeral');
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterCliente');
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

            $scope.salvaTelefone = function () {
                if (validaFone()) {
                    for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                        if (($scope.telefone.id !== undefined && $scope.clienteAtual.listaTelefone[i].id !== undefined &&
                                $scope.telefone.id === $scope.clienteAtual.listaTelefone[i].id) || i === $scope.telefone.index) {
                            $scope.clienteAtual.listaTelefone[i] = $scope.telefone;
                            $scope.novoTelefone();
                        }
                    }
                }
            };

            $scope.addTelefone = function () {
                if (validaFone()) {
                    if ($scope.clienteAtual.listaTelefone === undefined) {
                        $scope.clienteAtual.listaTelefone = [];
                    }
                    var telefoneAux = JSON.parse(JSON.stringify($scope.telefone));
                    telefoneAux.index = $scope.clienteAtual.listaTelefone.length;
                    $scope.clienteAtual.listaTelefone.push(telefoneAux);
                    $scope.novoTelefone();
                }
            };

            $scope.removeTelefone = function (item) {
                if (item.id !== undefined) {
                    $scope.removeTelefoneEditando(item);
                } else {
                    for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                        if ($scope.clienteAtual.listaTelefone[i] === item) {
                            $scope.clienteAtual.listaTelefone.splice(i, 1);
                        }
                    }
                }
            };

            $scope.removeTelefoneEditando = function (item) {
                if ($scope.clienteAtual.listaTelefoneRemovido === undefined) {
                    $scope.clienteAtual.listaTelefoneRemovido = [];
                }
                for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                    if ($scope.clienteAtual.listaTelefone[i].id !== undefined) {
                        if ($scope.clienteAtual.listaTelefone[i].id === item.id) {
                            $scope.clienteAtual.listaTelefoneRemovido.push($scope.clienteAtual.listaTelefone[i]);
                        }
                    }
                }
            };

            var validaFone = function () {
                var retorno = false;
                if ($scope.telefone.numero !== null && $scope.telefone.numero !== undefined && $scope.telefone.numero.trim() !== "" && ($scope.telefone.numero.length === 10 || $scope.telefone.numero.length === 11)) {
                    retorno = true;
                } else {
                    $('#clienteTelefone').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar Telefone!', '#msgManterCliente');
                    return false;
                }

                if ($scope.telefone.tipoTelefone !== null && $scope.telefone.tipoTelefone !== undefined) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'Informar Tipo!', '#msgManterCliente');
                    return false;
                }
                return retorno;
            };

            var validaListaFone = function () {
                var retorno = false;
                if ($scope.clienteAtual.listaTelefone !== null && $scope.clienteAtual.listaTelefone.length > 0) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabTelefone', '#tabTelefoneTitle');
                    Factory.setMensagemTemporaria('erro', 'Informar Telefone!', '#msgManterCliente');
                    return false;
                }
                return retorno;
            };

            var validaEndereco = function () {
                var retorno = false;
                if ($scope.clienteAtual.endereco.cep !== undefined && $scope.clienteAtual.endereco.cep !== null && ($scope.clienteAtual.endereco.cep.trim()).length === 8) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    $('#clienteCep').focus();
                    Factory.setMensagemTemporaria('erro', 'Cep Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.logradouro !== undefined && $scope.clienteAtual.endereco.logradouro !== null && ($scope.clienteAtual.endereco.logradouro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    $('#clienteLogradouro').focus();
                    Factory.setMensagemTemporaria('erro', 'Logradouro Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.bairro !== undefined && $scope.clienteAtual.endereco.bairro !== null && ($scope.clienteAtual.endereco.bairro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    $('#clienteBairro').focus();
                    Factory.setMensagemTemporaria('erro', 'Bairro Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.cidade !== undefined && $scope.clienteAtual.endereco.cidade !== null && ($scope.clienteAtual.endereco.cidade.trim()).length > 0) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    $('#clienteCidade').focus();
                    Factory.setMensagemTemporaria('erro', 'Cidade Inválida!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.uf !== undefined && $scope.clienteAtual.endereco.uf !== null && ($scope.clienteAtual.endereco.uf.trim()).length === 2) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    Factory.setMensagemTemporaria('erro', 'UF Inválida!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.numero !== undefined && $scope.clienteAtual.endereco.numero !== null && $scope.clienteAtual.endereco.numero > 0) {
                    retorno = true;
                } else {
                    $scope.mudaTab('#tabEndereco', '#tabEnderecoTitle');
                    $('#clienteNumero').focus();
                    Factory.setMensagemTemporaria('erro', 'Número Inválido!', '#msgManterCliente');
                    return false;
                }
                return retorno;
            };

            var validaEnvioCliente = function () {
                var retorno = false;
                if (validaCliente()) {
                    retorno = true;
                } else {
                    return false;
                }
                if (validaEndereco()) {
                    retorno = true;
                } else {
                    return false;
                }
                if (validaListaFone()) {
                    retorno = true;
                } else {
                    return false;
                }
                return  retorno;
            };

            var validaCliente = function () {
                var retorno = false;
                if ($scope.clienteAtual !== null) {
                    if ($scope.clienteAtual.pessoa.nome !== null && $scope.clienteAtual.pessoa.nome !== undefined && $scope.clienteAtual.pessoa.nome.trim() !== "") {
                        retorno = true;
                    } else {
                        $scope.mudaTab('#tabDadosDoCliente', '#tabDadosDoClienteTitle');
                        $('#clienteNome').focus();
                        Factory.setMensagemTemporaria('erro', 'Nome Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.sobreNome !== null && $scope.clienteAtual.pessoa.sobreNome !== undefined && $scope.clienteAtual.pessoa.sobreNome.trim() !== "") {
                        retorno = true;
                    } else {
                        $scope.mudaTab('#tabDadosDoCliente', '#tabDadosDoClienteTitle');
                        $('#clienteSobreNome').focus();
                        Factory.setMensagemTemporaria('erro', 'Sobrenome Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.dataNascimento !== null && $scope.clienteAtual.pessoa.dataNascimento !== undefined) {
                        retorno = true;
                    } else {
                        $scope.mudaTab('#tabDadosDoCliente', '#tabDadosDoClienteTitle');
                        $('#clienteDataNascimento').focus();
                        Factory.setMensagemTemporaria('erro', 'Informar Data Nascimento!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.cpf === null || $scope.clienteAtual.cpf === undefined || $scope.clienteAtual.cpf.trim() === "" || ($scope.clienteAtual.cpf !== null && $scope.clienteAtual.cpf !== undefined && $scope.clienteAtual.cpf.trim() !== "" && Utilitario.validaCPF($scope.clienteAtual.cpf))) {
                        retorno = true;
                    } else {
                        $scope.mudaTab('#tabDadosDoCliente', '#tabDadosDoClienteTitle');
                        $('#clienteCpf').focus();
                        Factory.setMensagemTemporaria('erro', 'CPF é Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email !== undefined && $scope.clienteAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        $scope.mudaTab('#tabDadosDoCliente', '#tabDadosDoClienteTitle');
                        $('#clienteEmail').focus();
                        Factory.setMensagemTemporaria('erro', 'Email Inválido!', '#msgManterCliente');
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
            };

            $scope.novoCliente = function () {
                limparDadosCliente();
            };

            $scope.preparaCliente = function (varAux) {
                limparDadosCliente();
                $scope.clienteAtual = JSON.parse(JSON.stringify(varAux));
                $scope.clienteAtual.pessoa.dataNascimento = dataDbToJS($scope.clienteAtual.pessoa.dataNascimento);
            };

            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.getListaClienteAll(1);

            $scope.mudaTab = function (tab, title) {
                $('#TabClienteCrud div').removeClass('active');
                $(tab).addClass('active');
                $('#TabClienteCrudTitle li').removeClass('active');
                $(title).addClass('active');
            };

        }]);
})();