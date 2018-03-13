$(document).ready(() => {
    let headerHTML = `
        <button id="post-edit-button" class="header-button" title="Редактировать пост"><i class="fas fa-edit"></i></button>
    `;

    tippy('[title]');

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));
    $('#header button').animateCss('bounceIn');
});
