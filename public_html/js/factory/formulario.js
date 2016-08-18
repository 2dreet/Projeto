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
        this.getStatusPedidoId = function (id) {
            var listaStatus = [{id: 1, descricao: 'Não Pago'}, {id: 2, descricao: 'Pago'}, {id: 3, descricao: 'Pago e Entregue'},
            {id: 4, descricao: 'Pago Parcialmente'}, {id: 5, descricao: 'Pago Parcialmente e Entregue'}];
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