var urlWs = "http://192.168.1.90:8088/WsJosePhp/";
var debug = "?XDEBUG_SESSION_START=netbeans-xdebug";

$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/fornecedor.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/boleto.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/cliente.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/info.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/inicio.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/login.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/master_page.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/pedido.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/produto.js'></script>");
$("head").append("<script language='JavaScript' type='text/javascript' src='js/controller/usuario.js'></script>");

app.controller("produtoControler", function ($scope, $http, $cookies) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $(":file").filestyle({buttonBefore: true, buttonText: "Localizar"});

    $scope.listaFornecedores = [];
    $scope.valorBuscaFornecedor = {valor: ""};


    $scope.produtoAtual = {observacao: ""};
    $scope.listaProduto = [];
    $scope.getImagem = urlWs + "produto/getProdutoImagem/";

    $scope.getImagem = function (idItem) {
        if (verificaToken($cookies)) {
            return urlWs + "produto/getProdutoImagem/" + idItem + "/" + getToken($cookies);
        }
    };

    $scope.getListaProdutoAll = function () {
        if (verificaToken($cookies)) {
            $scope.loadinProduto = $http({
                method: 'GET',
                crossDomain: true,
                url: urlWs + "produto/getAllproduto/" + getToken($cookies) + debug
            }).then(function successCallback(response) {
                if (!response.data.token) {
                    refazerLogin($cookies);
                } else {
                    $scope.listaProduto = response.data.dados;
                }
            }, function errorCallback(response) {
                setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
            });

        }
    };

    $scope.validaImagem = function (mostraMenssagemErro) {
        var campoImagem = $('#cadastroProdutoDialogImagemProduto').prop('files');
        if (campoImagem !== null && $('#cadastroProdutoDialogImagemProduto').eq(0).val() != "") {
            var imagem = campoImagem[0];
            if (imagem !== null) {
                var nomeImagem = imagem.name;
//                var extencao = nomeImagem.substr(nomeImagem.lastIndexOf('.') + 1)
                var extencao = new RegExp("(.*?)\.(jpg|jpeg|png)$");
                if ((extencao.test(nomeImagem))) {
                    if (imagem.size <= 500000) {
                        return true;
                    } else {
                        if (mostraMenssagemErro) {
                            $('#cadastroProdutoDialogImagemProduto').val(null);
                            setMensagemTemporaria('erro', 'Tamanho da imagem permitido é 500bytes', 'msgProduto');
                        } else {
                            return false;
                        }
                    }
                } else {
                    if (mostraMenssagemErro) {
                        $('#cadastroProdutoDialogImagemProduto').val(null);
                        setMensagemTemporaria('erro', 'Apenas imagem no formato jpg, jpeg e png!', 'msgProduto');
                    } else {
                        return false;
                    }
                }
            }
        }
    };

    $scope.insertProduto = function () {
        $scope.message = "";
        if (verificaToken($cookies)) {
            if ($scope.validaProduto()) {
                var fd = new FormData();
                if ($scope.validaImagem(false)) {
                    var campoImagem = $('#cadastroProdutoDialogImagemProduto').prop('files');
                    var imagem = campoImagem[0];
                    fd.append('imagem', imagem);
                }
                fd.append('token', getToken($cookies));
                fd.append('dados', angular.toJson($scope.produtoAtual));
                $http({
                    url: urlWs + 'produto/insertProduto' + debug,
                    method: 'POST',
                    data: fd,
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                }).then(function successCallback(response) {
                    if (!response.data.token) {
                        refazerLogin($cookies);
                    } else {
                        $scope.fecharDialog("#cadastroProdutoDialog");
                        setMensagemTemporaria('sucesso', 'Produto cadastrado!', '#msgProdutoGeral');
                    }
                }, function errorCallback(response) {
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
                });
            }
        }
    };

    $scope.getListaFornecedorBusca = function () {
        if (verificaToken($cookies)) {
            var valorBusca = $scope.valorBuscaFornecedor.valor;
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
                    setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
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
                setMensagemTemporaria('erro', 'Erro de comunicação!', '#msgProdutoGeral');
            });
        }
    };


    $scope.validaProduto = function () {
        var retorno = false;
        if ($scope.produtoAtual != null) {

            if ($scope.produtoAtual.descricao != null && $scope.produtoAtual.descricao.trim() != "") {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.produtoAtual.valor != null && $scope.produtoAtual.valor > 0) {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.produtoAtual.estoque != null && $scope.produtoAtual.valor >= 0) {
                retorno = true;
            } else {
                retorno = false;
            }

            if ($scope.produtoAtual.fornecedor != null) {
                retorno = true;
            } else {
                retorno = false;
                setMensagemTemporaria('erro', 'Deve informar o fornecedor!', '#msgProduto');
            }
        }
        return retorno;
    };

    $scope.novoProduto = function () {
        $scope.produtoAtual = {observacao: ""};
    };

    $scope.preparaProduto = function (produto) {
        $scope.produtoAtual = Object.assign({}, produto);
    };

    $scope.selecionarFornecedor = function (idModal, fornecedor) {
        $scope.produtoAtual.fornecedor = fornecedor;
        $scope.fecharDialog(idModal);
    };

    $scope.fecharDialog = function (idModal) {
        $(idModal).modal('hide');
    };

    $scope.limpaBuscaFornecedor = function () {
        $scope.listaFornecedores = [];
        $scope.valorBuscaFornecedor = {valor: ""};
    };

    $scope.getListaProdutoAll();
});
