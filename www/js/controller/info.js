(function () {
    'use strict';
    angular.module('www.geve.com.br').controller("infoControler", ['$scope', '$http', 'Factory', function ($scope, $http, Factory) {
            Factory.verificaToken(true);
            Factory.ajustaMenuLateral('#btnInfor');
        }]);
})();