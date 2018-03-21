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

    let username = $('#username');
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

    let email = $('#email');
    email.focus(() => showInfoCard(email, 'Введите ваш реальный email адрес. В случае, если вы забудете пароль от вашего аккаунта, вы сможете восстановить его.'));
    email.focusout(hideInfoCard);

    let password1 = $('#password1');
    password1.focus(() => showInfoCard(password1, 'Придумайте себе пароль. Пароль может быть любой сложности и длины, но чем длиннее, и чем больше разнообразных символов в нем будет, тем лучше.'));
    password1.focusout(hideInfoCard);

    let password2 = $('#password2');
    password2.focus(() => showInfoCard(password2, 'Повторите введеный выше пароль.'));
    password2.focusout(hideInfoCard);

    let avatar = $('#avatar');

    let registerButton = $('#register');
    registerButton.click(() => {
        let fd = new FormData();
        fd.append('avatar', avatar.get(0).files[0]);
        fd.append('username', username.val());
        fd.append('email', email.val());
        fd.append('password', password1.val());

        let xhr = new XMLHttpRequest();
        xhr.open('post', '/user/register', true);
        xhr.onload = function() {
            let self = this;
            if (this.status == 200) {
                // let resp = JSON.parse(this.response);
                // console.log('response: ' + resp);
                $.notify('Регистрация прошла успешно.', 'success');
                window.location.replace('/user/me');
            } else {
                $.notify('Произошла ошибка при регистрации.', 'error');
            }
        };
        xhr.send(fd);

        // console.log(JSON.stringify(avatar.val(), null, 2));

        // let registerAjax = $.ajax({
        //     method: 'post',
        //     url: '/user/register',
        //     data: {avatar: avatar.val()},
        // });

        // registerAjax.done(() => {
        //     $.notify('Регистрация прошла успешно.', 'success');
        // });

        // registerAjax.fail(() => {

        // });
    });
});
