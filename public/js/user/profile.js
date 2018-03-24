$(document).ready(() => {
    function viewPost(post) {
        window.location.href = '/p/' + post.id;
    };

    function editPost(post) {
        window.location.href = '/p/' + post.id + '/edit';
    };

    function removePost(post) {
        alertify
            .okBtn("Удалить")
            .cancelBtn("Отмена")
            .confirm('Вы уверены что хотите удалить этот пост?', () => {
                let removeAjax = $.ajax({
                    method: 'post',
                    url: '/p/' + post.id + '/remove',
                });

                removeAjax.done(() => {
                    post.card.remove();
                    $('.cards').masonry();
                    $.notify('Заметка удалена.', 'success');
                });

                removeAjax.fail(() => {
                    $.notify('Произошла ошибка при удалении.', 'error');
                });
            });
    };

    $('#avatar').attr('src', profileData.userAvatarPath);
    $('#username').html(profileData.username);
    $('#posts-count').html(profileData.posts.length);

    let totalLikesCount = 0;
    let totalUniqViewsCount = 0;
    let totalVisitCount = 0;

    for (let i = 0; i < profileData.posts.length; i++) {
        let post = profileData.posts[i];

        let cardHTML = $('#card-template').html();
        let card = $(cardHTML);
        post.card = card;

        card.find('.meta-card-header-titles').click(() => viewPost(post)).css('cursor', 'pointer');
        if (profileData.currentUser) {
            tippy(card.find('.post-edit-button').click(() => editPost(post)).css('cursor', 'pointer').get(0));
            tippy(card.find('.post-remove-button').click(() => removePost(post)).css('cursor', 'pointer').get(0));
        } else card.find('.meta-card-header-buttons').remove();

        tippy(card.find('.meta-card-header-titles').get(0));

        card.find('.meta-title').html(post.title);
        card.find('.meta-subtitle').html(post.subtitle);
        card.find('.meta-body').html(he.decode(post.body)).truncate({length: 200});

        card.find('.meta-like-counter').html(post.likes);
        tippy(card.find('.meta-likes').get(0));
        totalLikesCount += post.likes;

        card.find('.meta-views-counter').html(post.uniqIpsVisited);
        tippy(card.find('.meta-views').get(0));
        totalUniqViewsCount += post.uniqIpsVisited;

        totalVisitCount += post.totalVisitCount;

        let postedMoment = moment(post.postedAt);
        let metaDate = card.find('.meta-date');
        metaDate.html(postedMoment.fromNow());
        metaDate.prop('title', postedMoment.format('Do MMMM YYYY в kk:m'));
        tippy(metaDate.get(0));

        /* countries */
        let countriesHTML = '';
        for (let i = 0; i < post.countries.length; i++) {
            let country = post.countries[i];
            countriesHTML += `<a href="/${country.id}">${country.name}</a>`;
            if (i != post.countries.length-1) countriesHTML += ', ';
        }
        card.find('.meta-country').html(countriesHTML);

        $('.cards').append(card);

        let images = $('.meta-body img');
        images.addClass('w-100 h-100');
    }

    $('.cards').masonry({
        itemSelector: '.waypoint-card',
        columnWidth: '.waypoint-card',
        percentPosition: true,
    });

    setTimeout(() => {
        $('.cards').masonry();
    }, 250);

    $('#likes-count').html(totalLikesCount);
    $('#unique-views-count').html(totalUniqViewsCount);
    $('#visit-count').html(totalVisitCount);
});
