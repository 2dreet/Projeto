function getToken($cookies) {
    var token = $cookies.get('www.gerven.com.br.token');
    if (token != null) {
        return token;
    } else {
        return null;
    }
}

function setToken($token, $cookies) {
    var token = $cookies.get('www.gerven.com.br.token');
    if (token == null) {
        $cookies.put('www.gerven.com.br.token', $token);
    } else {
        $cookies.remove('www.gerven.com.br.token');
        $cookies.put('www.gerven.com.br.token', $token);
    }
    return true;
}

function verificaToken($cookies) {
    var token = $cookies.get('www.gerven.com.br.token');
    if (token != null) {
        return true;
    } else {
        $(window.document.location).attr('href', "login.html");
        return false;
    }
}


function verificaLogin($cookies) {
    var token = $cookies.get('www.gerven.com.br.token');
    if (token != null) {
        return true;
    } else {
        return false;
    }
}

function refazerLogin($cookies) {
    $cookies.remove('www.gerven.com.br.token');
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