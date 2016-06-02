app.controller("indexControler", function ($scope, UserFactory) {
    $scope.post = function () {
        UserFactory.get();
    };
        
});

