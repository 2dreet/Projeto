$('#btn-menu-lateral').click(function () {
    $('.row-offcanvas').toggleClass('active');
});

$('#menu-lateral ul li').click(function () {
    $('.row-offcanvas').toggleClass('active');
    $('#menu-lateral ul li').removeClass('active');
    $(this).addClass('active');
});