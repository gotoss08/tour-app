'use strict';

$(document).ready(function () {
    var username = $('#username');
    var password = $('#password');

    username.focus();

    var login = function login() {
        var errors = false;

        var usernameVal = username.val();
        if (usernameVal && usernameVal.trim()) {
            usernameVal = usernameVal.trim();
        } else {
            username.notify('Введите имя пользователя.', { position: 'right', className: 'error' });
            errors = true;
        }

        var passwordVal = password.val();
        if (passwordVal && passwordVal.trim()) {
            passwordVal = passwordVal.trim();
        } else {
            password.notify('Введите пароль.', { position: 'right', className: 'error' });
            errors = true;
        }

        if (errors) return;

        var loginButton = $('#login');
        var loginButtonPrevHTML = loginButton.html();
        loginButton.html('<i class="fas fa-spinner"></i>');
        loginButton.children('i').addClass('spinner-rotation');
        loginButton.attr('disabled', true);

        var loginAjax = $.ajax({
            method: 'post',
            url: '/user/login',
            data: { username: usernameVal, password: passwordVal }
        });

        loginAjax.done(function () {
            $.notify('Вы успешно вошли в свой аккаунт.', 'success');
            setTimeout(function () {
                window.location.href = '/user/me';
            }, 250);
        });

        loginAjax.fail(function (xhr) {
            if (xhr.status == 401) $.notify(xhr.responseText, 'error');else $.notify('Произошла ошибка при авторизации. Пожалуйста, повторите попытку позже или свяжитесь с администрацией.', 'error');
        });

        loginAjax.always(function () {
            loginButton.html(loginButtonPrevHTML);
            loginButton.attr('disabled', false);
        });
    };

    var register = function register() {
        window.location.href = '/user/register';
    };

    $('#username, #password').keypress(function (e) {
        if (e.which == 13) login();
    });

    var loginButton = $('#login');
    loginButton.click(login);

    var registerButton = $('#register');
    registerButton.click(register);
});