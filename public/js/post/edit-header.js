$(document).ready(() => {
    let headerHTML = `
    <div class="container">
        <span id="post-status" class="post-info"></span>
        <span id="post-country-list" class="post-info"></span>
        <button id="post-publish-button" class="btn-link float-right">Publish</button>
    </div>
    `;

    $('#header').append($.parseHTML(headerHTML));

    $('#header button').animateCss('bounceIn');
});
