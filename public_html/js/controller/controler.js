app.controller("inicioControler", function ($scope, $http, $cookies) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnHome').addClass('active');
    
    verificaToken($cookies);
});


app.controller("fornecedorControler", function ($scope, $http, $cookies) {
    verificaToken($cookies);

    $('#menu-lateral ul li').removeClass('active');
    $('#btnFornecedor').addClass('active');

    $scope.fornecedorAtual = {};
    $scope.listaFornecedores = [];
    $scope.valorBusca = {};


    $scope.getListaFornecedorBusca = function () {
        if (verificaToken($cookies)) {
            var valorBusca = $scope.valorBusca.valor;
            if (valorBusca === null || valorBusca.trim() === "") {
                $scope.getListaFornecedorAll();
            } else {
                var envio = {'valor_busca': valorBusca, 'token': getToken($cookies)};
                $http({
                    method: 'POST',
                    crossDomain: true,
                    url: urlWs + "fornecedor/getFornecedor",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    if (!response.data[1].token) {
                        refazerLogin($cookies);
                    } else {
                        $scope.listaFornecedores = response.data[0].dados;
                    }
                }, function errorCallback(response) {
                    alert('Erro no sistema!');
                });
            }
        }
    };

    $scope.getListaFornecedorAll = function () {
        if (verificaToken($cookies)) {
            $http({
                method: 'GET',
                crossDomain: true,
                url: urlWs + "fornecedor/getAllfornecedor/" + getToken($cookies)
            }).then(function successCallback(response) {
                if (!response.data[1].token) {
                    refazerLogin($cookies);
                } else {
                    $scope.listaFornecedores = response.data[0].dados;
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.updateFornecedor = function () {
        if (verificaToken($cookies) && $scope.validaFornecedor()) {
            var envio = {'dados': $scope.fornecedorAtual, 'token': getToken($cookies)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "fornecedor/updateFornecedor",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                $scope.fecharDialog('#cadastroFornecedorDialogAlterar');
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    $scope.getListaFornecedorAll();
                    alert('Salvado com sucesso!');
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.insertFornecedor = function () {
        if (verificaToken($cookies) && $scope.validaFornecedor()) {
            var envio = {'dados': $scope.fornecedorAtual, 'token': getToken($cookies)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "fornecedor/insertFornecedor",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                $scope.fecharDialog('#cadastroFornecedorDialog');
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    $scope.getListaFornecedorAll();
                    alert('Cadastrado com sucesso!');
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.deleteFornecedor = function () {
        if (verificaToken($cookies) && $scope.validaFornecedor()) {
            var envio = {'dados': $scope.fornecedorAtual, 'token': getToken($cookies)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "fornecedor/deleteFornecedor",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                $scope.fecharDialog('#cadastroFornecedorDialogDeletar');
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    $scope.getListaFornecedorAll();
                    alert('Deletador com sucesso!');
                }
            }, function errorCallback(response) {
                alert('Erro no sistema!');
            });
        }
    };

    $scope.validaFornecedor = function () {
        var retorno = false;
        if ($scope.fornecedorAtual != null) {

            if ($scope.fornecedorAtual.descricao != null && $scope.fornecedorAtual.descricao.trim() != "") {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.fornecedorAtual.email != null && $scope.fornecedorAtual.email.trim() != "") {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.fornecedorAtual.telefone != null && $scope.fornecedorAtual.telefone.trim() != "") {
                retorno = true;
            } else {
                retorno = false;
            }
        }
        return retorno;
    };

    $scope.novoFornecedor = function () {
        $scope.fornecedorAtual = {};
    };

    $scope.preparaFornecedor = function (fornecedor) {
        $scope.fornecedorAtual = Object.assign({}, fornecedor);
    };

    $scope.fecharDialog = function (idModal) {
        $(idModal).modal('hide');
    };

    $scope.getListaFornecedorAll();
});


app.controller("produtoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("clienteControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnCliente').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("boletoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnBoleto').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("pedidoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnPedido').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("usuarioControler", function ($scope, $http, $cookies) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.usuario = {usuario: '', senha: ''};

});

app.controller("infoControler", function ($scope, $http) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnInfor').addClass('active');

    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});

app.controller("loginControler", function ($scope, $http, $cookies) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.usuario = {usuario: '', senha: ''};
    $scope.msgErro = null;

    $scope.isMsgErro = function () {
        if ($scope.msgErro !== null) {
            return true;
        } else {
            return false;
        }
    };

    $scope.logar = function () {
        var usuario = $scope.usuario.usuario;
        var senha = $scope.usuario.senha;
        if (usuario !== null && usuario.trim() !== "" && usuario !== null && usuario.trim() !== "") {
            var envio = {'dados': $scope.usuario};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "usuario/logar",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (response.data.msgErro) {
                    $("#msgUsuario").html(getMensagem('erro', response.data.msgErro));
                } else {
                    setToken(response.data.token, $cookies);
                    if (verificaToken($cookies)) {
                        $(window.document.location).attr('href', "index.html");
                    }
                }
            }, function errorCallback(response) {
                alert('Erro Sistema');
            });
        }
    };

    $scope.verifica = function () {
        if (verificaLogin($cookies)) {
            $(window.document.location).attr('href', "index.html");
        }
    };

    $scope.verifica();
});


app.controller("masterPageControler", function ($scope, $http, $cookies) {

    $scope.pessoa = {nome : 'asdasdas'};

    $scope.sair = function () {
        refazerLogin($cookies);
    };

    $scope.verifica = function () {
        if (verificaToken($cookies)) {
            var envio = {'token': getToken($cookies)};
            $http({
                method: 'POST',
                crossDomain: true,
                url: urlWs + "usuario/getUsuario",
                data: envio,
                headers: {'Content-Type': 'application/json'}
            }).then(function successCallback(response) {
                if (!response.data[1].token) {
                    refazerLogin($cookies);
                } else {
                    $scope.pessoa = response.data[0].dados;
                }
            }, function errorCallback(response) {
                alert('Erro Sistema');
            });
        }
    };

    $scope.verifica();

});


