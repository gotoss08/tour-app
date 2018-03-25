$(document).ready(() => {
    $('#post-edit-button').click(function() {
        window.location.href = `/p/${receivedPostData.post.postId}/edit`;
    });

    $('#post-remove-button').click(function() {
        alertify
            .okBtn("Удалить")
            .cancelBtn("Отмена")
            .confirm('Вы уверены что хотите удалить этот пост?', () => {
                let removeAjax = $.ajax({
                    method: 'post',
                    url: `/p/${receivedPostData.post.postId}/remove`,
                });

                removeAjax.done(() => {
                    window.location.href = `/user/${receivedPostData.username}`;
                });

                removeAjax.fail(() => {
                    $.notify('Произошла ошибка при удалении.');
                });
            });
    });

    // set default locale to russian
    moment.locale('ru');

    $.trim('.received-post-data-script');
});

let map;
let placesService;
let directionsService;
let directionsDisplay;
let markerInfoWindow;

const waypoints = [];
const markers = [];

var initMap = () => {
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
    let imagesSelector = '.waypoint-cards p img, .meta-body img';
    let images = $(imagesSelector);
    images.addClass('w-100 h-100');
    images.attr('title', 'Открыть в просмотрщике фотографий.');
    images.css('cursor', 'pointer');
    tippy(imagesSelector);

    // create and attach image viewer to photos
    initImageViewer(images);
};

var generateWaypointCardHTML = (marker) => {
    return `
        <div id="${marker.cardId}" class="waypoint-card rounded">
            <div class="waypoint-card-header d-flex flex-row align-items-center">
                <div class="waypoint-card-header-input"></div>
                <button class="waypoint-card-header-icon show-on-map-button" type="button" title="Сфокусировать карту на этом маркере.">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            </div>
            <hr class="card-divider">
            <div class="waypoint-card-body">
                <div class="waypoint-card-body-editor"></div>
            </div>
        </div>
    `;
};

var createWaypointCard = async (marker) => {
    await new Promise(resolve => {
        let cardHtml = generateWaypointCardHTML(marker);
        let cardDOMElement = $($.parseHTML(cardHtml));

        $('.waypoint-cards').append(cardDOMElement);

        // button for focusing on marker
        $(`#${marker.cardId} .show-on-map-button`).click(() => {
            focusMap(marker);
        });

        resolve();
    });
};

// info window for showing marker address
let showInfoWindow = (marker) => {
    // let content = `<div class="d-flex align-items-center">${marker.cardName}</div>`;
    let content = `
        <div class="d-flex align-items-center">
            <button id="${marker.cardId}-go-to-card-button" class="" type="button" onclick="$(window).scrollTop($('#${marker.cardId}').offset().top-5); $('#${marker.cardId}').animateCss('flash', () => {})" style="background-color: transparent; border: none;" title="Переместиться к карточке."><i class="fas fa-search"></i></button>
            ${marker.cardName}
        </div>
    `;

    markerInfoWindow.close();
    markerInfoWindow.setOptions({content: content});
    markerInfoWindow.open(map, marker);
};

let addEventListeners = (marker) => {
    // show tooltip with location name
    marker.addListener('click', () => {
        showInfoWindow(marker);
    });
};

var generateMetaCard = () => {
    let metaCardHTML = `
        <div class="waypoint-card meta-card rounded w-100">
            <div class="waypoint-card-header card-bg-hover d-flex flex-column">
                <div class="waypoint-card-header-input meta-title">Meta title</div>
                <div class="waypoint-card-header-input meta-subtitle">Meta subtitle</div>
            </div>
            <hr class="card-divider">
            <div class="waypoint-card-body">
                <div class="form-control waypoint-card-body-editor meta-body"></div>
            </div>
            <hr class="card-divider">
            <div class="meta-card-footer d-flex flex-column">
                <div class="card-bg-hover d-flex flex-row align-items-center p-2">
                    <button class="default-button meta-like-button"><i class="far fa-heart faa-pulse-hover"></i></button><span class="meta-like-counter">0</span>
                    <span title="Количество <b>уникальных</b> просмотров заметки.">
                        <i class="fas fa-eye ml-2 mr-1"></i><span class="meta-views-counter">0</span>
                    </span>
                </div>
                <hr class="card-divider">
                <div class="d-flex flex-row align-items-center align-items-stretch">
                    <a class="meta-card-footer-item card-bg-hover meta-author-profile-link mr-auto d-flex flex-row align-items-center">
                        <div class="rounded-circle avatar-placeholder mr-2"></div>
                    </a>
                    <div class="meta-card-footer-item card-bg-hover d-flex flex-column">
                        <div class="d-flex flex-row align-items-center mb-3">
                            <div class="meta-date"></div>
                        </div>
                        <div class="meta-country mr-2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    let metaCardDOMElement = $($.parseHTML(metaCardHTML));
    $('.waypoint-cards').append(metaCardDOMElement);

    autosize($('.meta-subtitle'));

    tippy('[title]');
};

var loadData = (data) => {

    // set page title to post title
    document.title = data.post.title;

    $('.meta-title').html(data.post.title);
    $('.meta-subtitle').html(data.post.subtitle);
    $('.meta-body').html(he.decode(data.post.body));

    /* counters */
    $('.meta-views-counter').html(data.post.uniqIpsVisited);
    $('.meta-like-counter').html(data.post.likes);

    /* like-button functional */
    let likeButton = $('.meta-like-button');
    if (data.post.currentUserLiked) {
        likeButton.find('i').removeClass('far').addClass('fas');
    }

    likeButton.click(function() {
        let self = this;

        let likeAjax = $.ajax({
            method: 'post',
            url: `/p/${data.post.postId}/like`,
        });

        likeAjax.done((data) => {
            $('.meta-like-counter').html(data.likes.length);
            if (data.userJustLiked) {
                $(self).find('[data-fa-i2svg]').removeClass('far').addClass('fas');
            } else {
                $(self).find('[data-fa-i2svg]').removeClass('fas').addClass('far');
            }
        });

        likeAjax.fail((xhr) => {
            $.notify(xhr.responseText, 'error');
        });
    });

    /* time and date */
    let postedMoment = moment(data.post.postedAt);

    $('.meta-date').html(postedMoment.fromNow());
    $('.meta-date').prop('title', postedMoment.format('Do MMMM YYYY в kk:m'));
    tippy('.meta-date');

    /* countries */
    let countriesHTML = '';
    for (let i = 0; i < data.countries.length; i++) {
        let country = data.countries[i];
        countriesHTML += `<a href="/${country.id}">${country.name}</a>`;
        if (i != data.countries.length-1) countriesHTML += ', ';
    }
    $('.meta-country').html(countriesHTML);

    /* post author */
    let authorProfileLink = $('.meta-author-profile-link');
    authorProfileLink.append(data.username);
    authorProfileLink.attr('href', '/user/' + data.username);

    let authorAvatar = $('.avatar-placeholder');
    if (data.userAvatarPath) {
        authorAvatar.css('background-image', `url(${data.userAvatarPath})`);
    } else {
        authorAvatar.append('<i class="user-no-avatar-icon fas fa-user align-middle"></i>');
    }

    data.post.markers.sort((a, b) => {
        return a.positionIndex - b.positionIndex;
    });

    data.post.markers.forEach(marker => {
        // prepare position
        let unpreparedPosition = marker['position'];
        unpreparedPosition = marker['position'].slice(1, marker['position'].length-1);
        let splittedPosition = unpreparedPosition.split(',');
        let position = new google.maps.LatLng(Number(splittedPosition[0]), Number(splittedPosition[1]));

        let positionIndex = marker.positionIndex;
        let cardId = marker.cardId;
        let header = marker.header;
        let body = marker.body;

        marker = new google.maps.Marker({
            map: map,
            draggable: false,
            // animation: google.maps.Animation.DROP,
            position: position,
        });

        initMarker(marker, {
            cardId: cardId
        });

        addEventListeners(marker);

        createWaypointCard(marker);

        // update card header`s input
        marker.cardName = header;
        let headerInputElement = $(`#${marker.cardId} .waypoint-card-header-input`);
        headerInputElement.html(marker.cardName);

        if(body) {
            let bodyData = body;
            console.dir(bodyData);
            console.dir(he.decode(body));
            $(`#${cardId} .waypoint-card-body-editor`).html(he.decode(body));
        }
    });

    recreateMapFocusWaypoints();

    if (data.voteAttached) {
        // create main vote card
        createVoteCard();

        // find main vote card for further manipulations
        let voteCard = $('.vote-card');

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

var createVoteCard = () => {
    let voteCardHTML = `
        <div class="waypoint-card vote-card rounded">
            <div class="waypoint-card-header d-flex flex-row align-items-center">
                <div class="vote-card-header-input"></div>
            </div>
            <hr class="card-divider">
            <div class="waypoint-card-body"></div>
        </div>
    `;

    $('#cards').append(voteCardHTML);
};

var createVoteInteractions = (options) => {
    let voteCardBody = $('.vote-card > .waypoint-card-body');
    voteCardBody.append('<div class="vote-interaction-buttons"></div>');
    voteCardBody = $('.vote-card .waypoint-card-body .vote-interaction-buttons');

    options.forEach(option => {
        let optionHTML = `
            <div class="d-flex flex-row align-items-center">
                <button class="mr-1 align-self-center" style="background-color: transparent; outline: none; border: none;"><i class="far fa-square"></i></button>
                <div class="vote-card-body-input">${option.title}</div>
            </div>
        `;

        let voteBtn = $(optionHTML)

        voteBtn.click(function() {
            $('.vote-card > .waypoint-card-body').find('[data-fa-i2svg]').removeClass('fa-check-square').addClass('fa-square');
            $(this)
                .find('[data-fa-i2svg]')
                .removeClass('fa-square')
                .addClass('fa-check-square');

            $('.vote-card .waypoint-card-body div').removeClass('vote-option-active');
            voteBtn.addClass('vote-option-active');
        });

        voteBtn.data('vote-option-id', option.id);

        voteCardBody.append(voteBtn);
    });

    let voteBtnHTML = `
        <button class="default-button vote-button rounded mt-2">Проголосовать</button>
    `;
    let voteBtn = $(voteBtnHTML);

    voteBtn.click(function() {
        let currentVoteOptionId = $('.vote-card .waypoint-card-body .vote-option-active').data('vote-option-id');
        // voteCardBody.empty();
        $('.vote-card .waypoint-card-body .vote-interaction-buttons').remove();
        sendVoteRequest(receivedPostData.post.voteId, currentVoteOptionId);
    });

    voteCardBody.append(voteBtn);
};

var sendVoteRequest = (voteId, optionId) => {
    let voteAjax = $.ajax({
        method: 'post',
        url: `/v/${voteId}/${optionId}`
    });

    voteAjax.done((data) => {
        $.notify('Ваш голос учтен.');
        updateVoteChart(data.vote);
    });

    voteAjax.fail((xhr, status) => {
        $.notify(xhr.responseText);
    });
};

var voteChart;

var createVoteChart = (vote) => {
    $('.vote-card .waypoint-card-body').append('<canvas id="vote-chart" class="mb-3" width="100%" height="50%"></canvas>');

    // create chart
    let ctx = document.getElementById("vote-chart").getContext('2d');
    voteChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        }
    });

    // clear local data and replace with data from server
    voteChart.data.labels = [];
    voteChart.data.datasets[0].data = [];

    vote.options.forEach((option) => {
        // update vote chart data
        voteChart.data.labels.push(option.title);
        voteChart.data.datasets[0].data.push(option.voteCount);
    });

    voteChart.update();
};

var updateVoteChart = (vote) => {
    voteChart.data.labels = [];
    voteChart.data.datasets[0].data = [];

    vote.options.forEach((option) => {
        // update vote chart data
        voteChart.data.labels.push(option.title);
        voteChart.data.datasets[0].data.push(option.voteCount);
    });

    voteChart.update();
};

var initImageViewer = (images) => {
    let imageContainer = $('<ul></ul>');

    let html = '<ul>';
    for(let i = 0; i < images.length; i++) {
        let image = images[i];
        html += '<li>'
        html += `<img src="${$(image).attr('src')}">`;
        html += '</li>';
    }
    html += '</ul>'

    let viewer = new Viewer($(html)[0]);

    for(let i = 0; i < images.length; i++) {
        let image = images[i];
        $(image).click(() => {
            viewer.view(i);
            viewer.show();
        });
    }
};
