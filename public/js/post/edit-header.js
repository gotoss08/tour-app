$(document).ready(() => {
    let headerHTML = `
        <button id="post-publish-button" class="header-button float-right">Publish</button>
    `;

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));
    $('#header button').animateCss('bounceIn');
});
