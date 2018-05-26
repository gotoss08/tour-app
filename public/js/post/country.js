'use strict';

var page = 1;
var loadQueryData = {};
var prevCountrySelectVal = void 0;
var feed = true;

function viewPost(post) {
    window.location.href = '/p/' + post.id;
};

function createCardsForPosts(posts) {
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

function searchPostsByCountry(data) {
    var countrySelectVal = $('.country-select').val();
    if (!countrySelectVal.length && (!data || data && !data.countries.length)) feed = true;else feed = false;

    if (JSON.stringify(prevCountrySelectVal) !== JSON.stringify(countrySelectVal)) {
        $('.cards').empty();
        prevCountrySelectVal = countrySelectVal;
        page = 1;
    }

    if (!data) data = { countries: countrySelectVal };
    data.page = page;
    data.feed = feed;

    console.log('sending: ' + JSON.stringify(data, null, 2));

    var searchByCountryAjax = $.ajax({
        method: 'post',
        url: '/p/country',
        data: data
    });

    searchByCountryAjax.done(function (data) {
        $('.cards').masonry({
            itemSelector: '.waypoint-card',
            columnWidth: '.waypoint-card',
            percentPosition: true
        });
        createCardsForPosts(data.posts);
    });

    searchByCountryAjax.fail(function () {
        $.notify('Произошла ошибка во время поиска заметок.', 'error');
    });

    page += 1;
};

$(document).ready(function () {
    countriesData.countries.forEach(function (country) {
        $('.country-select').append('<option value="' + country.id + '">' + country.name + '</option>');
    });

    $('.country-select').chosen({ no_results_text: 'Об этой стране заметок не найдено.', inherit_select_classes: true });

    if (countriesData.country) {
        $('.country-select').val([countriesData.country]);
        $('.country-select').trigger('chosen:updated');

        feed = false;
        searchPostsByCountry({ countries: [countriesData.country] });
    } else {
        // $('.country-select').trigger('chosen:open');
        // $('.chosen-search-input').val('');

        feed = true;
        searchPostsByCountry();
    }

    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            searchPostsByCountry();
        }
    });
});