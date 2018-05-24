$(document).ready(() => {
    let username = $('#username');
    let password = $('#password');

    username.focus();

    let login = () => {
        let errors = false;

        let usernameVal = username.val();
        if (usernameVal && usernameVal.trim()) {
            usernameVal = usernameVal.trim();
        } else {
            username.notify('Введите имя пользователя.', {position: 'right', className: 'error'});
            errors = true;
        }

        let passwordVal = password.val();
        if (passwordVal && passwordVal.trim()) {
            passwordVal = passwordVal.trim();
        } else {
            password.notify('Введите пароль.', {position: 'right', className: 'error'});
            errors = true;
        }

        if (errors) return;

        let loginButton = $('#login');
        let loginButtonPrevHTML = loginButton.html();
        loginButton.html('<i class="fas fa-spinner"></i>');
        loginButton.children('i').addClass('spinner-rotation');
        loginButton.attr('disabled', true);

        let loginAjax = $.ajax({
            method: 'post',
            url: '/user/login',
            data: {username: usernameVal, password: passwordVal},
        });

        loginAjax.done(() => {
            $.notify('Вы успешно вошли в свой аккаунт.', 'success');
            setTimeout(() => {
                window.location.href = '/user/me';
            }, 250);
        });

        loginAjax.fail((xhr) => {
            if (xhr.status == 401) $.notify(xhr.responseText, 'error');
            else $.notify('Произошла ошибка при авторизации. Пожалуйста, повторите попытку позже или свяжитесь с администрацией.', 'error');
        });

        loginAjax.always(() => {
            loginButton.html(loginButtonPrevHTML);
            loginButton.attr('disabled', false);
        });
    };

    let register = () => {
        window.location.href = '/user/register';
    };

    $('#username, #password').keypress((e) => {
        if (e.which == 13) login();
    });

    let loginButton = $('#login');
    loginButton.click(login);

    let registerButton = $('#register');
    registerButton.click(register);
});
