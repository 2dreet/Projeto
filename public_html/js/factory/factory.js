app.factory('UserFactory', function NoteNgResourceFactory($resource) {
    return $resource("http://localhost:8081/WebJoseWS/texto", {},
            {
                create: {
                    method: 'POST'

                }

            });
});


