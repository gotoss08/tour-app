$(document).ready(() => {
    let headerHTML = `
        <button id="post-save-button" class="header-button" title="Сохранить черновик заметки."><i class="far fa-save"></i></button>
        <button id="post-publish-button" class="header-button" title="Опубликовать заметку."><i class="fas fa-bullhorn"></i></button>
    `;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
