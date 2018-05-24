'use strict';

var page = 1;
var foundCount = 0;
var loadQueryData = {};
var prevSearchInputVal = '';

function viewPost(post) {
    window.location.href = '/p/' + post.id;
};

function createCardsForPosts(posts) {
    if (!posts && !posts.length) return;

    foundCount += posts.length;

    if (foundCount > 0) {
        $('#search-found-count').html('найдено публикаций: ' + foundCount);
        $('#search-found-area').show();
    }

    var _loop = function _loop(i) {
        var post = posts[i];

        var cardHTML = $('#card-template').html();
        var card = $(cardHTML);
        post.card = card;

        card.find('.meta-card-header-titles').click(function () {
            return viewPost(post);
        }).css('cursor', 'pointer');
        tippy(card.find('.meta-card-header-titles').get(0));

        if (post.title) card.find('.meta-title').html(post.title);else card.find('.meta-title').html('<span class="profile-meta-card-empty-field">Заметка без названия</span>');

        if (post.body) card.find('.meta-body').html(he.decode(post.body)).truncate({ length: 200 });else card.find('.meta-body').html('<span class="profile-meta-card-empty-field">Заметка без описания</span>');

        card.find('.meta-like-counter').html(post.likes);
        tippy(card.find('.meta-likes').get(0));

        card.find('.meta-views-counter').html(post.uniqIpsVisited);
        tippy(card.find('.meta-views').get(0));

        var authorProfileLink = card.find('.meta-author-profile-link');

        var authorAvatar = card.find('.meta-avatar-placeholder');
        authorAvatar.append('<i class="user-no-avatar-icon fas fa-user align-middle"></i>');

        var fetchUserInfoAjax = $.ajax({
            method: 'post',
            url: '/user/' + post.userId
        });

        fetchUserInfoAjax.done(function (data) {
            authorProfileLink.append(data.username);
            authorProfileLink.attr('href', '/user/' + data.username);

            if (data.userAvatarPath) {
                authorAvatar.empty();
                authorAvatar.css('background-image', 'url(' + data.userAvatarPath + ')');
            }
        });

        var postedMoment = moment(post.postedAt);
        var metaDate = card.find('.meta-date');
        metaDate.html(postedMoment.fromNow());
        metaDate.prop('title', postedMoment.format('Do MMMM YYYY в kk:m'));
        tippy(metaDate.get(0));

        /* countries */
        var countriesHTML = '';
        for (var _i = 0; _i < post.preparedCountries.length; _i++) {
            var country = post.preparedCountries[_i];
            countriesHTML += '<a href="/p/country/' + country.id + '">' + country.name + '</a>';
            if (_i != post.preparedCountries.length - 1) countriesHTML += ', ';
        }
        card.find('.meta-country').html(countriesHTML);

        $('.cards').append(card).masonry('appended', card);

        var images = $('.meta-body img');
        images.addClass('w-100 h-100');
    };

    for (var i = 0; i < posts.length; i++) {
        _loop(i);
    }
    $('.cards').masonry('layout');

    setTimeout(function () {
        $('.cards').masonry('layout');
    }, 350);
};

function searchPosts(data) {
    var searchInputVal = $('#search-input').val();
    if (!searchInputVal || !searchInputVal.trim()) return;
    searchInputVal = searchInputVal.trim();

    window.history.pushState('', document.title, encodeURI(searchInputVal));

    if (JSON.stringify(prevSearchInputVal) !== JSON.stringify(searchInputVal)) {
        foundCount = 0;
        $('#search-found-area').hide();

        $('.cards').empty();
        prevSearchInputVal = searchInputVal;
        page = 1;
    }

    data = {
        query: searchInputVal,
        page: page
    };

    var searchAjax = $.ajax({
        method: 'post',
        url: '/search/',
        data: data
    });

    searchAjax.done(function (data) {
        $('.cards').masonry({
            itemSelector: '.waypoint-card',
            columnWidth: '.waypoint-card',
            percentPosition: true
        });

        createCardsForPosts(data.posts);
    });

    searchAjax.fail(function () {
        $.notify('Произошла ошибка во время поиска заметок.', 'error');
    });

    page += 1;
};

$(window).ready(function () {
    $('#search-found-area').hide();

    if (query) searchPosts({ query: query });

    $('#search-input').keypress(function (e) {
        if (e.keyCode == 13) searchPosts();
    });

    $('#search-button').click(searchPosts);

    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            searchPosts();
        }
    });
});