let page = 1;
let loadQueryData = {};
let loadingPosts = false;
let postsLoadType = 'publications';

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
                $.notify('Произошла ошибка при удалении.', 'success');
            });
        });
};

function createCardsForPosts(posts) {
    console.log('creating cards for posts');
    for (let i = 0; i < posts.length; i++) {
        let post = posts[i];

        let cardHTML = $('#card-template').html();
        let card = $(cardHTML);
        post.card = card;

        if (postsLoadType === 'publications') {
            card.find('.meta-card-header-titles').click(() => viewPost(post)).css('cursor', 'pointer');
            if (profileData.currentUser) {
                tippy(card.find('.post-edit-button').click(() => editPost(post)).css('cursor', 'pointer').get(0));
                tippy(card.find('.post-remove-button').click(() => removePost(post)).css('cursor', 'pointer').get(0));
            } else card.find('.meta-card-header-buttons').remove();
        } else if (postsLoadType === 'drafts') {
            card.find('.post-edit-button').remove();
            if (profileData.currentUser) {
                card.find('.meta-card-header-titles').attr('title', 'Редактировать заметку').click(() => editPost(post)).css('cursor', 'pointer');
                tippy(card.find('.post-remove-button').click(() => removePost(post)).css('cursor', 'pointer').get(0));
            } else card.find('.meta-card-header-buttons').remove();
        }

        if (!profileData.currentUser) {
            card.find('.post-edit-button').remove();
            card.find('.post-remove-button').remove();
        }

        tippy(card.find('.meta-card-header-titles').get(0));

        if (post.title) card.find('.meta-title').html(post.title);
        else card.find('.meta-title').html('<span class="profile-meta-card-empty-field">Заметка без названия</span>');

        if (post.body) card.find('.meta-body').html(he.decode(post.body)).truncate({length: 200});
        else card.find('.meta-body').html('<span class="profile-meta-card-empty-field">Заметка без описания</span>');

        card.find('.meta-like-counter').html(post.likes);
        tippy(card.find('.meta-likes').get(0));

        card.find('.meta-views-counter').html(post.uniqIpsVisited);
        tippy(card.find('.meta-views').get(0));

        let postedMoment = moment(post.postedAt);
        let metaDate = card.find('.meta-date');
        metaDate.html(postedMoment.fromNow());
        metaDate.prop('title', postedMoment.format('Do MMMM YYYY в kk:m'));
        tippy(metaDate.get(0));

        /* countries */
        let countriesHTML = '';
        for (let i = 0; i < post.preparedCountries.length; i++) {
            let country = post.preparedCountries[i];
            countriesHTML += `<a href="/p/country/${country.id}">${country.name}</a>`;
            if (i != post.preparedCountries.length-1) countriesHTML += ', ';
        }
        card.find('.meta-country').html(countriesHTML);

        $('.cards').append(card).masonry('appended', card);

        let images = $('.meta-body img');
        images.addClass('w-100 h-100');
    }
    $('.cards').masonry('layout');

    setTimeout(() => {
        $('.cards').masonry('layout');
    }, 350);
};

function loadNewPosts() {
    console.log('loading new posts');

    loadingPosts = true;

    animatePostsLoading();

    loadQueryData.page = page;

    let loadPostsAjax = $.ajax({
        method: 'post',
        url: '/user/' + profileData.id + '/posts',
        data: loadQueryData,
    });

    loadPostsAjax.done((data) => {
        $('.cards').masonry({
            itemSelector: '.waypoint-card',
            columnWidth: '.waypoint-card',
            percentPosition: true,
        });
        createCardsForPosts(data.posts);
        postsLoaded();
        loadingPosts = false;
    });

    page += 1;
};

$(document).ready(() => {
    $('#avatar').attr('src', profileData.userAvatarPath);
    $('#username').html(profileData.username);

    document.title = 'Профиль - ' + profileData.username;

    loadQueryData = {
        posted: true,
    };

    if (profileData.currentUser) {
        $('#publications-button').click(() => {
            $('#publications-button').addClass('load-posts-button-current');
            $('#drafts-button').removeClass('load-posts-button-current');

            page = 1;
            $('.cards').empty();
            loadQueryData = {
                posted: true,
            };
            postsLoadType = 'publications';
            loadNewPosts();
        });

        $('#drafts-button').click(() => {
            $('#publications-button').removeClass('load-posts-button-current');
            $('#drafts-button').addClass('load-posts-button-current');

            page = 1;
            $('.cards').empty();
            loadQueryData = {
                posted: false,
            };
            postsLoadType = 'drafts';
            loadNewPosts();
        });
    } else {
        $('#load-posts-buttons').remove();
    }

    if (!profileData.userAvatarPath) $('#avatar-placeholder').remove();

    loadNewPosts();

    $(window).scroll(function() {
        if (!loadingPosts && $(window).scrollTop() + $(window).height() == $(document).height()) {
            loadNewPosts();
        }
    });

    // createCardsForPosts();

    $('#posts-count').html(profileData.postsCount);
    $('#likes-count').html(profileData.totalLikesCount);
    $('#unique-views-count').html(profileData.totalUniqViewsCount);
    $('#visit-count').html(profileData.totalVisitCount);
});
