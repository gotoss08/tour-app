let page = 1;
let foundCount = 0;
let loadQueryData = {};
let prevSearchInputVal = '';

function viewPost(post) {
    window.location.href = '/p/' + post.id;
};

function createCardsForPosts(posts) {
    if(!posts && !posts.length) return;

    foundCount += posts.length;

    if (foundCount > 0) {
        $('#search-found-count').html('найдено публикаций: ' + foundCount);
        $('#search-found-area').show();
    }

    for (let i = 0; i < posts.length; i++) {
        let post = posts[i];

        let cardHTML = $('#card-template').html();
        let card = $(cardHTML);
        post.card = card;

        card.find('.meta-card-header-titles').click(() => viewPost(post)).css('cursor', 'pointer');
        tippy(card.find('.meta-card-header-titles').get(0));

        if (post.title) card.find('.meta-title').html(post.title);
        else card.find('.meta-title').html('<span class="profile-meta-card-empty-field">Заметка без названия</span>');

        if (post.subtitle) card.find('.meta-subtitle').html(post.subtitle);
        else card.find('.meta-subtitle').html('<span class="profile-meta-card-empty-field">Заметка без подзаголовка</span>');

        if (post.body) card.find('.meta-body').html(he.decode(post.body)).truncate({length: 200});
        else card.find('.meta-body').html('<span class="profile-meta-card-empty-field">Заметка без описания</span>');

        card.find('.meta-like-counter').html(post.likes);
        tippy(card.find('.meta-likes').get(0));

        card.find('.meta-views-counter').html(post.uniqIpsVisited);
        tippy(card.find('.meta-views').get(0));

        let authorProfileLink = card.find('.meta-author-profile-link');

        let authorAvatar = card.find('.meta-avatar-placeholder');
        authorAvatar.append('<i class="user-no-avatar-icon fas fa-user align-middle"></i>');

        let fetchUserInfoAjax = $.ajax({
            method: 'post',
            url: '/user/' + post.userId,
        });

        fetchUserInfoAjax.done((data) => {
            authorProfileLink.append(data.username);
            authorProfileLink.attr('href', '/user/' + data.username);

            if (data.userAvatarPath) {
                authorAvatar.empty();
                authorAvatar.css('background-image', `url(${data.userAvatarPath})`);
            }
        });

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

function searchPosts(data) {
    let searchInputVal = $('#search-input').val();
    if (!searchInputVal || !searchInputVal.trim()) return;
    searchInputVal = searchInputVal.trim();

    window.history.pushState('', document.title, encodeURI(searchInputVal));

    if (JSON.stringify(prevSearchInputVal) !== JSON.stringify(searchInputVal) ) {
        foundCount = 0;
        $('#search-found-area').hide();

        $('.cards').empty();
        prevSearchInputVal = searchInputVal;
        page = 1;
    }

    data = {
        query: searchInputVal,
        page,
    };

    let searchAjax = $.ajax({
        method: 'post',
        url: '/search/',
        data: data,
    });

    searchAjax.done((data) => {
        $('.cards').masonry({
            itemSelector: '.waypoint-card',
            columnWidth: '.waypoint-card',
            percentPosition: true,
        });

        createCardsForPosts(data.posts);
    });

    searchAjax.fail(() => {
        $.notify('Произошла ошибка во время поиска заметок.', 'error');
    });

    page += 1;
};

$(window).ready(() => {
    $('#search-found-area').hide();

    if (query) searchPosts({query: query});

    $('#search-input').keypress((e) => {
        if (e.keyCode == 13) searchPosts();
    });

    $('#search-button').click(searchPosts);

    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            searchPosts();
        }
    });
});
