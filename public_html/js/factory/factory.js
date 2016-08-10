(function () {
    'use strict';
    angular.module('www.geve.com.br').service('Factory', function () {
        this.urlWs = "http://localhost:8088/WsJosePhp/";
        this.urlImagem = this.urlWs + "produto/getProdutoImagem/";
        this.cookieNomeToken = "www.geve.com.br.token";
        this.debug = "?XDEBUG_SESSION_START=netbeans-xdebug";

        this.ajustaMenuLateral = function (idComponente) {
            $('#menu-lateral ul li').removeClass('active');
            $(idComponente).addClass('active');
        };

        this.getToken = function () {
            var token = null;
            var name = this.cookieNomeToken + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    token = c.substring(name.length, c.length);
                }
            }
            return token;
        };

        this.setToken = function (token) {
            if (this.getToken() === null) {
                var d = new Date();
                d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toUTCString();
                document.cookie = this.cookieNomeToken + "=" + token + "; " + expires;
            }
        };

        this.verificaToken = function (fazerLogin) {
            if (this.getToken() !== null) {
                return true;
            } else {
                if (fazerLogin) {
                    this.refazerLogin();
                }
                return false;
            }
        };

        this.refazerLogin = function () {
            document.cookie = this.cookieNomeToken + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            $(window.document.location).attr('href', "login.html");
        };

        this.setMensagem = function (tipoMenssagem, texto, idComponente) {
            if (tipoMenssagem === 'erro') {
                $(idComponente).html("<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'info') {
                $(idComponente).html("<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'sucesso') {
                $(idComponente).html("<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'alerta') {
                $(idComponente).html("<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + texto + "</div>");
            }
        };

        this.setMensagemTemporaria = function (tipoMenssagem, texto, idComponente) {
            if (tipoMenssagem === 'erro') {
                $(idComponente).html("<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'info') {
                $(idComponente).html("<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'sucesso') {
                $(idComponente).html("<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + texto + "</div>");
            } else if (tipoMenssagem === 'alerta') {
                $(idComponente).html("<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + texto + "</div>");
            }
            $(idComponente).fadeTo(2000, 500).slideUp(500, function () {
                $(idComponente).alert('close');
            });
        };
    });
})();