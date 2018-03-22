$(document).ready(() => {
    let infoCard = $('.info-card');
    let mainCard = $('.register-card');
    infoCard.hide();

    /** **/
    function showInfoCard(card, messageHTML) {
        infoCard.show();
        infoCard.offset({
            top: card.offset().top,
            left: mainCard.offset().left + mainCard.outerWidth() + 25,
        });
        infoCard.html(messageHTML);
    }

    /** **/
    function hideInfoCard() {
        infoCard.hide();
    }

    /* find elements and set content in info window */
    let username = $('#real-username');
    let usernameStatus = $('#username-status');
    let usernameTextHTML = `
        Имена пользователей могут содержать:
        <ul>
            <li>буквы латинского алфавита (a–z)</li>
            <li>цифры (0–9)</li>
            <li>дефисы (-)</li>
            <li>символы подчеркивания (_)</li>
            <li>точки (.)</li>
        </ul>
    `;
    username.focus(() => showInfoCard(username, usernameTextHTML));
    username.focusout(hideInfoCard);

    let email = $('#real-email');
    let emailStatus = $('#email-status');
    email.focus(() => showInfoCard(email, 'Введите ваш реальный email адрес. В случае, если вы забудете пароль от вашего аккаунта, вы сможете восстановить его.'));
    email.focusout(hideInfoCard);

    let password1 = $('#real-password1');
    password1.focus(() => showInfoCard(password1, 'Придумайте себе пароль. Пароль может быть любой сложности и длины, но чем длиннее, и чем больше разнообразных символов в нем будет, тем лучше.'));
    password1.focusout(hideInfoCard);

    let password2 = $('#real-password2');
    password2.focus(() => showInfoCard(password2, 'Повторите введеный выше пароль.'));
    password2.focusout(hideInfoCard);

    let avatar = $('#avatar');

    /* validation */
    username.keyup(function() {
        let usernameVal = $(this).val();
        if (usernameVal && usernameVal.trim()) {
            let usernameAjax = $.ajax({
                method: 'post',
                url: '/user/username',
                data: {username: usernameVal},
            });

            usernameAjax.done((response) => {
                if (response == 'free') {
                    username.addClass('input-valid').removeClass('input-error');
                    usernameStatus.html('Имя пользователя свободно.').addClass('status-free').removeClass('status-taken');
                } else if (response == 'taken') {
                    username.addClass('input-error').removeClass('input-valid');
                    usernameStatus.html('Такое имя пользователя уже используется.').addClass('status-taken').removeClass('status-free');
                } else {
                    console.error('Произошла ошибка на сервере.');
                }
            });

            usernameAjax.fail((xhr) => {
                console.error(xhr.statusText);
            });
        }
    });

    let validateEmail = (email) => {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    email.keyup(function() {
        let emailVal = $(this).val();
        if (emailVal && emailVal.trim()) {
            if (validateEmail(emailVal)) {
                let emailAjax = $.ajax({
                    method: 'post',
                    url: '/user/email',
                    data: {email: emailVal},
                });

                emailAjax.done((response) => {
                    if (response == 'free') {
                        email.addClass('input-valid').removeClass('input-error');
                        emailStatus.html('Email свободен.').addClass('status-free').removeClass('status-taken');
                    } else if (response == 'taken') {
                        email.addClass('input-error').removeClass('input-valid');
                        emailStatus.html('Такой email уже используется.').addClass('status-taken').removeClass('status-free');
                    } else {
                        console.error('Произошла ошибка на сервере.');
                    }
                });

                emailAjax.fail((xhr) => {
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
    password1.keyup(function() {
        let thisval = $(this).val();
        comparePasswords(thisval, password2.val());
    });
    password2.keyup(function() {
        let thisval = $(this).val();
        comparePasswords(password1.val(), thisval);
    });

    let checkForEmptyFields = () => {
        let emptyFields = false;

        let usernameText = username.val();
        if (!usernameText || !usernameText.trim()) {
            username.notify('Имя пользователя не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false,
            });
            emptyFields = true;
        }

        let emailText = email.val();
        if (!emailText || !emailText.trim()) {
            email.notify('Email не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false,
            });
            emptyFields = true;
        }

        let passwordText = password1.val();
        if (!passwordText || !passwordText.trim()) {
            password1.notify('Ваш пароль не может быть пустым.', {
                position: 'left',
                className: 'error',
                autoHide: false,
            });
            emptyFields = true;
        }

        return emptyFields;
    };

    let validatePasswords = () => {
        let equals = true;

        if (password1.val() != password2.val()) {
            password2.notify('Пароли не совпадают.', {
                position: 'left',
                className: 'error',
                autoHide: false,
            });
            equals = false;
        }

        return equals;
    };

    let validateFields = () => {
        $('.notifyjs-wrapper').trigger('notify-hide');

        let errors = false;

        if (checkForEmptyFields()) {
            $.notify('У вас остались пустые поля!', 'error');
            errors = true;
        }

        if (!validatePasswords()) {
            $.notify('Введенные вами пароли не совпадают.', 'error');
            errors = true;
        }

        return !errors;
    };

    /* make button register user on press */
    let registerButton = $('#register');
    registerButton.click(() => {
        if (!validateFields()) return false;

        let fd = new FormData();
        fd.append('avatar', avatar.get(0).files[0]);
        fd.append('username', username.val());
        fd.append('email', email.val());
        fd.append('password', password1.val());

        let xhr = new XMLHttpRequest();
        xhr.open('post', '/user/register', true);
        xhr.onload = function() {
            if (this.status == 200) {
                $.notify('Регистрация прошла успешно.', 'success');
                window.location.replace('/user/me');
            } else {
                $.notify('Произошла ошибка при регистрации.', 'error');
            }
        };
        xhr.send(fd);
    });
});
