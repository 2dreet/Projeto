app.controller("indexControler", function ($scope, UserFactory, $http, Produto) {
    $scope.produto = new Produto();
    $scope.listaProduto = [];
    $scope.post = function () {
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://localhost:8081/WsJose/teste',
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

