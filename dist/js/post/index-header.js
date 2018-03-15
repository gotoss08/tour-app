'use strict';

$(document).ready(function () {
    var headerHTML = '\n        <button id="post-edit-button" class="header-button" title="\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u0442"><i class="fas fa-edit"></i></button>\n    ';

    tippy('[title]');

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));
    $('#header button').animateCss('bounceIn');
});