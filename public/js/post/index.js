'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

$(document).ready(function () {
    $('#post-edit-button').click(function () {
        window.location.href = '/p/' + receivedPostData.post.postId + '/edit';
    });

    $('#post-remove-button').click(function () {
        alertify.okBtn("Удалить").cancelBtn("Отмена").confirm('Вы уверены что хотите удалить этот пост?', function () {
            var removeAjax = $.ajax({
                method: 'post',
                url: '/p/' + receivedPostData.post.postId + '/remove'
            });

            removeAjax.done(function () {
                window.location.href = '/user/' + receivedPostData.username;
            });

            removeAjax.fail(function () {
                $.notify('Произошла ошибка при удалении.');
            });
        });
    });

    // set default locale to russian
    moment.locale('ru');

    $.trim('.received-post-data-script');
});

var map = void 0;
var placesService = void 0;
var directionsService = void 0;
var directionsDisplay = void 0;
var markerInfoWindow = void 0;

var waypoints = [];
var markers = [];

var initMap = function initMap() {
    // create map
    map = createMap();

    // create places service
    placesService = createPlacesService();

    // init routing service
    directionsService = createDirectionsService();
    directionsDisplay = createDirectionsDisplay();

    // create basic info window
    markerInfoWindow = createMarkerWindow();

    // generate card with post meta information
    generateMetaCard();

    // update all fields accodring to data from server
    loadData(receivedPostData);

    // add classes for limiting image width and height to fit the card
    var imagesSelector = '.waypoint-cards p img, .meta-body img';
    var images = $(imagesSelector);
    images.addClass('w-100 h-100');
    images.attr('title', 'Открыть в просмотрщике фотографий.');
    images.css('cursor', 'pointer');
    tippy(imagesSelector);

    // create and attach image viewer to photos
    initImageViewer(images);
};

var generateWaypointCardHTML = function generateWaypointCardHTML(marker) {
    return '\n        <div id="' + marker.cardId + '" class="waypoint-card rounded">\n            <div class="waypoint-card-header d-flex flex-row align-items-center">\n                <div class="waypoint-card-header-input"></div>\n                <button class="waypoint-card-header-icon show-on-map-button" type="button" title="\u0421\u0444\u043E\u043A\u0443\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u0443 \u043D\u0430 \u044D\u0442\u043E\u043C \u043C\u0430\u0440\u043A\u0435\u0440\u0435.">\n                    <i class="fas fa-map-marker-alt"></i>\n                </button>\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body">\n                <div class="waypoint-card-body-editor"></div>\n            </div>\n        </div>\n    ';
};

var createWaypointCard = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(marker) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return new Promise(function (resolve) {
                            var cardHtml = generateWaypointCardHTML(marker);
                            var cardDOMElement = $($.parseHTML(cardHtml));

                            $('.waypoint-cards').append(cardDOMElement);

                            // button for focusing on marker
                            $('#' + marker.cardId + ' .show-on-map-button').click(function () {
                                focusMap(marker);
                            });

                            resolve();
                        });

                    case 2:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function createWaypointCard(_x) {
        return _ref.apply(this, arguments);
    };
}();

// info window for showing marker address
var showInfoWindow = function showInfoWindow(marker) {
    // let content = `<div class="d-flex align-items-center">${marker.cardName}</div>`;
    var content = '\n        <div class="d-flex align-items-center">\n            <button id="' + marker.cardId + '-go-to-card-button" class="" type="button" onclick="$(window).scrollTop($(\'#' + marker.cardId + '\').offset().top-5); $(\'#' + marker.cardId + '\').animateCss(\'flash\', () => {})" style="background-color: transparent; border: none;" title="\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u043A \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435."><i class="fas fa-search"></i></button>\n            ' + marker.cardName + '\n        </div>\n    ';

    markerInfoWindow.close();
    markerInfoWindow.setOptions({ content: content });
    markerInfoWindow.open(map, marker);
};

var addEventListeners = function addEventListeners(marker) {
    // show tooltip with location name
    marker.addListener('click', function () {
        showInfoWindow(marker);
    });
};

var generateMetaCard = function generateMetaCard() {
    var metaCardHTML = '\n        <div class="waypoint-card meta-card rounded w-100">\n            <div class="waypoint-card-header card-bg-hover d-flex flex-column">\n                <div class="waypoint-card-header-input meta-title">Meta title</div>\n                <div class="waypoint-card-header-input meta-subtitle">Meta subtitle</div>\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body">\n                <div class="form-control waypoint-card-body-editor meta-body"></div>\n            </div>\n            <hr class="card-divider">\n            <div class="meta-card-footer d-flex flex-column">\n                <div class="card-bg-hover d-flex flex-row align-items-center p-2">\n                    <button class="default-button meta-like-button"><i class="far fa-heart faa-pulse-hover"></i></button><span class="meta-like-counter">0</span>\n                    <span title="\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E <b>\u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445</b> \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u0437\u0430\u043C\u0435\u0442\u043A\u0438.">\n                        <i class="fas fa-eye ml-2 mr-1"></i><span class="meta-views-counter">0</span>\n                    </span>\n                </div>\n                <hr class="card-divider">\n                <div class="d-flex flex-row align-items-center align-items-stretch">\n                    <a id="" class="meta-card-footer-item card-bg-hover meta-author-profile-link mr-auto d-flex flex-row align-items-center">\n                        <div class="rounded-circle avatar-placeholder meta-avatar-placeholder mr-2"></div>\n                    </a>\n                    <div class="meta-card-footer-item card-bg-hover d-flex flex-column">\n                        <div class="d-flex flex-row align-items-center mb-3">\n                            <div class="meta-date"></div>\n                        </div>\n                        <div class="meta-country mr-2"></div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    ';
    var metaCardDOMElement = $($.parseHTML(metaCardHTML));
    $('.waypoint-cards').append(metaCardDOMElement);

    autosize($('.meta-subtitle'));

    tippy('[title]');
};

var loadData = function loadData(data) {

    // set page title to post title
    document.title = data.post.title;

    $('.meta-title').html(data.post.title);
    $('.meta-subtitle').html(data.post.subtitle);
    $('.meta-body').html(he.decode(data.post.body));

    /* counters */
    $('.meta-views-counter').html(data.post.uniqIpsVisited);
    $('.meta-like-counter').html(data.post.likes);

    /* like-button functional */
    var likeButton = $('.meta-like-button');
    if (data.post.currentUserLiked) {
        likeButton.find('i').removeClass('far').addClass('fas');
    }

    likeButton.click(function () {
        var self = this;

        var likeAjax = $.ajax({
            method: 'post',
            url: '/p/' + data.post.postId + '/like'
        });

        likeAjax.done(function (data) {
            $('.meta-like-counter').html(data.likes.length);
            if (data.userJustLiked) {
                $(self).find('[data-fa-i2svg]').removeClass('far').addClass('fas');
            } else {
                $(self).find('[data-fa-i2svg]').removeClass('fas').addClass('far');
            }
        });

        likeAjax.fail(function (xhr) {
            $.notify(xhr.responseText, 'error');
        });
    });

    /* time and date */
    var postedMoment = moment(data.post.postedAt);

    $('.meta-date').html(postedMoment.fromNow());
    $('.meta-date').prop('title', postedMoment.format('Do MMMM YYYY в kk:m'));
    tippy('.meta-date');

    /* countries */
    var countriesHTML = '';
    for (var i = 0; i < data.countries.length; i++) {
        var country = data.countries[i];
        countriesHTML += '<a href="/p/country/' + country.id + '">' + country.name + '</a>';
        if (i != data.countries.length - 1) countriesHTML += ', ';
    }
    $('.meta-country').html(countriesHTML);

    /* post author */
    var authorProfileLink = $('.meta-author-profile-link');
    authorProfileLink.append(data.username);
    authorProfileLink.attr('href', '/user/' + data.username);

    var authorAvatar = $('.meta-avatar-placeholder');
    if (data.userAvatarPath) {
        authorAvatar.css('background-image', 'url(' + data.userAvatarPath + ')');
    } else {
        authorAvatar.append('<i class="user-no-avatar-icon fas fa-user align-middle"></i>');
    }

    data.post.markers.sort(function (a, b) {
        return a.positionIndex - b.positionIndex;
    });

    data.post.markers.forEach(function (marker) {
        // prepare position
        var unpreparedPosition = marker['position'];
        unpreparedPosition = marker['position'].slice(1, marker['position'].length - 1);
        var splittedPosition = unpreparedPosition.split(',');
        var position = new google.maps.LatLng(Number(splittedPosition[0]), Number(splittedPosition[1]));

        var positionIndex = marker.positionIndex;
        var cardId = marker.cardId;
        var header = marker.header;
        var body = marker.body;

        marker = new google.maps.Marker({
            map: map,
            draggable: false,
            // animation: google.maps.Animation.DROP,
            position: position
        });

        initMarker(marker, {
            cardId: cardId
        });

        addEventListeners(marker);

        createWaypointCard(marker);

        // update card header`s input
        marker.cardName = header;
        var headerInputElement = $('#' + marker.cardId + ' .waypoint-card-header-input');
        headerInputElement.html(marker.cardName);

        if (body) {
            var bodyData = body;
            $('#' + cardId + ' .waypoint-card-body-editor').html(he.decode(body));
        }
    });

    recreateMapFocusWaypoints();

    if (data.voteAttached) {
        // create main vote card
        createVoteCard();

        // find main vote card for further manipulations
        var voteCard = $('.vote-card');

        // set vote header
        voteCard.find('.vote-card-header-input').html(data.vote.title);

        // create chart with current vote result display
        createVoteChart(data.vote);

        // create vote buttons if current user not voted yet
        if (!data.currentUserVoted && data.userLoggedIn) {
            createVoteInteractions(data.vote.options);
        }
    }

    calcRoute();
};

var createVoteCard = function createVoteCard() {
    var voteCardHTML = '\n        <div class="waypoint-card vote-card rounded">\n            <div class="waypoint-card-header d-flex flex-row align-items-center">\n                <div class="vote-card-header-input"></div>\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body"></div>\n        </div>\n    ';

    $('#cards').append(voteCardHTML);
};

var createVoteInteractions = function createVoteInteractions(options) {
    var voteCardBody = $('.vote-card > .waypoint-card-body');
    voteCardBody.append('<div class="vote-interaction-buttons"></div>');
    voteCardBody = $('.vote-card .waypoint-card-body .vote-interaction-buttons');

    options.forEach(function (option) {
        var optionHTML = '\n            <div class="d-flex flex-row align-items-center">\n                <button class="mr-1 align-self-center" style="background-color: transparent; outline: none; border: none;"><i class="far fa-square"></i></button>\n                <div class="vote-card-body-input">' + option.title + '</div>\n            </div>\n        ';

        var voteBtn = $(optionHTML);

        voteBtn.click(function () {
            $('.vote-card > .waypoint-card-body').find('[data-fa-i2svg]').removeClass('fa-check-square').addClass('fa-square');
            $(this).find('[data-fa-i2svg]').removeClass('fa-square').addClass('fa-check-square');

            $('.vote-card .waypoint-card-body div').removeClass('vote-option-active');
            voteBtn.addClass('vote-option-active');
        });

        voteBtn.data('vote-option-id', option.id);

        voteCardBody.append(voteBtn);
    });

    var voteBtnHTML = '\n        <button class="default-button vote-button rounded mt-2">\u041F\u0440\u043E\u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u0442\u044C</button>\n    ';
    var voteBtn = $(voteBtnHTML);

    voteBtn.click(function () {
        var currentVoteOptionId = $('.vote-card .waypoint-card-body .vote-option-active').data('vote-option-id');
        // voteCardBody.empty();
        $('.vote-card .waypoint-card-body .vote-interaction-buttons').remove();
        sendVoteRequest(receivedPostData.post.voteId, currentVoteOptionId);
    });

    voteCardBody.append(voteBtn);
};

var sendVoteRequest = function sendVoteRequest(voteId, optionId) {
    var voteAjax = $.ajax({
        method: 'post',
        url: '/v/' + voteId + '/' + optionId
    });

    voteAjax.done(function (data) {
        $.notify('Ваш голос учтен.');
        updateVoteChart(data.vote);
    });

    voteAjax.fail(function (xhr, status) {
        $.notify(xhr.responseText);
    });
};

var voteChart;

var createVoteChart = function createVoteChart(vote) {
    $('.vote-card .waypoint-card-body').append('<canvas id="vote-chart" class="mb-3" width="100%" height="50%"></canvas>');

    // create chart
    var ctx = document.getElementById("vote-chart").getContext('2d');
    voteChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],
                borderColor: ['rgba(255,99,132,1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                borderWidth: 1
            }]
        }
    });

    // clear local data and replace with data from server
    voteChart.data.labels = [];
    voteChart.data.datasets[0].data = [];

    vote.options.forEach(function (option) {
        // update vote chart data
        voteChart.data.labels.push(option.title);
        voteChart.data.datasets[0].data.push(option.voteCount);
    });

    voteChart.update();
};

var updateVoteChart = function updateVoteChart(vote) {
    voteChart.data.labels = [];
    voteChart.data.datasets[0].data = [];

    vote.options.forEach(function (option) {
        // update vote chart data
        voteChart.data.labels.push(option.title);
        voteChart.data.datasets[0].data.push(option.voteCount);
    });

    voteChart.update();
};

var initImageViewer = function initImageViewer(images) {
    var imageContainer = $('<ul></ul>');

    var html = '<ul>';
    for (var i = 0; i < images.length; i++) {
        var image = images[i];
        html += '<li>';
        html += '<img src="' + $(image).attr('src') + '">';
        html += '</li>';
    }
    html += '</ul>';

    var viewer = new Viewer($(html)[0]);

    var _loop = function _loop(_i) {
        var image = images[_i];
        $(image).click(function () {
            viewer.view(_i);
            viewer.show();
        });
    };

    for (var _i = 0; _i < images.length; _i++) {
        _loop(_i);
    }
};