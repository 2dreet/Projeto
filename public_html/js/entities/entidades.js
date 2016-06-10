app.factory('Pessoa', function () {
    var Pessoa = function () {
        this.id = "";
        this.nome = "";
        this.sobre_nome = "";
        this.sexo = "";
        this.data_cadastro = "";
        this.data_nascimento = "";
        this.ativo = "";
    };
    return Pessoa;
});

app.factory('Fornecedor', function (Usuario) {
    var Fornecedor = function () {
        this.id = "";
        this.descricao = "";
        this.email = "";
        this.telefone = "";
        this.usuario = new Usuario();
        this.ativo = "";
    };
    return Fornecedor;
});


app.factory('Usuario', function (Pessoa) {
    var Usuario = function () {
        this.id = "";
        this.usuario = "";
        this.senha = "";
        this.pessoa = new Pessoa();
    };
    return Usuario;
});

app.factory('Produto', function (Pessoa) {
    var Produto = function () {
        this.id = "";
        this.usuario = "";
        this.senha = "";
    };
    return Produto;
});


