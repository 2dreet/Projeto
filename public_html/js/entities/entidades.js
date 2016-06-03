app.factory('Pessoa', function(){
    var Pessoa = function(){
        this.nome = "";
        this.sexo = "";
        this.telefone = "";
        this.email = "";
    }
    return Pessoa;
});

app.factory('Produto', function(){
    var Produto = function(){
        this.codigo = "";
        this.descricao = "";
        this.valor = "";
    }
    return Produto;
});