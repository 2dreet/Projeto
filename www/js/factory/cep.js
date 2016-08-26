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