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

function getMensagem($tipoMenssagem, $texto){
    if($tipoMenssagem === 'erro'){
        return "<div class = 'alert alert-danger' role = 'alert' ><a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a><span class='glyphicon glyphicon-ban-circle' aria-hidden='true'> </span>" + $texto + "</div>";
    } else if($tipoMenssagem === 'info'){
        return "<div class = 'alert alert-info' role = 'alert' ><a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a><span class='glyphicon glyphicon-info-sign' aria-hidden='true'> </span>" + $texto + "</div>";
    } else if($tipoMenssagem === 'sucesso') {
        return "<div class = 'alert alert-success' role = 'alert' ><a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a><span class='glyphicon glyphicon-ok-sign' aria-hidden='true'> </span>" + $texto + "</div>";
    } else if($tipoMenssagem === 'alerta') {
        return "<div class = 'alert alert-warning' role = 'alert' ><a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a><span class='glyphicon glyphicon-warning-sign' aria-hidden='true'> </span>" + $texto + "</div>";
    }
    
}