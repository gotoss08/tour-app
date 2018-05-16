'use strict';

$(document).ready(function () {
    var infoCard = $('.info-card');
    var mainCard = $('.register-card');
    infoCard.hide();

    /** **/
    function showInfoCard(card, messageHTML) {
        infoCard.show();
        infoCard.offset({
            top: card.offset().top,
            left: mainCard.offset().left + mainCard.outerWidth() + 25
        });
        infoCard.html(messageHTML);
    }

    /** **/
    function hideInfoCard() {
        infoCard.hide();
    }

    /* find elements and set content in info window */
    var username = $('#real-username');
    var usernameStatus = $('#username-status');
    var usernameTextHTML = '\n        \u0418\u043C\u0435\u043D\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u043C\u043E\u0433\u0443\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C:\n        <ul>\n            <li>\u0431\u0443\u043A\u0432\u044B \u043B\u0430\u0442\u0438\u043D\u0441\u043A\u043E\u0433\u043E \u0430\u043B\u0444\u0430\u0432\u0438\u0442\u0430 (a\u2013z)</li>\n            <li>\u0446\u0438\u0444\u0440\u044B (0\u20139)</li>\n            <li>\u0434\u0435\u0444\u0438\u0441\u044B (-)</li>\n            <li>\u0441\u0438\u043C\u0432\u043E\u043B\u044B \u043F\u043E\u0434\u0447\u0435\u0440\u043A\u0438\u0432\u0430\u043D\u0438\u044F (_)</li>\n            <li>\u0442\u043E\u0447\u043A\u0438 (.)</li>\n        </ul>\n    ';
    username.focus(function () {
        return showInfoCard(username, usernameTextHTML);
    });
    username.focusout(hideInfoCard);

    var email = $('#real-email');
    var emailStatus = $('#email-status');
    email.focus(function () {
        return showInfoCard(email, 'Введите ваш реальный email адрес. В случае, если вы забудете пароль от вашего аккаунта, вы сможете восстановить его.');
    });
    email.focusout(hideInfoCard);

    var password1 = $('#real-password1');
    password1.focus(function () {
        return showInfoCard(password1, 'Придумайте себе пароль. Пароль может быть любой сложности и длины, но чем длиннее, и чем больше разнообразных символов в нем будет, тем лучше.');
    });
    password1.focusout(hideInfoCard);

    var password2 = $('#real-password2');
    password2.focus(function () {
        return showInfoCard(password2, 'Повторите введеный выше пароль.');
    });
    password2.focusout(hideInfoCard);

    var avatar = $('#avatar');

    /* validation */
    var usernameFree = true;
    var emailFree = true;

    username.keyup(function () {
        var usernameVal = $(this).val();
        if (usernameVal && usernameVal.trim()) {
            var usernameAjax = $.ajax({
                method: 'post',
                url: '/user/username',
                data: { username: usernameVal }
            });

            usernameAjax.done(function (response) {
                if (response == 'free') {
                    username.addClass('input-valid').removeClass('input-error');
                    usernameStatus.html('Имя пользователя свободно.').addClass('status-free').removeClass('status-taken');
                    usernameFree = true;
                } else if (response == 'taken') {
                    username.addClass('input-error').removeClass('input-valid');
                    usernameStatus.html('Такое имя пользователя уже используется.').addClass('status-taken').removeClass('status-free');
                    usernameFree = false;
                } else {
                    console.error('Произошла ошибка на сервере.');
                }
            });

            usernameAjax.fail(function (xhr) {
                console.error(xhr.statusText);
            });
        }
    });

    var validateEmail = function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    email.keyup(function () {
        var emailVal = $(this).val();
        if (emailVal && emailVal.trim()) {
            if (validateEmail(emailVal)) {
                var emailAjax = $.ajax({
                    method: 'post',
                    url: '/user/email',
                    data: { email: emailVal }
                });

                emailAjax.done(function (response) {
                    if (response == 'free') {
                        email.addClass('input-valid').removeClass('input-error');
                        emailStatus.html('Email свободен.').addClass('status-free').removeClass('status-taken');
                        emailFree = true;
                    } else if (response == 'taken') {
                        email.addClass('input-error').removeClass('input-valid');
                        emailStatus.html('Такой email уже используется.').addClass('status-taken').removeClass('status-free');
                        emailFree = false;
                    } else {
                        console.error('Произошла ошибка на сервере.');
                    }
                });

                emailAjax.fail(function (xhr) {
                    console.error(xhr.statusText);
                });
            } else {
                email.addClass('input-error').removeClass('input-valid');
                emailStatus.html('Не правильный формат email адреса.').addClass('status-taken').removeClass('status-free');
            }
        }
    });

    function comparePasswords(pass1, pass2) {
        if (pass1.length < 1 || pass2.length < 1) {
            if (pass1.length < 1 && pass2.length > 0 || pass1.length > 0 && pass2.length < 1) {
                password1.removeClass('input-valid input-error');
                password2.removeClass('input-valid').addClass('input-error');
            } else if (pass1.length < 1) {
                password1.removeClass('input-valid input-error');
                password2.removeClass('input-valid input-error');
            } else if (pass1.length < 1 && pass2.length < 1) {
                password1.removeClass('input-valid').addClass('input-error');
                password2.removeClass('input-valid').addClass('input-error');
            }
        } else {
            if (pass1 == pass2) {
                password1.addClass('input-valid').removeClass('input-error');
                password2.removeClass('input-error').addClass('input-valid');
            } else {
                password1.removeClass('input-error input-valid');
                password2.addClass('input-error').removeClass('input-valid');
            }
        }
    };
    password1.keyup(function () {
        var thisval = $(this).val();
        comparePasswords(thisval, password2.val());
    });
    password2.keyup(function () {
        var thisval = $(this).val();
        comparePasswords(password1.val(), thisval);
    });

    var checkForEmptyFields = function checkForEmptyFields() {
        var emptyFields = false;

        var usernameText = username.val();
        if (!usernameText || !usernameText.trim()) {
            username.notify('Имя пользователя не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            emptyFields = true;
        }

        var emailText = email.val();
        if (!emailText || !emailText.trim()) {
            email.notify('Email не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            emptyFields = true;
        }

        var passwordText = password1.val();
        if (!passwordText || !passwordText.trim()) {
            password1.notify('Ваш пароль не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            emptyFields = true;
        }

        return emptyFields;
    };

    var validatePasswords = function validatePasswords() {
        var equals = true;

        if (password1.val() != password2.val()) {
            password2.notify('Пароли не совпадают.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            equals = false;
        }

        return equals;
    };

    var validateFields = function validateFields() {
        $('.notifyjs-wrapper').trigger('notify-hide');

        var errors = false;

        if (checkForEmptyFields()) {
            $.notify('У вас остались пустые поля!', 'error');
            errors = true;
        }

        if (!validatePasswords()) {
            $.notify('Введенные вами пароли не совпадают.', 'error');
            errors = true;
        }

        if (!usernameFree) {
            username.notify('Имя пользователя занято.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            errors = true;
        }

        if (!emailFree) {
            email.notify('Email занят.', {
                position: 'left',
                className: 'error',
                autoHide: false
            });
            errors = true;
        }

        return !errors;
    };

    /* make button register user on press */
    var registerButton = $('#register');
    registerButton.click(function () {
        if (!validateFields()) return false;

        var fd = new FormData();
        fd.append('avatar', avatar.get(0).files[0]);
        fd.append('username', username.val());
        fd.append('email', email.val());
        fd.append('password', password1.val());

        var xhr = new XMLHttpRequest();
        xhr.open('post', '/user/register', true);
        xhr.onload = function () {
            if (this.status == 200) {
                $.notify('Регистрация прошла успешно.', 'success');
                window.location.href = '/user/me';
            } else {
                $.notify('Произошла ошибка при регистрации.', 'error');
            }
        };
        xhr.send(fd);
    });
});