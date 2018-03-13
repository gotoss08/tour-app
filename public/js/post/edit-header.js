$(document).ready(() => {
    let headerHTML = `
        <button id="post-save-button" class="header-button" title="Сохранить пост"><i class="far fa-save"></i></button>
        <button id="post-publish-button" class="header-button" title="Опубликовать пост"><i class="fas fa-bullhorn"></i></button>
    `;

    tippy('[title]');

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));
    $('#header button').animateCss('bounceIn');
});
