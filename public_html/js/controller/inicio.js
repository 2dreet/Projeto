(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("inicioControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnHome');

        }]);
})();