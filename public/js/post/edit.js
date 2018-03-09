$(document).ready(() => {
    $.notify.defaults({
        globalPosition: 'bottom left',
        className: 'info',
    });

    $('#post-publish-button').click(function() {
        validateData();

        let data = prepareData();

        let self = this;
        let prevHTML = $(self).html();

        let buttonSending = () => {
            $.notify('Button click');
            $(self).html('<i class="fas fa-spinner"></i> Sending...');
            $(self).children('i').addClass('spinner-rotation');
            $(self).attr('disabled', true);
            $('#post-status').html('Sending...');
        };

        let buttonReceived = () => {
            $(self).html(prevHTML);
            $(self).attr('disabled', false);
            $('#post-status').html('');
        };

        let request = $.ajax({
            url: `/p/${receivedPostData.postId}/update`,
            method: 'post',
            data: data
        });

        buttonSending();

        removeAllMarkers();

        request.done((data, status) => {
            $.notify('send to server was ' + status, 'success')
            $(self).attr('disabled', false);
            $.notify('button ' + $(self).prop('disabled'));
            loadData(data);
        });

        request.fail((xhr, status) => {
            $.notify('send to server was ' + status, 'danger')
        });

        request.always(() => {
            buttonReceived();
        });
    });

    createAddVoteCard();

    generateMetaCard();

    loadData(receivedPostData);
});

let map;
let geocoder;
let placesService;
let directionsService;
let directionsDisplay;
let markerInfoWindow;

const waypoints = [];
const markers = [];

var initMap = () => {
    // init map
    map = new google.maps.Map($('#map').get(0), {
        center: {lat: 49.82081217632622, lng: 73.08635614723323},
        zoom: 20,
        gestureHandling: 'greedy',
    });

    // init geocoding service
    geocoder = new google.maps.Geocoder();

    // places service
    placesService = new google.maps.places.PlacesService(map);

    // init routing service
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true,
        preserveViewport: true,
    });
    directionsDisplay.setMap(map);

    // create basic info window
    markerInfoWindow = new google.maps.InfoWindow();

    // handle left click event
    map.addListener('click', (e) => {
        (async () => {
            await createMarker(e.latLng);
        })();
    });
};

let focusMap = (marker) => {
    map.setZoom(18);
    map.panTo(marker.getPosition());
    showInfoWindow(marker);
};

// info window for showing marker address
let showInfoWindow = (marker) => {
    let cardName = $(`#${marker.cardId} .waypoint-card-header-input`).val();
    let content = `
        <div class="d-flex align-items-center">
            <button id="${marker.cardId}-go-to-card-button" class="" type="button" onclick="$(window).scrollTop($('#${marker.cardId}').offset().top-5); $('#${marker.cardId}').animateCss('flash', () => {})" style="background-color: transparent; border: none;" title="Переместиться к карточке."><i class="fas fa-search"></i></button>
            ${cardName}
        </div>
    `;

    markerInfoWindow.close();
    markerInfoWindow.setOptions({content: content});
    markerInfoWindow.open(map, marker);

    tippy($(`#${marker.cardId}-go-to-card-button`).get(0), {
        placement: 'bottom',
    });
};

// geocode current address and assign it to marker
let geocodeAddress = async (marker, callback=undefined) => {
    let locationName;

    await new Promise(resolve => {
        geocoder.geocode({'location': marker.waypoint.location}, (results, status) => {
            if (status == 'OK') {
                // find current country
                results.forEach((result) => {
                    if (result.types.indexOf('country') > -1) marker.country = result.formatted_address;
                });

                locationName = results[0].formatted_address;

                placesService.nearbySearch({
                    location: marker.waypoint.location,
                    radius: '50',
                }, (results, status) => {
                    if (status == 'OK') {
                        results.forEach((result) => {
                            if (result.types.indexOf('point_of_interest') > -1) {
                                locationName = result.name + '(' + result.vicinity + ')';
                            }
                        });
                    }
                    resolve();
                });
            }
        });
    }).then(() => {
        if(marker.cardName == marker.locationName) updateCardName(marker, locationName);

        marker.locationName = locationName;

        if(callback) callback();
    });
};

let removeMarker = async (marker) => {
    markers.splice(markers.indexOf(marker), 1);
    waypoints.splice(waypoints.indexOf(marker.waypoint), 1);
    marker.setMap(null);
    removeWaypointCard(marker);
    marker = null;
    recreateMapFocusWaypoints();
    if (waypoints.length < 2) {
        directionsDisplay.setMap(null);
    } else {
        await calcRoute();
    }
};

let removeAllMarkers = () => {
    markers.forEach((marker) => {
        marker.setMap(null);
        removeWaypointCard(marker);
        marker = null;
    });

    markers.length = 0;
    waypoints.length = 0;

    directionsDisplay.setMap(null);

    $.notify('All markers removed');
};

let initMarker = (marker, options={}) => {
    marker.locationNames = [];

    if (!options.cardId) options.cardId = '_' + Math.random().toString(36).substr(2, 9);
    if (options.locationName) {
        marker.locationName = options.locationName;
        marker.locationNames = [options.locationName];
    }

    marker.waypoint = {location: marker.getPosition()};
    marker.cardId = options.cardId;
    markers.push(marker);

    waypoints.push(marker.waypoint);
};

let addEventListeners = (marker) => {
    // show tooltip with location name
    marker.addListener('click', () => {
        showInfoWindow(marker);
    });

    // remove marker
    marker.addListener('rightclick', () => removeMarker(marker));

    // on drag start remove tooltip
    marker.addListener('dragstart', (e) => {
        if (markerInfoWindow) markerInfoWindow.close();
    });

    // on drag end recalculate path
    marker.addListener('dragend', (e) => {
        marker.waypoint.location = e.latLng;
        calcRoute();
        geocodeAddress(marker);
    });
};

let createMarker = async (latLng, options={}) => {
    let marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: latLng,
    });

    initMarker(marker, options);

    addEventListeners(marker);

    createWaypointCard(marker);

    recreateMapFocusWaypoints();

    console.log('started geocoding');
    await geocodeAddress(marker);
    console.log('finished geocoding');

    await calcRoute(marker.waypoint);
};

// method for calculating path between all waypoints
let calcRoute = async () => {
    if (waypoints.length >= 2) {
        let start = waypoints[0];
        waypoints.splice(0, 1);
        let finish = waypoints[waypoints.length-1];
        waypoints.splice(waypoints.length-1, 1);

        let request = {
            origin: start,
            destination: finish,
            waypoints: waypoints,
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.METRIC,
        };

        console.log('path start');

        await new Promise((resolve) => {
            directionsService.route(request, (result, status) => {
                console.log('path progress');

                if (status == 'OK') {
                    directionsDisplay.setMap(map);
                    directionsDisplay.setDirections(result);
                }

                waypoints.splice(0, 0, start);
                waypoints.splice(waypoints.length, 0, finish);

                console.log('path end');

                resolve();
            });
        });
    }
};

var convertHeadersToTagLinks = () => {
    let headersDOM = $('.medium-editor-element > h2, h3');
    for(let i = 0; i < headersDOM.length; i++) {
        let header = $(headersDOM[i]);
        let headerText = header.html();
        header.html($('<a></a>').attr('href', 'www.google.ru').text(headerText));
    }
};

let initEditorAndTooltips = (marker) => {
    let editor = new MediumEditor(`#${marker.cardId} .waypoint-card-body-editor`, {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Начните печатать...',
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3'],
        },
    });

    tippy('[title]');
};

let generateWaypointCardHTML = (marker) => {
    return `
        <div id="${marker.cardId}" class="waypoint-card rounded">
            <div class="waypoint-card-header d-flex align-items-center">
                <input class="waypoint-card-header-input" type="text" placeholder="Название точки маршрута...">
                <button class="waypoint-card-header-icon show-on-map-button" type="button" title="Сфокусировать карту на этом маркере.">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="waypoint-card-header-icon reset-location-button" type="button" title="Сбросить текущее название точки маршрута, и установить исходя из геолокации.">
                    <i class="fas fa-redo-alt"></i>
                </button>
                <button class="waypoint-card-header-icon remove-marker-button" type="button" title="Удалить маркер и карточку.">
                    <i class="far fa-trash-alt mr-1" style="color: red;"></i>
                </button>
            </div>
            <div class="waypoint-card-body">
                <textarea class="form-control waypoint-card-body-editor"></textarea>
                <div class="d-flex align-items-center justify-content-end">
                    <span class="waypoint-card-body-editor-help" title="<ul style='text-align: left; padding: 0; margin: 0; margin-left: 16px;'><li>При выделении текста, появляется меню редактора, в котором можно применить разные стили к выделенному фрагменту текста.</li><li>После публикации, заголовки так же будут обработаны и добавлены в виде тэгов.</li><li>Чтобы загрузить фотографию, просто перетащите её на текст в том месте, где вы хотите что бы она оказалась.</li></ul>">Помощь по редактированию <i class="fas fa-question-circle"></i></span>
                </div>
                <small id="post-body-main-error" class="form-text text-danger"></small>
            </div>
        </div>
    `;
};

let createWaypointCard = async (marker) => {
    await new Promise(resolve => {
        let cardHtml = generateWaypointCardHTML(marker);
        let cardDOMElement = $($.parseHTML(cardHtml));

        $('.waypoint-cards').append(cardDOMElement);

        initEditorAndTooltips(marker);

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

        // button for reseting card`s name to geolocated one
        $(`#${marker.cardId} .reset-location-button`).click(() => {

            if (!marker.locationName) {
                geocodeAddress(marker);
            }

            updateCardName(marker, marker.locationName);
        });

        // button for reseting card`s name to geolocated one
        $(`#${marker.cardId} .remove-marker-button`).click(() => {
            removeMarker(marker);
        });

        resolve();
    });
};

let updateCardName = (marker, cardName) => {
    // update marker location name
    marker.cardName = cardName;

    // update address info window content
    markerInfoWindow.setOptions({content: marker.cardName});

    // update card header`s input
    let headerInputElement = $(`#${marker.cardId} .waypoint-card-header-input`);
    headerInputElement.val(marker.cardName);
};

let removeWaypointCard = (marker) => {
    $(`#${marker.cardId}`).remove();
};

let generateMetaCard = () => {
    let metaCardHTML = `
        <div class="waypoint-card meta-card rounded">
            <div class="waypoint-card-header d-flex flex-column">
                <input class="waypoint-card-header-input meta-title" type="text" placeholder="Title...">
                <textarea class="waypoint-card-header-input meta-subtitle" placeholder="Subtitle..."></textarea>
            </div>
            <div class="waypoint-card-body">
                <textarea class="form-control waypoint-card-body-editor meta-body"></textarea>
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

    let editor = new MediumEditor(`.meta-card .waypoint-card-body-editor`, {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Общие впечатления, описание поездки...',
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3'],
        },
    });

    tippy('[title]');
};

var prepareData = () => {
    let data = {};

    /* base data */
    data.title = $('.meta-title').val();
    if (data.title) data.title = data.title.trim();

    data.subtitle = $('.meta-subtitle').val();
    if (data.subtitle) data.subtitle = data.subtitle.trim();

    data.body = MediumEditor.getEditorFromElement($('.meta-body').get(0)).getContent();

    /* markers */
    data.markers = [];

    for(let i = 0; i < markers.length; i++) {
        let marker = markers[i];

        let dataMarker = {};

        dataMarker.positionIndex = i;

        let markerPosition = marker.getPosition().toString();
        dataMarker.position = markerPosition;

        let cardId = marker.cardId;
        dataMarker.cardId = cardId;

        let headerInputValue = $(`#${cardId} .waypoint-card-header-input`).val();
        if (headerInputValue) headerInputValue = headerInputValue.trim();
        dataMarker.header = headerInputValue;

        dataMarker.body = MediumEditor
                            .getEditorFromElement($(`#${cardId} .waypoint-card-body-editor`).get(0))
                            .getContent();

        data.markers.push(dataMarker);
    }

    /* vote */
    if ($('.vote-card-active').length) {
        data.vote = {};

        let voteTitle = $('.vote-card-active .vote-card-header-input').val();
        if(voteTitle) {
            voteTitle = voteTitle.trim();
            data.vote.title = voteTitle;
        }

        let voteOptionsDOMElement = $('.vote-card-active .waypoint-card-body').find('.vote-card-body-input');
        if (voteOptionsDOMElement.length) {
            data.vote.options = [];
            voteOptionsDOMElement.each((index, element) => {
                let optionName = $(element).val();
                if(optionName && optionName.trim()) {
                    optionName = optionName.trim();
                    console.log('+++++++++++child ' + optionName);
                    data.vote.options.push({
                        name: optionName
                    });
                }
            });
        }
    }

    return data;
};

var loadData = (data) => {

    $('.meta-title').val(data.title);
    $('.meta-subtitle').val(data.subtitle);
    MediumEditor
        .getEditorFromElement($('.meta-body').get(0))
        .setContent(he.decode(data.body));

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
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: position,
        });

        initMarker(marker, {
            cardId: cardId
        });

        addEventListeners(marker);

        createWaypointCard(marker);

        marker.cardName = header;
        updateCardName(marker, header);

        geocodeAddress(marker, () => {});

        if(body) {
            MediumEditor
                .getEditorFromElement($(`#${cardId} .waypoint-card-body-editor`).get(0))
                .setContent(he.decode(body));
        }
    });

    recreateMapFocusWaypoints();

    calcRoute();
};

var getTotalCountryList = () => {
    const countries = [];

    markers.forEach((marker) => {
        if (countries.indexOf(marker.country) == -1) countries.push(marker.country);
    });

    $.notify(JSON.stringify(countries));

    return countries;
};

var validateData = () => {
    // if (data.markers.length < 1) return;
    $('.waypoint-card').each((index, element) => {
        // console.dir(element);
    });
};

var recreateMapFocusWaypoints = () => {
    markers.forEach((marker, index) => {
        let cardDOMElement = $(`#${marker.cardId}`);

        let addWaypoint = (offset) => {
            cardDOMElement.waypoint({
                handler: function(direction) {
                    focusMap(marker);
                },
                offset: offset,
            });
        };

        let toTop = cardDOMElement.offset().top;
        let viewportHeight = $(window).outerHeight();
        let containerHeight = $('.waypoint-cards').innerHeight();

        console.log('to top: ' + toTop);
        console.log('countainer height: ' + containerHeight);

        if (toTop + viewportHeight >= containerHeight) addWaypoint('85%');
        else addWaypoint(135);
    });
};

let createAddVoteCard = () => {
    $('.vote-card').remove();
    let html = `
        <div class="waypoint-card vote-card rounded">
            <div class="waypoint-card-header d-flex flex-row">
                <button class="btn w-100" onclick="createVoteCard();" title="<span style='text-align: center;'>Нажмите на эту кнопку, если хотите провести голосование среди ваших читателей. Голосование будет добавлено в самый конец.</span>">Добавить голосование</button>
            </div>
        </div>
    `;
    $('#cards').append(html);
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
