function animatePostsLoading() {
    $('#posts-load-status').empty().append('<i class="fas fa-spinner"></i>').css('color', 'blue').addClass('spinner-rotation');
};

function postsLoaded() {
    $('#posts-load-status').empty().append('<i class="fas fa-check"></i>').css('color', 'green').removeClass('spinner-rotation');
};

$(document).ready(() => {
    let headerHTML = `<span id="posts-load-status" title="Статус загрузки постов"></span>`;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
