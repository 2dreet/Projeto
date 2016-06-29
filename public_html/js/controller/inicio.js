angular.module('www.geve.com.br').controller("inicioControler", function ($scope, $http) {
    verificaToken(true);
    ajustaMenuLateral('#btnHome');
    
});