app.factory('UserFactory', function ($resource) {
    return $resource("http://localhost:8081/WebJoseWS/texto", {},
            {
                create: {
                    method: 'POST'

                }

            });
});


