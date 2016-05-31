
app.controller("indexControler", ['$scope', 'Pessoa', function ($scope, Pessoa) {
        $scope.pessoa = new Pessoa();
        $scope.listaPessoa = [];

        $scope.newPessoa = function () {
            $scope.pessoa = new Pessoa();
        }

        $scope.addPessoa = function () {
            if ($scope.pessoa.nome != null && $scope.pessoa.nome.trim() != "") {
                $scope.listaPessoa.push($scope.pessoa);
                $scope.newPessoa();
            }
        }

    }]);

