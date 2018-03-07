'use strict';

$(document).ready(function () {
    var headerHTML = '\n    <div class="container">\n        <span id="post-status" class="post-info"></span>\n        <span id="post-country-list" class="post-info"></span>\n        <button id="post-publish-button" class="btn-link float-right">Publish</button>\n    </div>\n    ';

    $('#header').append($.parseHTML(headerHTML));

    $('#header button').animateCss('bounceIn');
});