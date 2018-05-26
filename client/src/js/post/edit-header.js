$(document).ready(() => {
    let headerHTML = `
        <button id="post-save-button" class="header-button" title="Сохранить заметку"><i class="far fa-save"></i></button>
        <button id="post-publish-button" class="header-button" title="Опубликовать заметку"><i class="fas fa-bullhorn"></i></button>
        <button id="goto-post-button" class="header-button" title="Перейти к заметке"><i class="fas fa-external-link-alt"></i></button>
        <button id="post-hide-button" class="header-button" title="Скрыть заметку"><i class="fas fa-eye-slash"></i></button>
        <button id="post-remove-button" class="header-button" title="Удалить заметку"><i class="fas fa-trash-alt"></i></button>
    `;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
