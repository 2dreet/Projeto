(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Formulario', function () {
        
        this.getUF = function () {
            return ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PR","PB","PA","PE","PI","RJ","RN","RS","RO","RR","SC","SE","SP","TO"];
        };
    });
})();