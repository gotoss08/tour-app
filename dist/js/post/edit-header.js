'use strict';

$(document).ready(function () {
    var headerHTML = '\n        <button id="post-save-button" class="header-button" title="\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u043E\u0441\u0442"><i class="far fa-save"></i></button>\n        <button id="post-publish-button" class="header-button" title="\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u0442"><i class="fas fa-bullhorn"></i></button>\n    ';

    tippy('[title]');

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));
    $('#header button').animateCss('bounceIn');
});