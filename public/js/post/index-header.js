$(document).ready(() => {
    let headerHTML = `
        <button id="post-edit-button" class="header-button" title="Редактировать пост"><i class="fas fa-edit"></i></button>
    `;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});
