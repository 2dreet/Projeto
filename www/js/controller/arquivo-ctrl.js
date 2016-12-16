//'use strict';
//
//angular.module('www.daidellein.com.br')
//        .controller("arquivoCtrl", ['$rootScope', '$scope', '$http', '$routeParams', 'factoryService', 'formularioService', 'utilitarioService', 'filtroService', 'uploadService', 'httpPostService',
//            function ($rootScope, $scope, $http, $routeParams, factoryService, formularioService, utilitarioService, filtroService, uploadService, httpPostService) {
//
//                $rootScope.cgBusyMessage = undefined;
//                $rootScope.paginaAtual = "Repositório de Arquivos";
//                $scope.tituloDialog;
//                $rootScope.paginaAtualClass = "fa fa-file-archive-o botaoComIconeMenuLateral";
//                utilitarioService.ajustaMenuLateral('#btnAssociados');
//
//                $scope.selecionado = {};
//                $scope.listaArquivo = [];
//                $scope.tipoFuncao = null;
//                $scope.modoManter = false;
//                $scope.modoView = true;
//                $scope.maxSize = 3;
//                $scope.totalItems = 0;
//                $scope.currentPage = 1;
//                $scope.itensPorPagina = 15;
//                $scope.valorBusca = "";
//                $scope.nomeLabel = "";
//                $scope.nome = "";
//                $scope.contrato = "";
//
//                $scope.getLista = function (pagina) {
//                    if (factoryService.verificaToken(true)) {
//                        var envio = {'pagina': (pagina - 1), 'token': factoryService.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca,
//                            'limit': $scope.itensPorPagina, 'orderBy': $scope.orderBy, 'orderByTipo': $scope.orderByTipo};
//                        $rootScope.loading = $http({
//                            method: 'POST',
//                            crossDomain: true,
//                            url: factoryService.urlWs + "arquivo/getLista" + factoryService.debug,
//                            data: envio,
//                            headers: {'Content-Type': 'application/json'}
//                        }).then(function successCallback(response) {
//                            if (!response.data.token) {
//                                factoryService.refazerLogin();
//                            } else {
//                                $scope.listaArquivo = response.data.dados;
//                                $scope.totalItems = response.data.totalRegistro;
//                                $scope.nome = response.data.nome;
//                                $scope.contrato = response.data.contrato;
//                            }
//                        }, function errorCallback(response) {
//                            utilitarioService.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgGeral');
//                        });
//                    }
//                };
//
//                $scope.ordenar = function (order) {
//                    if ($scope.orderBy === order) {
//                        if ($scope.orderByTipo === "ASC") {
//                            $scope.orderByTipo = "DESC";
//                        } else {
//                            $scope.orderByTipo = "ASC";
//                        }
//                    } else {
//                        $scope.orderByTipo = "ASC";
//                    }
//                    $scope.orderBy = order;
//                    $scope.getLista($scope.currentPage);
//                };
//
//                $scope.deletar = function () {
//                    $scope.fechar('#deletarArquivoDialog')
//                    if (factoryService.verificaToken(true)) {
//                        var envio = {'dados': $scope.selecionado, 'token': factoryService.getToken()};
//                        $rootScope.loading = $http({
//                            method: 'POST',
//                            crossDomain: true,
//                            url: factoryService.urlWs + "arquivo/deletarArquivo"+factoryService.debug,
//                            data: envio,
//                            headers: {'Content-Type': 'application/json'}
//                        }).then(function successCallback(response) {
//                            if (!response.data.token) {
//                                factoryService.refazerLogin();
//                            } else {
//                                $scope.currentPage = 1;
//                                $scope.getLista($scope.currentPage);
//                                utilitarioService.setMensagem('sucesso', response.data.msg, '#msgGeral');
//                            }
//                        }, function errorCallback(response) {
//                            utilitarioService.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgGeral');
////                            console.log(response.);
//                        });
//                    }
//                };
//
//                $scope.localizarPorEnter = function (event) {
//                    if (event.which === 13) {
//                        $scope.filtrar();
//                    }
//                };
//
//                $scope.filtrar = function () {
//                    $scope.buscaAvancada = {};
//                    $scope.currentPage = 1;
//                    $scope.getLista($scope.currentPage);
//                };
//
//                $scope.limpaFiltro = function () {
//                    $scope.buscaAvancada = {};
//                    $scope.valorBusca = "";
//                    $scope.currentPage = 1;
//                    $scope.getLista($scope.currentPage);
//                };
//
//                $scope.deletarArquivo = function (arquivoNome, arquivoID, descricao) {
//                    $scope.selecionado = {nome: arquivoNome, arquivoID: arquivoID, descricao: descricao};
//                    $scope.abrir('#deletarArquivoDialog');
//                };
//
//                $scope.baixarArquivo = function (arquivoNome, descricao) {
//                    httpPostService.redirect(factoryService.urlWs + "arquivo/baixarArquivo", {'descricao': descricao, 'arquivoNome': arquivoNome, 'token': factoryService.getToken()});
//                };
//
//                $scope.preparaSelecionarArquivo = function () {
//                    document.getElementById('selectedFile').value = null;
//                    document.getElementById('selectedFile').click();
//                };
//
//                $scope.voltarTabAssociado = function () {
//                    window.location = "#/associado";
//                };
//
//                $scope.getIcone = function (extencao) {
//                    return utilitarioService.getIconeArquivo(extencao);
//                };
//
//                $scope.uploadFile = function (element) {
//                    var file = element.files[0];
//                    var fileSize = 0;
//                    if (file != undefined) {
//                        fileSize = JSON.parse(JSON.stringify(file.size));
//                        if (fileSize <= 20971520) {
//                            var fd = new FormData();
//                            fd.append('file', file);
//                            fd.append('id', $routeParams.id);
//                            fd.append('token', factoryService.getToken());
//                            $rootScope.loading = $http({
//                                method: 'POST',
//                                crossDomain: true,
//                                url: factoryService.urlWs + 'arquivo/upload',
//                                data: fd,
//                                headers: {'Content-Type': undefined}
//                            }).then(function successCallback(response) {
//                                if (response.data.valido) {
//                                    utilitarioService.setMensagemTemporaria('info', response.data.msg, '#msgGeral');
//                                    $scope.currentPage = 1;
//                                    $scope.getLista($scope.currentPage);
//                                } else {
//                                    utilitarioService.setMensagemTemporaria('erro', response.data.msg, '#msgGeral');
//                                }
//                            }, function errorCallback(response) {
//                                utilitarioService.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgGeral');
//                            });
//                        } else {
//                            utilitarioService.setMensagemTemporaria('erro', "Tamanho do arquivo maior que o limite, Selecionar um arquivo até 20 Megabyte ", '#msgGeral');
//                        }
//                    } else {
//                        utilitarioService.setMensagemTemporaria('erro', "Selecionar o arquivo", '#msgGeral');
//                    }
//                };
//
//                var getContatoByAssociadoOrEmpresaByID = function () {
//                    if ($routeParams.id !== undefined && $routeParams.id !== null && $routeParams.tipoId !== undefined && $routeParams.tipoId !== null) {
//                        if ($routeParams.tipoId === 'associado') {
//                            $scope.nomeLabel = "Associado";
//                            $scope.buscaAvancada = {'associado': {'id': $routeParams.id}};
//                        } else if ($routeParams.tipoId === 'empresa') {
//                            $scope.nomeLabel = "Empresa";
//                            $scope.buscaAvancada = {'empresa': {'id': $routeParams.id}};
//                        }
//                        $scope.currentPage = 1;
//                        $scope.getLista($scope.currentPage);
//                    } else {
//                        $scope.voltarTabAssociado();
//                    }
//                };
//
//                getContatoByAssociadoOrEmpresaByID();
//            }]);      