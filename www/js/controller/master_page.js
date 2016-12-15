(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("masterPageControler", ['$scope', '$http', 'Factory', '$mdSidenav', 'Utilitario', function ($scope, $http, Factory, $mdSidenav, Utilitario) {
            $scope.pessoa = {nome: ''};
            $scope.pessoaEnvio = {};
            $scope.sair = function () {
                Factory.refazerLogin();
            };
            $scope.verifica = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(true)};
                    $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "usuario/getUsuario",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data[1].token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.pessoa = response.data[0].dados;
                        }
                    }, function errorCallback(response) {
                        alert('Erro Sistema');
                    });
                }
            };

            $scope.enviarNovaSenha = function () {
                if (Factory.verificaToken(true)) {
                    var senhaEnvio = JSON.parse(JSON.stringify($scope.pessoaEnvio));
                    var envio = {'token': Factory.getToken(true), 'dados': senhaEnvio};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "usuario/trocaSenha",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            if (response.data.msgErro !== undefined) {
                                Factory.setMensagemTemporaria('erro', response.data.msgErro, '#msgUsuarioTrocaSenha');
                                if (response.data.focus !== undefined) {
                                    $(response.data.focus).focus();
                                }
                            } else {
                                $scope.fechar("#alterarSenhaDialog");
                                Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgGlobalGeral');
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', "Erro de comunicação", '#msgUsuarioTrocaSenha');
                    });
                }
            };

            $scope.iniciarTrocaSenha = function () {
                $scope.pessoaEnvio = {};
                $scope.abrir("#alterarSenhaDialog");
            };

            $scope.confirmarEnvio = function () {
                var retorno = true;
                var focus = null;
                if ($scope.pessoaEnvio.senha_atual === undefined || $scope.pessoaEnvio.senha_atual === null || $scope.pessoaEnvio.senha_atual.trim() === '') {
                    retorno = false;
                    focus = '#senha_atual';
                    $('#senha_atual').popover('show');
                }
                if ($scope.pessoaEnvio.nova_senha === undefined || $scope.pessoaEnvio.nova_senha === null || $scope.pessoaEnvio.nova_senha.trim() === '') {
                    retorno = false;
                    if (focus === null) {
                        focus = '#nova_senha';
                    }
                    $('#nova_senha').popover('show');
                }
                if ($scope.pessoaEnvio.confirma_nova_senha === undefined || $scope.pessoaEnvio.confirma_nova_senha === null || $scope.pessoaEnvio.confirma_nova_senha.trim() === '') {
                    retorno = false;
                    if (focus === null) {
                        focus = '#confirma_nova_senha';
                    }
                    $('#confirma_nova_senha').popover('show');
                }

                if (focus != null) {
                    $(focus).focus();
                }

                if (retorno === true) {
                    $scope.enviarNovaSenha();
                }
            };
            $scope.esconderPopover = function (campo) {
                $(campo).popover('hide');
            };
            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.verifica();
            onload = function () {
                document.body.style.visibility = "visible";
            };
        }]);
})();