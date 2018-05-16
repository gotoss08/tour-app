$(document).ready(() => {

    $('#feedback-email').change(function() {
        let validateEmail = (email) => {
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        let email = $(this).val();

        if (email && email.trim()) {
            email = email.trim();

            if (!validateEmail(email)) {
                $(this).notify(
                    'Неверный формат электронной почты!', {
                        className: 'warn',
                        position: 'left',
                        autoHide: false,
                    }
                );
            } else {
                $('.notifyjs-wrapper').trigger('notify-hide');
            }
        }
    });

    $('#feedback-send').click(() => {
        let feedbackEmail = $('#feedback-email').val();
        let feedbackBody = $('#feedback-body').val();

        let errors = false;

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

        let sendButtonElement = $('#feedback-send');
        let originSendButtonHTML = sendButtonElement.html();
        sendButtonElement.html('<i class="fas fa-spinner fa-pulse"></i> отправляется...');
        sendButtonElement.prop("disabled", true);

        let feedbackAjax = $.ajax({
            method: 'post',
            url: '/api/feedback',
            data: {email: feedbackEmail, body: feedbackBody},
        });

        feedbackAjax.done(() => {
            $.notify('Ваше сообщение успешно отправлено. Спасибо за отзыв!', 'success');
            sendButtonElement.html(originSendButtonHTML);
            sendButtonElement.prop("disabled", false);
        });

        feedbackAjax.fail((xhr, status) => {
            $.notify('Ошибка при отправке сообщения!', 'warn');
        });
    });
});
