$(document).ready(() => {
    let headerHTML = `
        <button id="post-edit-button" class="header-button" title="Редактировать заметку"><i class="fas fa-edit"></i></button>
        <button id="post-remove-button" class="header-button" title="Удалить заметку"><i class="fas fa-trash-alt"></i></button>
    `;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
