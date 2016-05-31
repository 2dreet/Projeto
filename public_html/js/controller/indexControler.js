app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'home.html'
            })
            .when('/info', {
                templateUrl: 'info.html'
            })
            .otherwise({
                redirectTo: '/'
            });
});

app.controller("indexControler", [ '$scope', 'Pessoa', function($scope, Pessoa){
    $scope.pessoa = new Pessoa();
    $scope.listaPessoa = [];

    $scope.newPessoa = function(){
        $scope.pessoa = new Pessoa();
    }
        
    $scope.addPessoa = function (){
        $scope.listaPessoa.push($scope.pessoa);
        $scope.newPessoa();
    }
    
}]);

