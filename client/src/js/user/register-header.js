function animateRegisterLoading() {
    $('#avatar-load-status').empty().append('<i class="fas fa-spinner"></i>').css('color', 'blue').addClass('spinner-rotation');
};

function animateRegisterLoaded() {
    $('#avatar-load-status').empty().append('<i class="fas fa-check"></i>').css('color', 'green').removeClass('spinner-rotation');
};

$(document).ready(() => {
    $('#header .header-page-control-section').append('<span id="avatar-load-status" title="Загрузка аватарки"></span>');

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
