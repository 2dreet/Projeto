app.controller("inicioControler", function ($scope, $http, $cookies) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnHome').addClass('active');

    verificaToken($cookies);
});