$(document).ready(() => {
    $.notify.defaults({
        globalPosition: 'bottom left',
        className: 'info',
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
                <div class="d-flex align-items-center justify-content-end">
                    <span class="waypoint-card-body-editor-help" title="<ul style='text-align: left; padding: 0; margin: 0; margin-left: 16px;'><li>При выделении текста, появляется меню редактора, в котором можно применить разные стили к выделенному фрагменту текста.</li><li>После публикации, заголовки так же будут обработаны и добавлены в виде тэгов.</li><li>Чтобы загрузить фотографию, просто перетащите её на текст в том месте, где вы хотите что бы она оказалась.</li></ul>">Помощь по редактированию <i class="fas fa-question-circle"></i></span>
                </div>
                <small id="post-body-main-error" class="form-text text-danger"></small>
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
                <input class="waypoint-card-header-input meta-title" type="text" placeholder="Title..." disabled="disabled">
                <textarea class="waypoint-card-header-input meta-subtitle" placeholder="Subtitle..." disabled="disabled"></textarea>
            </div>
            <div class="waypoint-card-body">
                <textarea class="form-control waypoint-card-body-editor meta-body" disabled="disabled"></textarea>
                <div class="d-flex align-items-center justify-content-end">
                    <span class="waypoint-card-body-editor-help" title="<ul style='text-align: left; padding: 0; margin: 0; margin-left: 16px;'><li>При выделении текста, появляется меню редактора, в котором можно применить разные стили к выделенному фрагменту текста.</li><li>После публикации, заголовки так же будут обработаны и добавлены в виде тэгов.</li><li>Чтобы загрузить фотографию, просто перетащите её на текст в том месте, где вы хотите что бы она оказалась.</li></ul>">Помощь по редактированию <i class="fas fa-question-circle"></i></span>
                </div>
                <small id="post-body-main-error" class="form-text text-danger"></small>
            </div>
        </div>
    `;
    let metaCardDOMElement = $($.parseHTML(metaCardHTML));
    $('.waypoint-cards').append(metaCardDOMElement);

    autosize($('.meta-subtitle'));

    tippy('[title]');
};

var loadData = (data) => {

    $('.meta-title').val(data.title);
    $('.meta-subtitle').val(data.subtitle);
    $('.meta-body').val(he.decode(data.body));

    data.markers.sort((a, b) => {
        return a.positionIndex - b.positionIndex;
    });

    data.markers.forEach(marker => {
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
        headerInputElement.val(marker.cardName);

        if(body) {
            let bodyData = body;
            console.dir(bodyData);
            console.dir(he.decode(body));
            $(`#${cardId} .waypoint-card-body-editor`).html(he.decode(body));
        }
    });

    recreateMapFocusWaypoints();

    calcRoute();
};

var createVoteCard = () => {
    $('.vote-card').remove();
    let html = `
        <div class="waypoint-card vote-card vote-card-active rounded">
            <div class="waypoint-card-header d-flex flex-row align-items-center">
                <input class="vote-card-header-input" type="text" placeholder="Тема голосования...">
                <i class="waypoint-card-header-icon fas fa-exclamation-circle mr-1" title="Внимание! После публикации вы не сможете изменить тему или варианты голосования без сброса количества голосов!"></i>
                <button class="waypoint-card-header-icon" type="button" onclick="createAddVoteCard();" title="Убрать голосование">
                    <i class="far fa-trash-alt mr-1" style="color: red;"></i>
                </button>
            </div>
            <div class="waypoint-card-body">
                <div class="d-flex flex-row align-items-center">
                    <i class="far fa-square mr-1"></i>
                    <input class="vote-card-body-input" type="text" placeholder="Вариант голосования...">
                </div>
                <div class="d-flex flex-row align-items-center">
                    <i class="far fa-square mr-1"></i>
                    <input class="vote-card-body-input" type="text" placeholder="Вариант голосования...">
                </div>
                <div class="d-flex flex-row align-items-center">
                    <i class="far fa-square mr-1"></i>
                    <input class="vote-card-body-input" type="text" placeholder="Вариант голосования...">
                </div>
            </div>
        </div>
    `;
    $('#cards').append(html);
    tippy('.vote-card .waypoint-card-header .waypoint-card-header-icon');

    let createVoteOption = () => {
        let html = `
            <div class="d-flex flex-row align-items-center">
                <i class="far fa-square mr-1"></i>
                <input class="vote-card-body-input" type="text" placeholder="Вариант голосования...">
            </div>
        `;

        $('.vote-card > .waypoint-card-body').children().last().off();

        $('.vote-card > .waypoint-card-body').append(html);

        $('.vote-card > .waypoint-card-body').children().last().change(function() {
            createVoteOption();
        });
    };

    $('.vote-card > .waypoint-card-body').children().last().change(function() {
        createVoteOption();
    });
};

