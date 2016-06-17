app.controller("produtoControler", function ($scope, $http) {

    $('#menu-lateral ul li').removeClass('active');
    $('#btnProduto').addClass('active');

    $scope.listaProduto = [{id:1},{id:1},{id:1},{id:1},{id:1},{id:1}];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://192.168.1.90:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: $scope.produto
        }).then(function successCallback(response) {
            $scope.listaProduto.push(response.data);
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };
});