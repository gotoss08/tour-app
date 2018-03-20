$(document).ready(() => {
    $('#post-save-button').click(function() {
        if (!validateVote(true)) return false;
        $('.notifyjs-wrapper').trigger('notify-hide');

        let data = prepareData();

        let self = this;
        let prevHTML = $(self).html();

        let buttonSending = () => {
            $(self).html('<i class="fas fa-spinner"></i>');
            $(self).children('i').addClass('spinner-rotation');
            $(self).attr('disabled', true);
        };

        let buttonReceived = () => {
            $(self).html(prevHTML);
            $(self).attr('disabled', false);
        };

        let request = $.ajax({
            url: `/p/${receivedPostData.post.postId}/update`,
            method: 'post',
            data: data
        });

        buttonSending();

        removeAllMarkers();

        request.done((data, status) => {
            $.notify('Данные успешно сохранены на сервере.', 'success')
            $(self).attr('disabled', false);
            loadData(data);
        });

        request.fail((xhr, status) => {
            $.notify('Ошибка при отправке данных на сервер.', 'error')
        });

        request.always(() => {
            buttonReceived();
        });
    });

    $('#post-publish-button').click(function() {
        if (!validateData()) return false;

        let data = prepareData();

        data.posted = true;

        let self = this;
        let prevHTML = $(self).html();

        let buttonSending = () => {
            $.notify('Button click');
            $(self).html('<i class="fas fa-spinner"></i>');
            $(self).children('i').addClass('spinner-rotation');
            $(self).attr('disabled', true);
        };

        let buttonReceived = () => {
            $(self).html(prevHTML);
            $(self).attr('disabled', false);
        };

        let request = $.ajax({
            url: `/p/${receivedPostData.post.postId}/update`,
            method: 'post',
            data: data
        });

        buttonSending();

        removeAllMarkers();

        request.done((data, status) => {
            $.notify('[send to server] was ' + status, 'success')
            $(self).attr('disabled', false);
            window.location.replace('/p/' + receivedPostData.post.postId);
        });

        request.fail((xhr, status) => {
            $.notify('[send to server] was ' + status, 'danger')
        });

        request.always(() => {
            buttonReceived();
        });
    });
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
    // create map
    map = createMap();

    // create geocoding service
    geocoder = createGeocoderService();

    // create places service
    placesService = createPlacesService();

    // init routing service
    directionsService = createDirectionsService();
    directionsDisplay = createDirectionsDisplay();

    // create basic info window
    markerInfoWindow = createMarkerWindow();

    // handle left click event
    map.addListener('click', (e) => {
        (async () => {
            await createMarker(e.latLng);
        })();
    });

    // create card for vote creation
    createAddVoteCard();

    // create card for meta info
    generateMetaCard();

    // fill all fields with data loaded from server
    loadData(receivedPostData);
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
            <hr class="card-divider">
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

        // body editor input changed -> recreate map focus waypoints
        let bodyEditorElement = $(`#${marker.cardId} .waypoint-card-body-editor`);
        console.dir(bodyEditorElement);
        bodyEditorElement.change(() => recreateMapFocusWaypoints());

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
            <hr class="card-divider">
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
    let metaTitle = $('.meta-title').val();
    if (metaTitle && metaTitle.trim()) data.title = metaTitle.trim();

    let metaSubtitle = $('.meta-subtitle').val();
    if (metaSubtitle && metaSubtitle.trim()) data.subtitle = metaSubtitle.trim();

    let metaBody = MediumEditor.getEditorFromElement($('.meta-body').get(0)).getContent();
    if (metaBody) data.body = metaBody;

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

        let markerHeader = $(`#${cardId} .waypoint-card-header-input`).val();
        if (markerHeader && markerHeader.trim()) dataMarker.header = markerHeader.trim();
        else dataMarker.header = '';

        let markerBody = MediumEditor.getEditorFromElement($(`#${cardId} .waypoint-card-body-editor`).get(0)).getContent();
        if (markerBody) dataMarker.body = markerBody;
        else dataMarker.body = '';

        data.markers.push(dataMarker);
    }

    /* vote */
    if ($('.vote-card-active').length) {
        data.vote = {};

        let voteTitle = $('.vote-card-active .vote-card-header-input').val();
        if(voteTitle && voteTitle.trim()) data.vote.title = voteTitle.trim();

        let voteOptionElements = $('.vote-card-active .waypoint-card-body').find('.vote-card-body-input');
        if (voteOptionElements.length) {
            data.vote.options = [];

            voteOptionElements.each((index, element) => {
                let optionTitle = $(element).val();
                if(optionTitle && optionTitle.trim()) {
                    optionTitle = optionTitle.trim();

                    data.vote.options.push({
                        title: optionTitle
                    });
                }
            });
        }
    }

    /* countries */
    data.countries = [];
    markers.forEach((marker) => {
        if (data.countries.indexOf(marker.country) == -1) data.countries.push(marker.country);
    });

    return data;
};

var loadData = (data) => {

    $('.meta-title').val(data.post.title);
    $('.meta-subtitle').val(data.post.subtitle);
    MediumEditor
        .getEditorFromElement($('.meta-body').get(0))
        .setContent(he.decode(data.post.body));

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

    if (data.voteAttached) {
        // create main vote card
        createVoteCard();

        // find main vote card for further manipulations
        let voteCard = $('.vote-card-active');

        // set vote header
        voteCard.find('.vote-card-header-input').val(data.vote.title);

        // remove autogenerated vote option fields
        voteCard.find('.waypoint-card-body').empty();
        data.vote.options.forEach(option => {
            createVoteOption(option.title);
        });
        // create empty vote option field at the bottom
        createVoteOption();
    }

    calcRoute();
};

var validateData = () => {
    $('.notifyjs-wrapper').trigger('notify-hide');

    let errors = false;

    let showEmptyError = (element) => {
        element.notify('Это поле не может быть пустым.', {position: 'right', autoHide: false, className: 'error'});
        errors = true;
    };

    let metaTitle = $('.meta-card .meta-title');
    if (!metaTitle.val() && !metaTitle.val().trim()) showEmptyError(metaTitle);

    let metaSubtitle = $('.meta-card .meta-subtitle');
    if (!metaSubtitle.val() && !metaSubtitle.val().trim()) showEmptyError(metaSubtitle);

    let metaBody = $('.meta-card .waypoint-card-body-editor');
    let metaBodyContent = striptags(MediumEditor.getEditorFromElement(metaBody.get(0)).getContent());
    if (!metaBodyContent) showEmptyError($(metaBody.get(0)));

    // if (data.markers.length < 1) return;
    $('.waypoint-cards .waypoint-card:not(.meta-card)').each((index, element) => {


        let header = $(element).find('.waypoint-card-header-input');
        if (!header.val() && !header.val().trim()) showEmptyError(header);

        let body = $(element).find('.waypoint-card-body-editor');
        let bodyContent = striptags(MediumEditor.getEditorFromElement(body.get(0)).getContent());
        if (!bodyContent) showEmptyError($(body.get(0)));
    });

    let voteCard = $('.vote-card-active');
    if (voteCard.length) {
        let voteHeader = voteCard.find('.vote-card-header-input');
        if (!voteHeader.val() && !voteHeader.val().trim()) {
            voteHeader.notify('Тема голосования не может быть пустой.', {position: 'right', className: 'error', autoHide: false});
            errors = true;
        }

        let voteOptions = voteCard.find('.vote-card-body-input');
        let filledVoteOptions = 0;
        voteOptions.each((index, element) => {
            let optionValue = $(element).val();
            if (optionValue && optionValue.trim()) filledVoteOptions += 1;
        });
        if (filledVoteOptions < 2) {
            voteCard.find('.waypoint-card-body').notify('Не может быть меньше 2 вариантов голосования.', {position: 'right', className: 'error', autoHide: false});
            errors = true;
        };
    }

    if (!validateVote()) errors = true;

    if (errors) {
        $.notify('У вас имеются незаполненные поля.', 'error');
        return false;
    }

    return true;
};

var validateVote = (showNotifications) => {
    let voteCard = $('.vote-card-active');
    if (voteCard.length) {
        let voteHeader = voteCard.find('.vote-card-header-input');
        if (!voteHeader.val() && !voteHeader.val().trim()) {
            voteHeader.notify('Тема голосования не может быть пустой.', {position: 'right', className: 'error', autoHide: false});
            return false;
        }

        let voteOptions = voteCard.find('.vote-card-body-input');
        let filledVoteOptions = 0;
        voteOptions.each((index, element) => {
            let optionValue = $(element).val();
            if (optionValue && optionValue.trim()) filledVoteOptions += 1;
        });
        if (filledVoteOptions < 2) {
            voteCard.find('.waypoint-card-body').notify('Не может быть меньше 2 вариантов голосования.', {position: 'right', className: 'error', autoHide: false});
            return false;
        };
    }

    return true;
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

var createVoteOption = (value='', placeholder='Вариант голосования...') => {
    let html = `
        <div class="d-flex flex-row align-items-center">
            <i class="far fa-square mr-1"></i>
            <input class="vote-card-body-input" type="text" ${value ? `value="${value}"` : ''}placeholder="${placeholder}">
        </div>
    `;

    $('.vote-card > .waypoint-card-body').children().last().off();
    $('.vote-card > .waypoint-card-body').append(html);
    $('.vote-card > .waypoint-card-body').children().last().change(() => createVoteOption());
};

var createVoteCard = ( ) => {
    $('.vote-card').remove();

    let html = `
        <div class="waypoint-card vote-card vote-card-active rounded">
            <div class="waypoint-card-header d-flex flex-row align-items-center">
                <input class="vote-card-header-input" type="text" placeholder="Тема голосования...">
                <span title="Внимание! После публикации вы не сможете изменить тему или варианты голосования без сброса количества голосов!"><i class="waypoint-card-header-icon fas fa-exclamation-circle mr-1"></i></span>
                <button class="waypoint-card-header-icon" type="button" onclick="createAddVoteCard();" title="Убрать голосование">
                    <i class="far fa-trash-alt mr-1" style="color: red;"></i>
                </button>
            </div>
            <hr class="card-divider">
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

    tippy('[title]');

    $('.vote-card > .waypoint-card-body').children().last().change(function() {
        createVoteOption();
    });
};
