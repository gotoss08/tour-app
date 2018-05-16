'use strict';

$(document).ready(function () {
    var headerHTML = '\n        <button id="post-save-button" class="header-button" title="\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0437\u0430\u043C\u0435\u0442\u043A\u0438."><i class="far fa-save"></i></button>\n        <button id="post-publish-button" class="header-button" title="\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443."><i class="fas fa-bullhorn"></i></button>\n        <button id="post-hide-button" class="header-button" title="\u0421\u043A\u0440\u044B\u0442\u044C/\u0443\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \u043E\u0431\u0449\u0435\u0433\u043E \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u0437\u0430\u043C\u0435\u0442\u043A\u0443"><i class="fas fa-eye-slash"></i></button>\n        <button id="post-remove-button" class="header-button" title="\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443"><i class="fas fa-trash-alt"></i></button>\n    ';

    $('#header .header-page-control-section').append($.parseHTML(headerHTML));

    tippy('[title]');

    $('#header button').animateCss('bounceIn');
});