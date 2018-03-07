$(document).ready(() => {
    $.notify.defaults({
        globalPosition: 'bottom left',
        className: 'info',
    });

    $('#post-publish-button').click(function() {
        let data = prepareData();
        if (data.markers.length < 1) return;

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

let convertHeadersToTagLinks = () => {
    $('.medium-editor-element h1, h2, h3, h4, h5, h6').addClass('adf');
};

let initEditorAndTooltips = (marker) => {
    let editor = new MediumEditor('.waypoint-card-body-editor', {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Начните печатать...',
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3'],
        },
    });

    marker.editor = editor;

    tippy('[title]');
};

let generateWaypointCardHTML = (marker) => {
    return `
        <div id="${marker.cardId}-chain" class="waypoint-card-chain"><i class="fas fa-arrow-down"></i></div>
        <div id="${marker.cardId}" class="waypoint-card twinPeaks rounded">
            <h3 class="waypoint-card-header d-flex align-items-center">
                <input class="waypoint-card-header-input" type="text" placeholder="Название точки маршрута...">
                <button class="show-on-map-button" type="button"  title="Сфокусировать карту на этом маркере.">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="reset-location-button" type="button" title="Сбросить текущее название точки маршрута, и установить исходя из геолокации.">
                    <i class="fas fa-redo-alt"></i>
                </button>
            </h3>
            <div class="waypoint-card-body">
                <textarea class="form-control waypoint-card-body-editor" name="body"></textarea>
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
        console.log('creating waypoint card ' + marker.cardId);

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
            $(window).scrollTop(0);
            map.setZoom(18);
            map.panTo(marker.getPosition());
            showInfoWindow(marker);
        });

        // button for reseting card`s name to geolocated one
        $(`#${marker.cardId} .reset-location-button`).click(() => {

            if (!marker.locationName) {
                geocodeAddress(marker);
            }

            updateCardName(marker, marker.locationName);
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
    console.log('removing waypoint card ' + marker.cardId);
    $(`#${marker.cardId}, #${marker.cardId}-chain`).remove();
};

let getTotalCountryList = () => {
    const countries = [];

    markers.forEach((marker) => {
        if (countries.indexOf(marker.country) == -1) countries.push(marker.country);
    });

    $.notify(JSON.stringify(countries));

    return countries;
};

var prepareData = () => {
    let countries = getTotalCountryList();

    let data = {};
    data.markers = [];

    for(let i = 0; i < markers.length; i++) {
        let marker = markers[i];

        let dataMarker = {};

        dataMarker.positionIndex = i;

        let markerPosition = marker.getPosition().toString();
        dataMarker.position = markerPosition;

        let cardId = marker.cardId;
        dataMarker.cardId = cardId;

        let headerInputValue = $(`#${cardId} .waypoint-card-header-input`).val().trim();
        dataMarker.header = headerInputValue;

        let bodyEditorContent = $(`#${cardId} .waypoint-card-body-editor`).html().trim();
        dataMarker.body = bodyEditorContent;

        data.markers.push(dataMarker);
    }

    return data;
};

var loadData = (data) => {
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
            $(`#${cardId} .waypoint-card-body-editor`).removeClass('medium-editor-placeholder').html(he.decode(body));
        }
    });

    calcRoute();
};

var validateData = () => {
    $('.waypoint-cards').each((index, element) => {
        console.log(element.html());
    });
};