angular.module('www.geve.com.br').service('httpPostService', [function () {

            this.redirect = function (url, obj) {

                var mapForm = document.createElement("form");
                mapForm.target = "_blank";
                mapForm.method = "POST";
                mapForm.action = url;
                var mapInput = document.createElement("input");

                mapInput.type = "text";
                mapInput.name = "json";
                mapInput.value = JSON.stringify(obj);

                mapForm.appendChild(mapInput);
                document.body.appendChild(mapForm);
                mapForm.submit();

            }
        }]);