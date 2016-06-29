angular.module('www.geve.com.br').controller("usuarioControler", function ($scope, $http, $cookies) {

//    $('#menu-lateral ul li').removeClass('active');
    $('#btnUsuario').addClass('active');

    $scope.usuario = {usuario: '', senha: ''};

});