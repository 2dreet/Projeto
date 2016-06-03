app.controller("indexControler", function ($scope, UserFactory, $http) {
    $scope.post = function () {
        var obj = {valor: "Aqui"};
        $http({
            method: 'POST',
            crossDomain: true,
            url: 'http://localhost:8081/WsJose/teste',
            headers: {'Content-Type': 'application/json'},
            data: obj
        });
    };
});

