app.factory('Pessoa', function(){
    var Pessoa = function(){
        this.nome = "";
        this.sexo = "";
        this.telefone = "";
        this.email = "";
    }
    return Pessoa;
});