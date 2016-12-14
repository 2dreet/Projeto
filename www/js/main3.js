var app = angular.module('www.geve.com.br', ['ngRoute', 'ui.utils.masks', 'ui.mask', 'cgBusy', 'ui.bootstrap', 'ngMaterial', 'chart.js']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'inicio/inicio.html'
            })
            .when('/fornecedor', {
                templateUrl: 'fornecedor/fornecedor.html'
            })
            .when('/cliente', {
                templateUrl: 'cliente/cliente.html'
            })
            .when('/produto', {
                templateUrl: 'produto/produto.html'
            })
            .when('/pedido', {
                templateUrl: 'pedido/pedido.html'
            })
            .when('/despesas', {
                templateUrl: 'despesas/despesas.html'
            })
            .when('/usuario', {
                templateUrl: 'usuario/usuario.html'
            })
            .when('/info', {
                templateUrl: 'info/info.html'
            })
            .otherwise({
                redirectTo: '/'
            });
});

app.filter('tel', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        if (str.length === 11) {
            str = str.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else {
            str = str.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return str;
    };
});

app.filter('cpf', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        str = str.replace(/(\d{3})(\d)/, '$1.$2');
        str = str.replace(/(\d{3})(\d)/, '$1.$2');
        str = str.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return str;
    };
});

app.filter('cep', function () {
    return function (input) {
        var str = input + '';
        str = str.replace(/\D/g, '');
        str = str.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2-$3');
        return str;
    };
});

app.value('cgBusyDefaults', {
    backdrop: false,
    templateUrl: 'loadin.html',
    delay: 0,
    minDuration: 0
});

app.config(['ChartJsProvider', function (ChartJsProvider) {
        ChartJsProvider.setOptions({
        });
        ChartJsProvider.setOptions('line', {
        });
    }]);

(function () {
    'use strict';
    angular.module('www.geve.com.br').service('BuscaCep', ['$http', function ($http) {
            this.getViaCep = function (cep) {
                return  $http({
                    method: 'GET',
                    crossDomain: true,
                    url: "https://viacep.com.br/ws/" + cep + "/json/"
                }).then(function successCallback(response) {
                    var retorno = {erro: false, data: {}};
                    if (response.erro) {
                        retorno.erro = true;
                    } else {
                        retorno.data = response.data;
                    }
                    return retorno;
                }, function errorCallback(response) {
                    return {erro: true, conection: true};
                });
            };
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Factory', function () {
        this.urlWs = "http://localhost:80/WsJosePhp/";
        this.urlImagem = this.urlWs + "produto/getProdutoImagem/";
        this.cookieNomeToken = "www.geve.com.br.token";
        this.debug = "?XDEBUG_SESSION_START=netbeans-xdebug";

        this.ajustaMenuLateral = function (idComponente) {
            $('#menu-lateral ul li').removeClass('active');
            $(idComponente).addClass('active');
        };

        this.getToken = function () {
            var token = null;
            var name = this.cookieNomeToken + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    token = c.substring(name.length, c.length);
                }
            }
            return token;
        };

        this.setToken = function (token) {
            if (this.getToken() === null) {
                var d = new Date();
                d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toUTCString();
                document.cookie = this.cookieNomeToken + "=" + token + "; " + expires;
            }
        };

        this.verificaToken = function (fazerLogin) {
            if (this.getToken() !== null) {
                return true;
            } else {
                if (fazerLogin) {
                    this.refazerLogin();
                }
                return false;
            }
        };

        this.refazerLogin = function () {
            document.cookie = this.cookieNomeToken + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            $(window.document.location).attr('href', "index.html");
        };

        this.setMensagem = function (tipoMenssagem, texto, idComponente) {
            if (tipoMenssagem === 'erro') {
                $(idComponente).html("<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'info') {
                $(idComponente).html("<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'sucesso') {
                $(idComponente).html("<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'alerta') {
                $(idComponente).html("<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + texto + "</div>");
            }
        };

        this.setMensagemTemporaria = function (tipoMenssagem, texto, idComponente) {
            if (tipoMenssagem === 'erro') {
                $(idComponente).html("<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'info') {
                $(idComponente).html("<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'sucesso') {
                $(idComponente).html("<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'alerta') {
                $(idComponente).html("<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + texto + "</div>");
            }
            $(idComponente).fadeTo(2000, 500).slideUp(500, function () {
                $(idComponente).alert('close');
            });
        };
    });
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Formulario', function () {
        this.getUF = function () {
            return ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PR", "PB", "PA", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SE", "SP", "TO"];
        };
        this.getSexo = function () {
            return ["Masculino", "Feminino"];
        };
        this.getSexoPesquisa = function () {
            return ["Todos", "Masculino", "Feminino"];
        };
        this.getTipoTelefone = function () {
            return [{id: 1, descricao: "Residencial"}, {id: 2, descricao: "Celular"}, {id: 3, descricao: "WhatsApp"}];
        };
        this.getTipoMovimentacao = function () {
            return [{id: 4, descricao: 'Cortesia'}, {id: 5, descricao: 'Correção'}, {id: 1, descricao: 'Entrada'}, {id: 3, descricao: 'Perda'}];
        };
        this.getTipoPedido = function () {
            return [{id: 1, descricao: 'Prontra Entrega'}, {id: 2, descricao: 'Encomenda'}];
        };
        this.getStatusPedido = function () {
            return [{id: 1, descricao: 'Não Pago'}, {id: 2, descricao: 'Pago'}, {id: 3, descricao: 'Pago Parcialmente'}];
        };
        this.getStatusPedidoId = function (id) {
            var listaStatus = [{id: 1, descricao: 'Não Pago'}, {id: 2, descricao: 'Pago'}, {id: 3, descricao: 'Pago Parcialmente'}];
            for (var i = listaStatus.length; i--; ) {
                if (id == listaStatus[i].id) {
                    return listaStatus[i];
                }
            }
        };
        this.getTipoPedidoId = function (id) {
            var listaTipo = [{id: 1, descricao: 'Prontra Entrega'}, {id: 2, descricao: 'Encomenda'}];
            for (var i = listaTipo.length; i--; ) {
                if (id == listaTipo[i].id) {
                    return listaTipo[i];
                }
            }
        };
        this.getFormaPagamentoId = function (id) {
            var listaForma = [{id: 1, descricao: 'Dinheiro'}, {id: 2, descricao: 'Cartão de Débito'}, {id: 3, descricao: 'Cartão de Crédito'}];
            for (var i = listaForma.length; i--; ) {
                if (id == listaForma[i].id) {
                    return listaForma[i];
                }
            }
        };
        this.getFormaPagamento = function () {
            return [{id: 1, descricao: 'Dinheiro'}, {id: 2, descricao: 'Cartão de Débito'}, {id: 3, descricao: 'Cartão de Crédito'}];
        };
    });
})();
$('#btn-menu-lateral').click(function () {
    $('.row-offcanvas').toggleClass('active');
});

$('#menu-lateral ul li').click(function () {
    $('.row-offcanvas').toggleClass('active');
    $('#menu-lateral ul li').removeClass('active');
    $(this).addClass('active');
});
(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Utilitario', function () {
//        this.getViaCep = function (cep) {
//            return  $http({
//                method: 'GET',
//                crossDomain: true,
//                url: "https://viacep.com.br/ws/" + cep + "/json/"
//            }).then(function successCallback(response) {
//                var retorno = {erro: false, data: {}};
//                if (response.erro) {
//                    retorno.erro = true;
//                } else {
//                    retorno.data = response.data;
//                }
//                return retorno;
//            }, function errorCallback(response) {
//                return {erro: true, conection: true};
//            });
//        };

        this.dataDbToJS = function (data) {
            if (data !== undefined && data !== null) {
                return (new Date(data.substring(0, 4), data.substring(5, 7) - 1, data.substring(8, 10)));
            } else {
                return "";
            }
        };

        this.validaCPF = function (strCPF) {
            var Soma;
            var Resto;
            Soma = 0;
            if (strCPF === "00000000000")
                return false;

            for (var i = 1; i <= 9; i++)
                Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto === 10) || (Resto === 11))
                Resto = 0;
            if (Resto !== parseInt(strCPF.substring(9, 10)))
                return false;

            Soma = 0;
            for (i = 1; i <= 10; i++)
                Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto === 10) || (Resto === 11))
                Resto = 0;
            if (Resto !== parseInt(strCPF.substring(10, 11)))
                return false;
            return true;
        };

        this.fecharDialog = function (idComponente) {
            $(idComponente).modal('hide');
        };

        this.abrirDialog = function (idComponente) {
            $(idComponente).modal('show');
        };
    });
})();
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
                            $scope.setModoView();
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgClienteGeral');
                            $scope.limpaFiltro();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterCliente');
                    });
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
                        if ($scope.clienteAtual.listaTelefone[i].index === item.index) {
                            $scope.clienteAtual.listaTelefone.splice(i, 1);
                        }
                    }

                    for (var i = $scope.clienteAtual.listaTelefone.length; i--; ) {
                        if ($scope.clienteAtual.listaTelefone[i].index !== undefined) {
                            $scope.clienteAtual.listaTelefone[i].index = i;
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
                        if ($scope.clienteAtual.listaTelefone[i].id == item.id) {
                            $scope.clienteAtual.listaTelefoneRemovido.push($scope.clienteAtual.listaTelefone[i]);
                            $scope.clienteAtual.listaTelefone.splice(i, 1);
                        }
                    }
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
                                $scope.telefone.id === $scope.clienteAtual.listaTelefone[i].id) ||
                                ($scope.telefone.index !== undefined && $scope.clienteAtual.listaTelefone[i].index !== undefined &&
                                        $scope.clienteAtual.listaTelefone[i].index === $scope.telefone.index)) {
                            $scope.clienteAtual.listaTelefone[i] = $scope.telefone;
                            $scope.novoTelefone();
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
                    $('#clienteCep').focus();
                    Factory.setMensagemTemporaria('erro', 'Cep Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.logradouro !== undefined && $scope.clienteAtual.endereco.logradouro !== null && ($scope.clienteAtual.endereco.logradouro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteLogradouro').focus();
                    Factory.setMensagemTemporaria('erro', 'Logradouro Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.bairro !== undefined && $scope.clienteAtual.endereco.bairro !== null && ($scope.clienteAtual.endereco.bairro.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteBairro').focus();
                    Factory.setMensagemTemporaria('erro', 'Bairro Inválido!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.cidade !== undefined && $scope.clienteAtual.endereco.cidade !== null && ($scope.clienteAtual.endereco.cidade.trim()).length > 0) {
                    retorno = true;
                } else {
                    $('#clienteCidade').focus();
                    Factory.setMensagemTemporaria('erro', 'Cidade Inválida!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.uf !== undefined && $scope.clienteAtual.endereco.uf !== null && ($scope.clienteAtual.endereco.uf.trim()).length === 2) {
                    retorno = true;
                } else {
                    Factory.setMensagemTemporaria('erro', 'UF Inválida!', '#msgManterCliente');
                    return false;
                }
                if ($scope.clienteAtual.endereco.numero !== undefined && $scope.clienteAtual.endereco.numero !== null && $scope.clienteAtual.endereco.numero > 0) {
                    retorno = true;
                } else {
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
                        $('#clienteNome').focus();
                        Factory.setMensagemTemporaria('erro', 'Nome Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.sobreNome !== null && $scope.clienteAtual.pessoa.sobreNome !== undefined && $scope.clienteAtual.pessoa.sobreNome.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#clienteSobreNome').focus();
                        Factory.setMensagemTemporaria('erro', 'Sobrenome Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.pessoa.dataNascimento !== null && $scope.clienteAtual.pessoa.dataNascimento !== undefined) {
                        retorno = true;
                    } else {
                        $('#clienteDataNascimento').focus();
                        Factory.setMensagemTemporaria('erro', 'Informar Data Nascimento!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.cpf === null || $scope.clienteAtual.cpf === undefined || $scope.clienteAtual.cpf.trim() === "" || ($scope.clienteAtual.cpf !== null && $scope.clienteAtual.cpf !== undefined && $scope.clienteAtual.cpf.trim() !== "" && Utilitario.validaCPF($scope.clienteAtual.cpf))) {
                        retorno = true;
                    } else {
                        $('#clienteCpf').focus();
                        Factory.setMensagemTemporaria('erro', 'CPF é Inválido!', '#msgManterCliente');
                        return false;
                    }
                    if ($scope.clienteAtual.email !== null && $scope.clienteAtual.email !== undefined && $scope.clienteAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
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
                if ($scope.clienteAtual.listaTelefone === undefined || $scope.clienteAtual.listaTelefone === null) {
                    $scope.clienteAtual.listaTelefone = [];
                }
                $scope.clienteAtual.pessoa.dataNascimento = dataDbToJS($scope.clienteAtual.pessoa.dataNascimento);
            };

            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.getListaClienteAll(1);
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("despesasController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnDespesas');
            $rootScope.paginaAtual = "Despesas";
            $rootScope.paginaAtualClass = "fa fa-usd botaoComIconeMenuLateral";
            $scope.valorTotal = '0,00';
            $scope.despesaAtual = {};
            $scope.listaDespesas = [];
            $scope.valorBusca = "";
            $scope.buscaAvancada = {};
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 15;
            $scope.data = {opened: true};
            $scope.openData = function () {
                $scope.data.opened = true;
            };
            $scope.dataInicioFiltro = {opened: true};
            $scope.openDataInicioFiltro = function () {
                $scope.dataInicioFiltro.opened = true;
            };
            $scope.dataFimFiltro = {opened: true};
            $scope.openDataFimFiltro = function () {
                $scope.dataFimFiltro.opened = true;
            };
            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novaDespesa();
                }
            };
            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.despesaAtual = {};
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#localizarDespesaDialog");
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#localizarDespesaDialog");
                }
                $scope.currentPage = 1;
                $scope.getListaDespesaAll(1);
            };

            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaDespesaAll(1);
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Despesa";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Despesa";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Despesa";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Despesa";
                }
            };

            $scope.getListaDespesaAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "despesa/getAllDespesa/",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.valorTotal = '0,00';
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaDespesas = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                            $scope.valorTotal = response.data.valorTotal;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgDespesaGeral');
                    });
                }
            };

            $scope.enviarDespesa = function () {
                if (Factory.verificaToken(true) && validaDespesa()) {
                    var envio = {'dados': $scope.despesaAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "despesa/enviarDespesa",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.setModoView();
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgDespesaGeral');
                            $scope.limpaFiltro();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterDespesa');
                    });
                }
            };

            var validaDespesa = function () {
                var retorno = false;
                if ($scope.despesaAtual !== null) {

                    if ($scope.despesaAtual.descricao !== undefined && $scope.despesaAtual.descricao !== null && $scope.despesaAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Descrição!', '#msgManterDespesa');
                        $('#descricao').focus();
                        return false;
                    }

                    if ($scope.despesaAtual.valor !== undefined && $scope.despesaAtual.valor !== null && $scope.despesaAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Valor!', '#msgManterDespesa');
                        $('#valor').focus();
                        return false;
                    }

                    if ($scope.despesaAtual.data_lancamento !== undefined && $scope.despesaAtual.data_lancamento !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Data!', '#msgManterDespesa');
                        $('#data').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novaDespesa = function () {
                $scope.despesaAtual = {};
            };

            $scope.preparaDespesa = function (despesa) {
                $scope.despesaAtual = JSON.parse(JSON.stringify(despesa));
                $scope.despesaAtual.data_lancamento = Utilitario.dataDbToJS($scope.despesaAtual.data_lancamento);
            };

            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.preparaCrud = function (idModal, tipoFuncao) {
                $scope.tipoFuncao = tipoFuncao;
                $(idModal).modal('hide');
            };

            $scope.getListaDespesaAll(1);
        }]);
})();
(function () {
    'use strict';

    angular.module('www.geve.com.br').controller("fornecedorControler", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnFornecedor');
            $rootScope.paginaAtual = "Fornecedores";
            $rootScope.paginaAtualClass = "fa fa-briefcase botaoComIconeMenuLateral";

            $scope.fornecedorAtual = {};
            $scope.listaFornecedores = [];
            $scope.valorBusca = "";
            $scope.buscaAvancada = {descricao: "", email: "", telefone: ""};
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 15;

            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novoFornecedor();
                }
            };
            $scope.setModoView = function () {
                $scope.indice = 0;
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.fornecedorAtual = {};
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#localizarFornecedorDialog");
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#localizarFornecedorDialog");
                }
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll(1);
            };

            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll(1);
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Fornecedor";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Fornecedor";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Fornecedor";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Fornecedor";
                }
            };

            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/getAllfornecedor/",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaFornecedores = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFornecedorGeral');
                    });
                }
            };

            $scope.enviarFornecedor = function () {
                if (Factory.verificaToken(true) && validaFornecedor()) {
                    var envio = {'dados': $scope.fornecedorAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/enviarFornecedor",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.setModoView();
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgFornecedorGeral');
                            $scope.limpaFiltro();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterFornecedor');
                    });
                }
            };

            var validaFornecedor = function () {
                var retorno = false;
                if ($scope.fornecedorAtual !== null) {

                    if ($scope.fornecedorAtual.descricao !== undefined && $scope.fornecedorAtual.descricao !== null && $scope.fornecedorAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Fornecedor!', '#msgManterFornecedor');
                        $('#fornecedor').focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.email !== undefined && $scope.fornecedorAtual.email !== null && $scope.fornecedorAtual.email.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Email!', '#msgManterFornecedor');
                        $('#fornecedorEmail').focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.telefone !== undefined && $scope.fornecedorAtual.telefone !== null && $scope.fornecedorAtual.telefone.trim() !== "" && ($scope.fornecedorAtual.telefone.length === 10 || $scope.fornecedorAtual.telefone.length === 11)) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Telefone!', '#msgManterFornecedor');
                        $('#fornecedorFone').focus();
                        return false;
                    }

                    if ($scope.fornecedorAtual.porcentagem !== undefined && $scope.fornecedorAtual.porcentagem !== null && $scope.fornecedorAtual.porcentagem > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Informar Porcentagem!', '#msgManterFornecedor');
                        $('#porcentagem').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novoFornecedor = function () {
                $scope.fornecedorAtual = {};
            };

            $scope.preparaFornecedor = function (fornecedor) {
                $scope.fornecedorAtual = JSON.parse(JSON.stringify(fornecedor));
            };

            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };

            $scope.preparaCrud = function (idModal, tipoFuncao) {
                $scope.tipoFuncao = tipoFuncao;
                $(idModal).modal('hide');
            };

            $scope.getListaFornecedorAll(1);
        }]);

})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("infoControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnInfor');
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("inicioControler", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', 'FiltroService', function ($rootScope, $scope, $http, Factory, Utilitario, FiltroService) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnHome');
            $rootScope.paginaAtual = "Home";
            $rootScope.paginaAtualClass = "fa fa-home botaoComIconeMenuLateral";
            $scope.valorReceber = '0,00';
            $scope.valorRecebido = '0,00';
            $scope.valorDespesas = '0,00';
            $scope.valorLucro = '0,00';

            $scope.labels = ['Pago', 'Pago Parcial', 'Não Pago'];
            $scope.data = [0,0,0];
            $scope.options = {legend: {display: true}};

            var dataAtual = new Date();
            $scope.busca = {dataInicio: (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)), dataFim: (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0))};
            $scope.dataInicioDialog = {opened: false};
            $scope.dataFimDialog = {opened: false};
            $scope.openDataInicioDialog = function () {
                $scope.dataInicioDialog.opened = true;
            };
            $scope.openDataFimDialog = function () {
                $scope.dataFimDialog.opened = true;
            };
            $scope.getDados = function () {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(), 'dados': $scope.busca};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "inicio/getDados",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.valorReceber = response.data.valorReceber;
                            $scope.valorRecebido = response.data.valorRecebido;
                            $scope.valorDespesas = response.data.valorDespesas;
                            $scope.valorLucro = response.data.lucro;
                            $scope.data = response.data.grafico;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgInicioGeral');
                    });
                }
            };

            $scope.localizarCliente = function (entidade) {
                FiltroService.localizarCliente(entidade);
            };

            $scope.getDados();
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("loginControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            $scope.usuario = {usuario: '', senha: ''};
            $scope.logar = function () {
                var usuario = $scope.usuario.usuario;
                var senha = $scope.usuario.senha;
                if (usuario !== null && usuario.trim() !== "" && usuario !== null && usuario.trim() !== "") {
                    var envio = {'dados': $scope.usuario};
                    $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "usuario/logar",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (response.data.msgErro) {
                            Factory.setMensagemTemporaria('erro', response.data.msgErro, '#msgUsuario');
                        } else {
                            Factory.setToken(response.data.token);
                            $scope.verifica();
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', "Erro de comunicação", '#msgUsuario');
                    });
                }
            };

            $scope.verifica = function () {
                if (Factory.verificaToken(false)) {
                    $(window.document.location).attr('href', "home.html");
                }
            };

            onload = function () {
                document.body.style.visibility = "visible";
            };

            $scope.verifica();
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("masterPageControler", ['$scope', '$http', 'Factory', '$mdSidenav', function ($scope, $http, Factory, $mdSidenav) {
            $scope.pessoa = {nome: ''};
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
//            $scope.open = function () {
//                // Component lookup should always be available since we are not using `ng-if`
//                $mdSidenav('left').open();
//            };
//            $scope.close = function () {
//                // Component lookup should always be available since we are not using `ng-if`
//                $mdSidenav('left').close();
//            };
            $scope.verifica();
            onload = function () {
                document.body.style.visibility = "visible";
            };
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("pedidoControler", ['$rootScope', '$scope', '$http', 'Factory', 'Formulario', 'Utilitario', 'FiltroService', function ($rootScope, $scope, $http, Factory, Formulario, Utilitario, FiltroService) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnPedido');
            $rootScope.paginaAtual = "Pedidos";
            $rootScope.paginaAtualClass = "fa fa-shopping-cart botaoComIconeMenuLateral";
            $scope.valorTotal = '0,00';
            $scope.descontoTotal = '0,00';
            $scope.listaPedido = [];
            $scope.listaEntregue = [{'valor': true, 'descricao': 'Entregue'}, {'valor': false, 'descricao': 'Não Entregue'}];
            $scope.listaStatusPedido = Formulario.getStatusPedido();
            $scope.listaTipoPedido = Formulario.getTipoPedido();
            $scope.listaFormaPagamento = Formulario.getFormaPagamento();
            $scope.listaStatusPedidoFiltro = Formulario.getStatusPedido();
            $scope.listaTipoPedidoFiltro = Formulario.getTipoPedido();
            $scope.listaFormaPagamentoFiltro = Formulario.getFormaPagamento();
            $scope.listaStatusPedidoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaTipoPedidoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaFormaPagamentoFiltro.push({'id': 0, 'descricao': 'Todos'});
            $scope.listaEntregue.push({'valor': 0, 'descricao': 'Todos'});
            $scope.pedidoAtual = {};
            $scope.valorBuscaPedido = "";
            $scope.buscaAvancada = {};
            $scope.dataVencimento = {opened: true};
            $scope.dataVencimentoInicial = {opened: true};
            $scope.dataVencimentoFinal = {opened: true};
            $scope.dataPagamentoInicial = {opened: true};
            $scope.dataPagamentoFinal = {opened: true};
            $scope.opendataVencimento = function () {
                $scope.dataVencimento.opened = true;
            };
            $scope.opendataVencimentoInicial = function () {
                $scope.dataVencimentoInicial.opened = true;
            };
            $scope.opendataVencimentoFinal = function () {
                $scope.dataVencimentoFinal.opened = true;
            };
            $scope.opendataPagamentoInicial = function () {
                $scope.dataPagamentoInicial.opened = true;
            };
            $scope.opendataPagamentoFinal = function () {
                $scope.dataPagamentoFinal.opened = true;
            };
            $scope.dataEntrega = {opened: true};
            $scope.opendataEntrega = function () {
                $scope.dataEntrega.opened = true;
            };
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.tipoFuncao = 0;
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {};
                $scope.valorBusca = "";
                $scope.currentPage = 1;
                $scope.getListaPedidoAll(1);
            };
            $scope.preparaFiltrar = function () {
                $scope.abrir("#pedidoDialogLocalizar");
                if ($scope.buscaAvancada.tipo_pedido === undefined) {
                    $scope.buscaAvancada = {'tipo_pedido': $scope.listaTipoPedidoFiltro[2], 'status_pedido': $scope.listaStatusPedidoFiltro[3], 'forma_pagamento': $scope.listaFormaPagamentoFiltro[3],
                        'entregue': $scope.listaEntregue[2]};
                }
            };
            $scope.filtrar = function (porDescricao) {
                if (porDescricao) {
                    $scope.buscaAvancada = {};
                } else {
                    $scope.valorBusca = "";
                    Utilitario.fecharDialog("#pedidoDialogLocalizar");
                }
                $scope.currentPage = 1;
                $scope.getListaPedidoAll(1);
            };
            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.novoPedido();
                    $scope.tipoFuncao = "inserir";
                }
            };
            $scope.setModoView = function () {
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.pedidoAtual = {};
            };
            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastro de Pedido";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Pedido";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Pedido";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Pedido";
                }
            };
            $scope.getListaPedidoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/getAllPedido",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        $scope.valorTotal = '0,00';
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaPedido = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                            $scope.valorTotal = response.data.valorTotal;
                            $scope.descontoTotal = response.data.descontoTotal;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.getPedido = function (id) {
                if (Factory.verificaToken(true)) {
                    var envio = {'token': Factory.getToken(), 'idPedido': id};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/getPedido",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            var pedido = response.data.pedido;
                            pedido.data_vencimento = Utilitario.dataDbToJS(pedido.data_vencimento);
                            pedido.tipo_pedido = $scope.getTipoPedido(pedido.tipo_pedido);
                            pedido.status = $scope.getStatusPedido(pedido.status);
                            pedido.forma_pagamento = $scope.getFormaPagamentoPedido(pedido.forma_pagamento);
                            $scope.pedidoAtual = pedido;
                            if ($scope.pedidoAtual.listaParcelas === undefined || $scope.pedidoAtual.listaParcelas === null) {
                                $scope.pedidoAtual.listaParcelas = [];
                            }
                            for (var i = $scope.pedidoAtual.listaParcelas.length; i--; ) {
                                $scope.pedidoAtual.listaParcelas[i].data_pagamento = Utilitario.dataDbToJS($scope.pedidoAtual.listaParcelas[i].data_pagamento);
                            }
                            $scope.pedidoAtual.parcelas = $scope.pedidoAtual.listaParcelas.length;
                            var clienteAux = JSON.parse(JSON.stringify($scope.pedidoAtual.cliente));
                            if (clienteAux !== null && clienteAux.id !== undefined) {
                                clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + ' ' + clienteAux.pessoa.sobreNome};
                            }
                            if ($scope.pedidoAtual.cliente === undefined) {
                                $scope.pedidoAtual.cliente = {};
                            }
                            $scope.pedidoAtual.cliente = clienteAux;
                            Utilitario.abrirDialog("#pedidoDialogFuncoes");
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.enviarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'dados': $scope.pedidoAtual, 'token': Factory.getToken(), 'tipoFuncao': $scope.tipoFuncao};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/enviarPedido" + Factory.debug,
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        Utilitario.fecharDialog('#pedidoDialog');
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            if (response.data.EstoqueNegativo !== undefined && response.data.EstoqueNegativo !== null) {
                                var msg = " Produto(s) Com estoque (Futuro) negativo <br />";
                                for (var i = response.data.EstoqueNegativo.length; i--; ) {
                                    msg += " * " + response.data.EstoqueNegativo[i] + " <br />";
                                }
                                Factory.setMensagemTemporaria('alerta', msg, '#msgManterPedido');
                            } else {
                                Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                                $scope.setModoView();
                                $scope.limpaFiltro();
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.pagarParcela = function (parcela) {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'parcela': parcela, 'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/pagarParcela",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgParcelaGeral');
                            for (var i = $scope.pedidoAtual.listaParcelas.length; i--; ) {
                                if (parcela.id === $scope.pedidoAtual.listaParcelas[i].id) {
                                    $scope.pedidoAtual.listaParcelas[i].status = 2;
                                }
                                $scope.getListaPedidoAll($scope.currentPage);
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgParcelaGeral');
                    });
                }
            };
            $scope.pagarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/pagarPedido",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                            $scope.getListaPedidoAll($scope.currentPage);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.entregarPedido = function () {
                if (Factory.verificaToken(true) && validarPedido()) {
                    $scope.pedidoAtual.valor = $scope.getValorPedido();
                    var envio = {'pedidoId': $scope.pedidoAtual.id, 'token': Factory.getToken()};
                    $scope.send = $http({
                        method: 'POST',
                        crossDomain: true,
                        url: Factory.urlWs + "pedido/entregarPedido",
                        data: envio,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgPedidoGeral');
                            $scope.getListaPedidoAll($scope.currentPage);
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgPedidoGeral');
                    });
                }
            };
            $scope.getClientePedido = function () {
                var clientePedido = "";
                if ($scope.pedidoAtual.cliente !== undefined && $scope.pedidoAtual.cliente.pessoa !== undefined) {
                    clientePedido = $scope.pedidoAtual.cliente.pessoa.nome + ' ' + $scope.pedidoAtual.cliente.pessoa.sobreNome;
                }
                return clientePedido;
            };
            $scope.getValorPedido = function () {
                var valorTotal = 0;
                if ($scope.pedidoAtual.listaProduto !== undefined) {
                    for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                        valorTotal = valorTotal + ($scope.pedidoAtual.listaProduto[i].valor * $scope.pedidoAtual.listaProduto[i].quantidade);
                    }
                }
                return valorTotal;
            };
            $scope.novoPedido = function () {
                $scope.pedidoAtual = {tipo_pedido: $scope.listaTipoPedido[0], forma_pagamento: $scope.listaFormaPagamento[0], cliente: null};
            };
            
            $scope.localizarProduto = function () {
                FiltroService.localizarProduto($scope.pedidoAtual);
            };
            $scope.localizarCliente = function (entidade) {
                FiltroService.localizarCliente(entidade);
            };
            
            $scope.removeProduto = function (produto) {
                for (var i = $scope.pedidoAtual.listaProduto.length; i--; ) {
                    if ($scope.pedidoAtual.listaProduto[i] === produto) {
                        $scope.pedidoAtual.listaProduto.splice(i, 1);
                        if ($scope.tipoFuncao === "alterar") {
                            if ($scope.pedidoAtual.listaProdutoRemovido === undefined) {
                                $scope.pedidoAtual.listaProdutoRemovido = [];
                            }
                            $scope.pedidoAtual.listaProdutoRemovido.push(JSON.parse(JSON.stringify(produto)));
                        }
                    }
                }
            };
            var validarPedido = function () {
                if ($scope.pedidoAtual.listaProduto === undefined || $scope.pedidoAtual.listaProduto === null || $scope.pedidoAtual.listaProduto.length <= 0) {
                    Factory.setMensagemTemporaria('erro', 'Adicionar produtos!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.cliente === undefined || $scope.pedidoAtual.cliente === null) {
                    $('#pedidoAtualCliente').focus();
                    Factory.setMensagemTemporaria('erro', 'Selecionar cliente!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.descricao === undefined || $scope.pedidoAtual.descricao === null || $scope.pedidoAtual.descricao.trim() === "") {
                    $('#produtoDescricao').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar descrição!', "#msgManterPedido");
                    return false;
                } else if ($scope.pedidoAtual.data_vencimento === undefined || $scope.pedidoAtual.data_vencimento === null) {
                    $('#pedidoDataVencimento').focus();
                    Factory.setMensagemTemporaria('erro', 'Informar vencimento', "#msgManterPedido");
                    return false;
                }
                return true;
            };
            $scope.fechar = function (idComponente) {
                Utilitario.fecharDialog(idComponente);
            };
            $scope.abrir = function (idComponente) {
                Utilitario.abrirDialog(idComponente);
            };
            $scope.getTipoPedido = function (id) {
                return Formulario.getTipoPedidoId(id);
            };
            $scope.getStatusPedido = function (id) {
                return Formulario.getStatusPedidoId(id);
            };
            $scope.getFormaPagamentoPedido = function (id) {
                return Formulario.getFormaPagamentoId(id);
            };
            $scope.isEntregue = function (entregue) {
                if (entregue == 1) {
                    return " / Entregue";
                } else {
                    return " / Não Entregue";
                }
            };
            $scope.novoPedido();
            $scope.getListaPedidoAll(1);
        }]);
})();

(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("produtoControler", ['$rootScope', '$scope', '$http', 'Formulario', 'Factory', 'Utilitario', 'FiltroService', function ($rootScope, $scope, $http, Formulario, Factory, Utilitario, FiltroService) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnProduto');
            $rootScope.paginaAtual = "Produtos";
            $rootScope.paginaAtualClass = "fa fa-gift botaoComIconeMenuLateral";
            $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});
            var dataAtual = new Date();
            $scope.dataInicialMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
            $scope.dataFinalMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
            $scope.dataInicial = {opened: true};
            $scope.dataFinal = {opened: true};
            $scope.estoqueFuturo = 0;
            $scope.produtoAtual = {observacao: ""};
            $scope.listaProduto = [];
            $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
            $scope.entidadeSelecionada = {};
            $scope.valorBuscaProduto = "";
            $scope.listaTipoMovimentacaoCorrecao = Formulario.getTipoMovimentacao();
            $scope.listaProdutoMovimentacao = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.totalItemsMovimentacao = 0;
            $scope.currentPageMovimentacao = 1;
            $scope.modoManter = false;
            $scope.modoView = true;
            $scope.openDataInicial = function () {
                $scope.dataInicial.opened = true;
                $scope.dateOptionsInicial.maxDate = $scope.dataFinalMovimento;
            };

            $scope.openDataFinal = function () {
                $scope.dataFinal.opened = true;
                $scope.dateOptionsFinal.minDate = $scope.dataInicialMovimento;
            };

            $scope.dateOptionsInicial = {
                maxDate: $scope.dataFinalMovimento,
                startingDay: 1
            };

            $scope.dateOptionsFinal = {
                minDate: $scope.dataInicialMovimento,
                startingDay: 1
            };

            $scope.limpaFiltroAvancado = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBuscaProduto = "";
                $scope.getListaProdutoAll(1);
            };

            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.getListaProdutoAll(1);
            };

            $scope.filtrarAvancado = function () {
                $scope.valorBuscaProduto = "";
                $scope.getListaProdutoAll(1);
                $scope.fechar('#localizarProdutoDialog');
            };
            
            $scope.limpaFiltro = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBuscaProduto = "";
                $scope.currentPage = 1;
                $scope.getListaProdutoAll(1);
            };

            $scope.setModoManter = function (isNovo) {
                $scope.modoManter = true;
                $scope.modoView = false;
                if (isNovo) {
                    $scope.tipoFuncao = "inserir";
                    $scope.novoProduto();
                }
            };

            $scope.setModoView = function () {
                $scope.modoManter = false;
                $scope.modoView = true;
                $scope.produtoAtual = {observacao: ""};
            };

            $scope.getTituloCrud = function () {
                if ($scope.tipoFuncao === "inserir") {
                    return  "Cadastrar Produto";
                } else if ($scope.tipoFuncao === "alterar") {
                    return  "Alterar Produto";
                } else if ($scope.tipoFuncao === "deletar") {
                    return  "Deletar Produto";
                } else if ($scope.tipoFuncao === "vizualizar") {
                    return  "Vizualizar Produto";
                }
            };

            $scope.getListaProdutoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBuscaProduto};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "produto/getAllproduto",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaProduto = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                }
            };

            $scope.getListaMovimentacao = function (pagina) {
                if (Factory.verificaToken(true) && ($scope.dataInicialMovimento !== null && $scope.dataFinalMovimento !== null)) {
                    var envio = {'id': $scope.produtoAtual.id, 'pagina': (pagina - 1), 'token': Factory.getToken(), 'data_inicial': $scope.dataInicialMovimento, 'data_final': $scope.dataFinalMovimento};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "produto/getMovimentacaoProduto",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaProdutoMovimentacao = response.data.dados;
                            $scope.totalItemsMovimentacao = response.data.totalRegistro;
                            if (response.data.estoque >= 0) {
                                $scope.produtoAtual.estoque = response.data.estoque;
                            }
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                    });
                } else if (($scope.dataInicialMovimento === null || $scope.dataFinalMovimento === null)) {
                    $scope.totalItemsMovimentacao = 0;
                }
            };

            $scope.getImagem = function (idItem) {
                if (Factory.verificaToken(true) && idItem > 0) {
                    var random = (new Date()).toString();
                    return Factory.urlImagem + idItem + "/" + Factory.getToken() + "?cb=" + random;
                }
            };

            $scope.validaImagem = function (mostraMenssagemErro, idCampoImagem, idCampoMsg) {
                var campoImagem = $(idCampoImagem).prop('files');
                if (campoImagem !== null && $(idCampoImagem).eq(0).val() !== "") {
                    var imagem = campoImagem[0];
                    if (imagem !== null) {
                        var nomeImagem = imagem.name;
                        var extencao = new RegExp("(.*?)\.(jpg|jpeg|png)$");
                        if ((extencao.test(nomeImagem))) {
                            if (imagem.size <= 500000) {
                                return true;
                            } else {
                                $(idCampoImagem).val(null);
                                if (mostraMenssagemErro) {
                                    Factory.setMensagemTemporaria('erro', 'Tamanho da imagem permitido é 500bytes', idCampoMsg);
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            $(idCampoImagem).val(null);
                            if (mostraMenssagemErro) {
                                Factory.setMensagemTemporaria('erro', 'Apenas imagem no formato jpg, jpeg e png!', idCampoMsg);
                            } else {
                                return false;
                            }
                        }
                    }
                }
            };

            $scope.mostrarImagem = function (idCampoImagem, idCampoMsg, idCampoDestino) {
                if ($scope.validaImagem(true, idCampoImagem, idCampoMsg)) {
                    var campoImagem = $(idCampoImagem).prop('files');
                    var imagem = campoImagem[0];
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $(idCampoDestino).attr('src', e.target.result);
                    };
                    reader.readAsDataURL(imagem);
                }
            };

            $scope.enviarProduto = function () {
                if (Factory.verificaToken(true)) {
                    if (validaProduto()) {
                        var fd = new FormData();
                        if ($scope.validaImagem(false, '#produtoImagemCadastro', '#msgProduto')) {
                            var campoImagem = $('#produtoImagemCadastro').prop('files');
                            var imagem = campoImagem[0];
                            fd.append('imagem', imagem);
                        }
                        fd.append('token', Factory.getToken());
                        fd.append('tipoFuncao', $scope.tipoFuncao);
                        fd.append('dados', angular.toJson($scope.produtoAtual));
                        $scope.send = $http({
                            url: Factory.urlWs + 'produto/enviarProduto' + Factory.debug,
                            method: 'POST',
                            data: fd,
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else {
                                $scope.setModoView();
                                Factory.setMensagemTemporaria('sucesso', response.data.msgRetorno, '#msgProdutoGeral');
                                $scope.limpaFiltro();
                            }
                        }, function errorCallback(response) {
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgManterProduto');
                        });
                    }
                }
            };

            $scope.movimentarProdutoCorrecao = function () {
                $scope.message = "";
                if (Factory.verificaToken(true)) {
                    if (validaCorrecao()) {
                        var produto = {id: $scope.produtoAtual.id, estoque: $scope.produtoAtual.estoque, tipoMovimentacao: $scope.produtoAtual.tipoMovimentacao.id, estoque_movimento_observacao: $scope.produtoAtual.estoque_movimento_observacao, estoque_movimento: $scope.produtoAtual.estoque_movimento};
                        var envio = {'dados': produto, 'token': Factory.getToken()};
                        $scope.send = $http({
                            method: 'POST',
                            crossDomain: true,
                            url: Factory.urlWs + "produto/movimentarProduto",
                            data: envio,
                            headers: {'Content-Type': 'application/json'}
                        }).then(function successCallback(response) {
                            if (!response.data.token) {
                                Factory.refazerLogin();
                            } else if (response.data.sucesso) {
                                $scope.preparaProdutoMovimentacao(false);
                                $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                                $scope.abrir("#produtoDialogMovimentacao");
                                Factory.setMensagemTemporaria('sucesso', 'Estoque Movimentado!', '#msgCorrecaoView');
                                $scope.produtoAtual.estoque = response.data.estoque;
                                $scope.getListaProdutoAll(1);
                            } else {
                                $scope.getListaProdutoAll(1);
                                Factory.setMensagemTemporaria('erro', response.data.menssagem, '#msgCorrecao');
                                if (response.data.estoque >= 0) {
                                    $scope.produtoAtual.estoque = response.data.estoque;
                                }
                            }
                        }, function errorCallback(response) {
                            $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                            Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                        });
                    }
                }
            };

            $scope.fecharCorrecaoMovimentacao = function () {
                $scope.preparaProdutoMovimentacao(false);
                $scope.fechar("#produtoDialogMovimentacaoCorrecao");
                $scope.abrir("#produtoDialogMovimentacao");
            };

            var validaCorrecao = function () {
                var retorno = false;
                if ($scope.produtoAtual !== null) {
                    if ($scope.produtoAtual.estoque_movimento !== null && $scope.produtoAtual.estoque_movimento > 0) {
                        retorno = true;
                    } else {
                        $('#quantidadeCorrecao').focus();
                        Factory.setMensagemTemporaria('erro', 'Deve informar Quantidade!', '#msgCorrecao');
                        return false;
                    }

                    if ($scope.produtoAtual.estoque_movimento_observacao !== null && $scope.produtoAtual.estoque_movimento_observacao.trim() !== "") {
                        retorno = true;
                    } else {
                        $('#observacaoCorrecao').focus();
                        Factory.setMensagemTemporaria('erro', 'Deve informar observação!', '#msgCorrecao');
                        return false;
                    }

                    if ($scope.produtoAtual.tipoMovimentacao !== null && $scope.produtoAtual.tipoMovimentacao.id !== undefined) {
                        if ($scope.produtoAtual.tipoMovimentacao.id > 1 && $scope.produtoAtual.tipoMovimentacao.id < 5) {
                            var valorFinal = $scope.produtoAtual.estoque - $scope.produtoAtual.estoque_movimento;
                            if (valorFinal >= 0) {
                                retorno = true;
                            } else {
                                Factory.setMensagemTemporaria('erro', 'Valor final não deve ser negativo!', '#msgCorrecao');
                                return false;
                            }
                        } else {
                            retorno = true;
                        }
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar tipo movimentação!', '#msgCorrecao');
                        return false;
                    }
                }
                return retorno;
            };

            var validaProduto = function () {
                var retorno = false;
                if ($scope.produtoAtual !== null) {
                    if ($scope.produtoAtual.descricao !== undefined && $scope.produtoAtual.descricao !== null && $scope.produtoAtual.descricao.trim() !== "") {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar descrição!', '#msgManterProduto');
                        $('#produtoDescricao').focus();
                        return false;
                    }
                    if ($scope.produtoAtual.valor !== undefined && $scope.produtoAtual.valor !== null && $scope.produtoAtual.valor > 0) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar valor!', '#msgManterProduto');
                        $('#produtoValor').focus();
                        return false;
                    }
                    if ($scope.produtoAtual.fornecedor !== undefined && $scope.produtoAtual.fornecedor !== null) {
                        retorno = true;
                    } else {
                        Factory.setMensagemTemporaria('erro', 'Deve informar o fornecedor!', '#msgManterProduto');
                        $('#produtoFornecedor').focus();
                        return false;
                    }
                }
                return retorno;
            };

            $scope.novoProduto = function () {
                $scope.produtoAtual = {observacao: ""};
                $(":file").val(null);
                $(":file").filestyle('clear');
                $("#produtoImagemCadastroView").removeAttr('src');
            };

            $scope.preparaProduto = function (produto) {
                $scope.produtoAtual = JSON.parse(JSON.stringify(produto));
                $(":file").val(null);
                $(":file").filestyle('clear');
                $("#produtoImagemCadastroView").attr("src", $scope.getImagem($scope.produtoAtual.id));
                $scope.abrir('#produtoDialogFuncoes');
            };

            $scope.preparaProdutoMovimentacao = function (prepraView) {
                $scope.dataInicialMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
                $scope.dataFinalMovimento = (new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
                $scope.listaProdutoMovimentacao = [];
                $scope.totalItemsMovimentacao = 0;
                $scope.getListaMovimentacao(1);
                $scope.produtoAtual.tipoMovimentacao = $scope.listaTipoMovimentacaoCorrecao[0];
                $scope.produtoAtual.estoque_movimento_observacao = "";
                $scope.produtoAtual.estoque_movimento = "";
                if (prepraView) {
                    $scope.preparaProdutoView('#produtoDialogFuncoes', '#produtoDialogMovimentacao');
                }
            };

            $scope.localizarFornecedor = function (entidade) {
                FiltroService.localizarFornecedor(entidade);
            };

            $scope.preparaProdutoView = function (idModalPai, idModalFilho) {
                if (idModalPai !== null) {
                    $scope.fechar(idModalPai);
                }
                if (idModalFilho !== null) {
                    $scope.abrir(idModalFilho);
                }
            };


            $scope.abrir = function (idModal) {
                Utilitario.abrirDialog(idModal);
            };

            $scope.fechar = function (idModal) {
                Utilitario.fecharDialog(idModal);
            };

            $scope.getListaProdutoAll(1);

            $scope.corLinha = function (tipoMovimentacao) {
                var cor = {color: 'black'};
                if (tipoMovimentacao == 1) {
                    cor.color = '#0066CC';
                } else if (tipoMovimentacao == 2) {
                    cor.color = '#6eaf48';
                } else if (tipoMovimentacao == 3) {
                    cor.color = '#FF3333';
                } else if (tipoMovimentacao == 4) {
                    cor.color = '#FF9933';
                } else if (tipoMovimentacao == 5) {
                    cor.color = '#404040';
                }
                return cor;
            };
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("usuarioControler", ['$rootScope', '$scope', '$http', 'Factory', function ($rootScope, $scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnUsuario');
            $rootScope.paginaAtual = "Usuário";
            $rootScope.paginaAtualClass = "fa fa-cog botaoComIconeMenuLateral";
            $scope.usuario = {usuario: '', senha: ''};
        }]);
})();

(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroClienteController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.valorBusca = "";
            $scope.listaCliente = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.getListaClienteAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
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
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltrarCliente');
                    });
                }
            };

            $scope.selecionarCliente = function (cliente) {
                $rootScope.clienteSelecionado = JSON.parse(JSON.stringify(cliente));
                $scope.fechar();
            };

            $scope.fechar = function () {
                $(".clienteModalFiltro").modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaCliente = [];
                $scope.currentPage = 1;
                $scope.buscaAvancada = {};
            }

            $scope.filtrar = function () {
                $scope.listaCliente = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaClienteAll($scope.currentPage);
            };

            $rootScope.inicioGlobalClienteModalFiltro = function () {
                $('.clienteModalFiltro').off();
                $('.clienteModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.clienteModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaClienteAll(1);
                });
            };

        }]);
})();

(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("filtroFornecedorController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', function ($rootScope, $scope, $http, Factory, Utilitario) {
            $scope.valorBusca = "";
            $scope.listaFornecedor = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;

            $scope.getListaFornecedorAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaDescricao': $scope.valorBusca, 'limit': $scope.itensPorPagina};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "fornecedor/getAllFornecedor",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaFornecedor = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltrarFornecedor');
                    });
                }
            };

            $scope.selecionarFornecedor = function (fornecedor) {
                $rootScope.fornecedorSelecionado = JSON.parse(JSON.stringify(fornecedor));
                $(".fornecedorModalFiltro").modal('hide');
            };

            $scope.fechar = function () {
                $(".fornecedorModalFiltro").modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaFornecedor = [];
                $scope.currentPage = 1;
            }
            
            $scope.filtrar = function () {
                $scope.listaFornecedor = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaFornecedorAll($scope.currentPage);
            };

            $rootScope.inicioGlobalFornecedorModalFiltro = function () {
                $('.fornecedorModalFiltro').off();
                $('.fornecedorModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.fornecedorModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaFornecedorAll(1);
                });
            };
        }]);
})();

(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("produtoFiltroController", ['$rootScope', '$scope', '$http', 'Factory', 'Utilitario', 'FiltroService', function ($rootScope, $scope, $http, Factory, Utilitario, FiltroService) {
            $scope.buscaAvancada = {};
            $scope.valorBusca = "";
            $scope.listaProduto = [];
            $scope.maxSize = 3;
            $scope.totalItems = 0;
            $scope.currentPage = 1;
            $scope.itensPorPagina = 10;
            $scope.tipoFuncao = 0;
            $scope.getImagem = function (idItem) {
                if (Factory.verificaToken(true) && idItem > 0) {
                    var random = (new Date()).toString();
                    return Factory.urlImagem + idItem + "/" + Factory.getToken() + "?cb=" + random;
                }
            };
            $scope.limpaFiltroAvancado = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.valorBusca = "";
            };
            $scope.filtroPorDescricao = function () {
                $scope.buscaAvancada = {descricao: "", fornecedor: "", estoquePositivo: ""};
                $scope.getListaProdutoAll(1);
            };
            $scope.filtrarAvancado = function () {
                $scope.valorBusca = "";
                $scope.getListaProdutoAll(1);
                Utilitario.fecharDialog('#filtroProdutoAvancado');
            };

            $scope.localizarFornecedor = function () {
                FiltroService.localizarFornecedor($scope.buscaAvancada);
            };

            $scope.getListaProdutoAll = function (pagina) {
                if (Factory.verificaToken(true)) {
                    var envio = {'pagina': (pagina - 1), 'token': Factory.getToken(), 'buscaAvancada': $scope.buscaAvancada, 'buscaDescricao': $scope.valorBusca};
                    $rootScope.loading = $http({
                        method: 'POST',
                        data: envio,
                        crossDomain: true,
                        url: Factory.urlWs + "produto/getAllproduto",
                        headers: {'Content-Type': 'application/json'}
                    }).then(function successCallback(response) {
                        if (!response.data.token) {
                            Factory.refazerLogin();
                        } else {
                            $scope.listaProduto = response.data.dados;
                            $scope.totalItems = response.data.totalRegistro;
                        }
                    }, function errorCallback(response) {
                        Factory.setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgFiltroProduto');
                    });
                }
            };

            $scope.selecionarProduto = function (produto) {
                $rootScope.produtoSelecionado = JSON.parse(JSON.stringify(produto));
                $(".produtoModalFiltro").modal('hide');
            };

            $scope.fechar = function (idComponente) {
                $(".produtoModalFiltro").modal('hide');
            };

            $scope.fecharDialog = function (idComponente) {
                $(idComponente).modal('hide');
            };

            function zeraBusca() {
                $scope.valorBusca = "";
                $scope.listaProduto = [];
                $scope.currentPage = 1;
                $scope.buscaAvancada = {};
            }

            $scope.filtrar = function () {
                $scope.listaProduto = [];
                $scope.totalItems = 0;
                $scope.currentPage = 1;
                $scope.getListaProdutoAll($scope.currentPage);
            };

            $rootScope.inicioGlobalProdutoModalFiltro = function () {
                $('.produtoModalFiltro').off();
                $('.produtoModalFiltro').on('shown.bs.modal', function (event) {
                    $('input:text:visible:first', this).focus();
                });
                $('.produtoModalFiltro').on('show.bs.modal', function (event) {
                    zeraBusca();
                    $scope.getListaProdutoAll(1);
                });
            };
        }]);
})();
(function () {
    'use strict';
    angular.module('www.geve.com.br').service('FiltroService', function ($rootScope) {

        this.localizarFornecedor = function (objeto) {
            $rootScope.inicioGlobalFornecedorModalFiltro();
            $(".fornecedorModalFiltro").modal('show');
            $('.fornecedorModalFiltro').on('hide.bs.modal', function (event) {
                if (objeto === undefined || objeto === null) {
                    objeto = {'fornecedor': null};
                } else if (objeto.fornecedor === undefined) {
                    objeto.fornecedor = null;
                }

                if ($rootScope.fornecedorSelecionado !== undefined && $rootScope.fornecedorSelecionado !== null && $rootScope.fornecedorSelecionado.id !== undefined) {
                    var fornecedorAux = JSON.parse(JSON.stringify($rootScope.fornecedorSelecionado));
                    fornecedorAux = {id: fornecedorAux.id, descricao: fornecedorAux.descricao};
                    objeto.fornecedor = fornecedorAux;
                }
                $rootScope.fornecedorSelecionado = null;
                $('.fornecedorModalFiltro').off('hide.bs.modal');
            });
        };

        this.localizarProduto = function (objeto) {
            $rootScope.inicioGlobalProdutoModalFiltro();
            $(".produtoModalFiltro").modal('show');
            $('.produtoModalFiltro').on('hide.bs.modal', function (event) {
                if ($rootScope.produtoSelecionado !== undefined) {
                    if (objeto.listaProduto === undefined) {
                        objeto.listaProduto = [];
                    }
                    var encontrou = false;
                    for (var i = objeto.listaProduto.length; i--; ) {
                        if ($rootScope.produtoSelecionado.id !== undefined && objeto.listaProduto[i].id !== undefined &&
                                $rootScope.produtoSelecionado.id === objeto.listaProduto[i].id) {
                            objeto.listaProduto[i].quantidade++;
                            encontrou = true;
                            $rootScope.produtoSelecionado = {};
                        }
                    }
                    if (encontrou === false) {
                        var produtoAux = JSON.parse(JSON.stringify($rootScope.produtoSelecionado));
                        produtoAux = {id: produtoAux.id, descricao: produtoAux.descricao, valor: produtoAux.valor};
                        $rootScope.produtoSelecionado = {};
                        if (produtoAux.id !== undefined) {
                            produtoAux.quantidade = 1;
                            objeto.listaProduto.push(produtoAux);
                        }
                    }
                }
                $('.produtoModalFiltro').off('hide.bs.modal');
            });
        };

        this.localizarCliente = function (objeto) {
            $rootScope.inicioGlobalClienteModalFiltro();
            $(".clienteModalFiltro").modal('show');
            $('.clienteModalFiltro').on('hide.bs.modal', function (event) {
                if (objeto === undefined || objeto === null) {
                    objeto = {'cliente': null};
                } else if (objeto.cliente === undefined) {
                    objeto.cliente = null;
                }

                if ($rootScope.clienteSelecionado !== undefined && $rootScope.clienteSelecionado !== null && $rootScope.clienteSelecionado.id !== undefined) {
                    var clienteAux = JSON.parse(JSON.stringify($rootScope.clienteSelecionado));
                    clienteAux = {id: clienteAux.id, nome: clienteAux.pessoa.nome + " " + clienteAux.pessoa.sobreNome};
                    objeto.cliente = clienteAux;
                }
                $rootScope.fornecedorSelecionado = null;
                $('.clienteModalFiltro').off('hide.bs.modal');
            });
        };

    });
})();

