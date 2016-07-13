(function () {
    'use strict';

    angular.module('www.geve.com.br').service('BuscaCep', ['$http', function ($http) {
            function getViaCep(cep) {
                $http({
                    method: 'GET',
                    crossDomain: true,
                    url: "https://viacep.com.br/ws/" + cep + "/json/",
                    data: envio,
                    headers: {'Content-Type': 'application/json'}
                }).then(function successCallback(response) {
                    return response.data;
                }, function errorCallback(response) {
                    return false;
                });
            }
        }]);
})();