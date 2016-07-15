(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Formulario', function () {

        this.getUF = function () {
            return ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PR", "PB", "PA", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SE", "SP", "TO"];
        };
        
        this.getSexo = function () {
            return ["Masculino", "Feminino"];
        };
        
        this.getTipoTelefone = function () {
            return [{id: 1, descricao: "Residencial"}, {id: 2, descricao: "Celular"}, {id: 3, descricao: "WhatsApp"}];
        };
        
        this.getTipoMovimentacao = function () {
            return [{id: 4, descricao: 'Cortesia'},{id: 5, descricao: 'Correção'},{id: 1, descricao: 'Entrada'},{id: 3, descricao: 'Perda'}];
        };
        
    });
})();