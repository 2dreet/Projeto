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