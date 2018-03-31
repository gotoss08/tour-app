function animatePostsLoading() {
    $('#posts-load-status').empty().append('<i class="fas fa-spinner"></i>').css('color', 'blue').addClass('spinner-rotation');
};

function postsLoaded() {
    $('#posts-load-status').empty().append('<i class="fas fa-check"></i>').css('color', 'green').removeClass('spinner-rotation');
};

$(document).ready(() => {
    $('#header .header-page-control-section').append('<span id="posts-load-status" title="Статус загрузки постов"></span>');
    $('#header .header-page-control-section').append('<a href="/p/new" class="header-link ml-1" title="Новая заметка"><i class="fas fa-pencil-alt"></i></a>');

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
