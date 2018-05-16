'use strict';

$(document).ready(function () {
    var headerHTML = '\n        <button id="post-edit-button" class="header-button" title="\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443"><i class="fas fa-edit"></i></button>\n        <button id="post-remove-button" class="header-button" title="\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443"><i class="fas fa-trash-alt"></i></button>\n    ';

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});