'use strict';

$(document).ready(function () {

    $('#feedback-email').change(function () {
        var validateEmail = function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        var email = $(this).val();

        if (email && email.trim()) {
            email = email.trim();

            if (!validateEmail(email)) {
                $(this).notify('Неверный формат электронной почты!', {
                    className: 'warn',
                    position: 'left',
                    autoHide: false
                });
            } else {
                $('.notifyjs-wrapper').trigger('notify-hide');
            }
        }
    });

    $('#feedback-send').click(function () {
        var feedbackEmail = $('#feedback-email').val();
        var feedbackBody = $('#feedback-body').val();

        var errors = false;

        if (feedbackEmail && feedbackEmail.trim()) {
            feedbackEmail = feedbackEmail.trim();
        } else {
            $.notify('Поле с вашей электронной почтой не может быть пусто!', 'warn');
            errors = true;
        }

        if (feedbackBody && feedbackBody.trim()) {
            feedbackBody = feedbackBody.trim();
        } else {
            $.notify('Поле с текстом сообщения не может быть пусто!', 'warn');
            errors = true;
        }

        if (errors) return;

        var sendButtonElement = $('#feedback-send');
        var originSendButtonHTML = sendButtonElement.html();
        sendButtonElement.html('<i class="fas fa-spinner fa-pulse"></i> отправляется...');
        sendButtonElement.prop("disabled", true);

        var feedbackAjax = $.ajax({
            method: 'post',
            url: '/api/feedback',
            data: { email: feedbackEmail, body: feedbackBody }
        });

        feedbackAjax.done(function () {
            $.notify('Ваше сообщение успешно отправлено. Спасибо за отзыв!', 'success');
            sendButtonElement.html(originSendButtonHTML);
            sendButtonElement.prop("disabled", false);
        });

        feedbackAjax.fail(function (xhr, status) {
            $.notify('Ошибка при отправке сообщения!', 'warn');
        });
    });
});