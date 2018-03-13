$(document).ready(() => {
    $.notify.defaults({
        globalPosition: 'bottom left',
        className: 'info',
    });

    $('#post-edit-button').click(function() {
        window.location.replace(`/p/${receivedPostData.post.postId}/edit`);
    });

    generateMetaCard();

    loadData(receivedPostData);

    // createVoteCard();
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
};

var generateWaypointCardHTML = (marker) => {
    return `
        <div id="${marker.cardId}" class="waypoint-card rounded">
            <div class="waypoint-card-header d-flex align-items-center">
                <input class="waypoint-card-header-input" type="text" placeholder="Название точки маршрута..." disabled="disabled">
                <button class="waypoint-card-header-icon show-on-map-button" type="button" title="Сфокусировать карту на этом маркере.">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            </div>
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

        // card`s header input any change detected -> update card name
        let headerElement = $(`#${marker.cardId} .waypoint-card-header-input`);
        headerElement.change(() => {
            if (headerElement.val()) {
                updateCardName(marker, headerElement.val().trim());
            }
        });

        // button for focusing on marker
        $(`#${marker.cardId} .show-on-map-button`).click(() => {
            focusMap(marker);
        });

        resolve();
    });
};

// info window for showing marker address
let showInfoWindow = (marker) => {
    let content = `<div class="d-flex align-items-center">${marker.cardName}</div>`;

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
        <div class="waypoint-card meta-card rounded">
            <div class="waypoint-card-header d-flex flex-column">
                <div class="waypoint-card-header-input meta-title"></div>
                <div class="waypoint-card-header-input meta-subtitle"></div>
            </div>
            <div class="waypoint-card-body">
                <div class="form-control waypoint-card-body-editor meta-body"></div>
            </div>
        </div>
    `;
    let metaCardDOMElement = $($.parseHTML(metaCardHTML));
    $('.waypoint-cards').append(metaCardDOMElement);

    autosize($('.meta-subtitle'));

    tippy('[title]');
};

var loadData = (data) => {

    $('.meta-title').html(data.post.title);
    $('.meta-subtitle').html(data.post.subtitle);
    $('.meta-body').html(he.decode(data.post.body));

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
        let voteCard = $('.vote-card-active');

        // set vote header
        voteCard.find('.vote-card-header-input').html(data.vote.title);

        // remove autogenerated vote option fields
        voteCard.find('.waypoint-card-body').empty();
        data.vote.options.forEach(option => {
            createVoteOption(option.title);
        });
    }

    calcRoute();
};

var createVoteOption = (value) => {
    let html = `
        <div class="d-flex flex-row align-items-center">
            <i class="far fa-square mr-1"></i>
            <div class="vote-card-body-input">${value}</div>
        </div>
    `;

    $('.vote-card > .waypoint-card-body').append(html);
};

var createVoteCard = () => {
    let html = `
        <div class="waypoint-card vote-card vote-card-active rounded">
            <div class="waypoint-card-header d-flex flex-row align-items-center">
                <div class="vote-card-header-input"></div>
            </div>
            <div class="waypoint-card-body"></div>
        </div>
    `;

    $('#cards').append(html);
};

