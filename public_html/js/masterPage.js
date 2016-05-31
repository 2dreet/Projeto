$('#nav-lateral').on('show.bs.collapse', function () {
    if ($('#navbar-top').attr("aria-expanded")) {
        $('#navbar-top').collapse('hide');
    }
});

$('#navbar-top').on('show.bs.collapse', function () {
    if ($('#nav-lateral').attr("aria-expanded")) {
        $('#nav-lateral').collapse('hide');
    }
});

