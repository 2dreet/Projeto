var urlWs = "http://192.168.1.90:8088/WsJosePhp/";
var urlImagem = urlWs + "produto/getProdutoImagem/";
var cookieNomeToken = "www.geve.com.br.token";

var debug = "?XDEBUG_SESSION_START=netbeans-xdebug";

function ajustaMenuLateral($idComponente) {
    $('#menu-lateral ul li').removeClass('active');
    $($idComponente).addClass('active');
}

function getToken() {
    var token = null;
    var name = cookieNomeToken + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            token = c.substring(name.length, c.length);
        }
    }
    return token;
}

function setToken($token) {
    if (getToken() == null) {
        var d = new Date();
        d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cookieNomeToken + "=" + $token + "; " + expires;
    }
}

function verificaToken($fazerLogin) {
    if (getToken() != null) {
        return true;
    } else {
        if ($fazerLogin) {
            refazerLogin();
        }
        return false;
    }
}

function refazerLogin() {
    document.cookie = cookieNomeToken + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    $(window.document.location).attr('href', "login.html");
}

function setMensagem($tipoMenssagem, $texto, $idComponente) {
    if ($tipoMenssagem === 'erro') {
        var msg = "<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
    } else if ($tipoMenssagem === 'info') {
        var msg = "<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
    } else if ($tipoMenssagem === 'sucesso') {
        var msg = "<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
    } else if ($tipoMenssagem === 'alerta') {
        var msg = "<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
    }
}

function setMensagemTemporaria($tipoMenssagem, $texto, $idComponente) {
    if ($tipoMenssagem === 'erro') {
        var msg = "<div class = 'alert alert-danger' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
        $($idComponente).fadeTo(2000, 500).slideUp(500, function () {
            $($idComponente).alert('close');
        });
    } else if ($tipoMenssagem === 'info') {
        var msg = "<div class = 'alert alert-info' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
        $($idComponente).fadeTo(2000, 500).slideUp(500, function () {
            $($idComponente).alert('close');
        });
    } else if ($tipoMenssagem === 'sucesso') {
        var msg = "<div class = 'alert alert-success' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
        $($idComponente).fadeTo(2000, 500).slideUp(500, function () {
            $($idComponente).alert('close');
        });
    } else if ($tipoMenssagem === 'alerta') {
        var msg = "<div class = 'alert alert-warning' role = 'alert' ><button class='close' data-dismiss='alert' aria-label='close'>&times;</button><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + $texto + "</div>";
        $($idComponente).html(msg);
        $($idComponente).fadeTo(2000, 500).slideUp(500, function () {
            $($idComponente).alert('close');
        });
    }
}