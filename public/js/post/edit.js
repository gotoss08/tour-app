'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function save() {
    var button = $('#post-save-button');
    var prevHTML = $(button).html();

    var buttonSending = function buttonSending() {
        $(button).html('<i class="fas fa-spinner"></i>');
        $(button).children('i').addClass('spinner-rotation');
        $(button).attr('disabled', true);
    };

    var buttonReceived = function buttonReceived() {
        $(button).html(prevHTML);
        $(button).attr('disabled', false);
    };

    buttonSending();

    // removeAllMarkers();

    var request = $.ajax({
        url: '/p/' + receivedPostData.post.postId + '/update',
        method: 'post',
        data: prepareData()
    });

    request.done(function (data, status) {
        $.notify('Сохранение прошло успешно.', 'success');
        $(button).attr('disabled', false);
        // loadData(data);
    });

    request.fail(function (xhr, status) {
        $.notify('Ошибка при сохранении.', 'error');
    });

    request.always(function () {
        buttonReceived();
    });
};

$(document).ready(function () {
    // post saving
    $('#post-save-button').click(save);

    setInterval(save, 30 * 1000);

    var postPublishButton = $('#post-publish-button');
    postPublishButton.click(function () {
        if (!validateData()) return false;

        var data = prepareData();

        data.posted = true;

        var self = this;
        var prevHTML = $(self).html();

        var buttonSending = function buttonSending() {
            $.notify('Button click');
            $(self).html('<i class="fas fa-spinner"></i>');
            $(self).children('i').addClass('spinner-rotation');
            $(self).attr('disabled', true);
        };

        var buttonReceived = function buttonReceived() {
            $(self).html(prevHTML);
            $(self).attr('disabled', false);
        };

        var request = $.ajax({
            url: '/p/' + receivedPostData.post.postId + '/update',
            method: 'post',
            data: data
        });

        buttonSending();

        removeAllMarkers();

        request.done(function (data, status) {
            $.notify('[send to server] was ' + status, 'success');
            $(self).attr('disabled', false);
            window.location.href = '/p/' + receivedPostData.post.postId;
        });

        request.fail(function (xhr, status) {
            $.notify('[send to server] was ' + status, 'danger');
        });

        request.always(function () {
            buttonReceived();
        });
    });

    var postHideButton = $('#post-hide-button');
    postHideButton.click(function () {
        var hideAjax = $.ajax({
            method: 'post',
            url: '/p/' + receivedPostData.post.postId + '/hide'
        });

        hideAjax.done(function () {
            postHideButton.hide();
            postPublishButton.show();

            $.notify('Заметка успешно скрыта.', 'success');
        });

        hideAjax.fail(function () {
            $.notify('Произошла ошибка во время скрытия заметки.', 'error');
        });
    });

    if (receivedPostData.post.posted) {
        postHideButton.show();
        postPublishButton.hide();
    } else {
        postHideButton.hide();
        postPublishButton.show();
    }

    $('#post-remove-button').click(function () {
        alertify.okBtn('Удалить').cancelBtn('Отмена').confirm('Вы уверены что хотите удалить этот пост?', function () {
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
});

var map = void 0;
var geocoder = void 0;
var placesService = void 0;
var directionsService = void 0;
var directionsDisplay = void 0;
var markerInfoWindow = void 0;

var waypoints = [];
var markers = [];

function initMap() {
    var _this = this;

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
    map.addListener('click', function (e) {
        _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _context.next = 2;
                            return createMarker(e.latLng);

                        case 2:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this);
        }))();
    });

    // create card for vote creation
    createAddVoteCard();

    if (!receivedPostData.mapHelpReadStatus) generateMapHelperCard();

    // create card for meta info
    generateMetaCard();

    // fill all fields with data loaded from server
    loadData(receivedPostData);
};

// info window for showing marker address
var showInfoWindow = function showInfoWindow(marker) {
    var cardName = $('#' + marker.cardId + ' .waypoint-card-header-input').val();
    var content = '\n        <div class="d-flex align-items-center">\n            <button id="' + marker.cardId + '-go-to-card-button" class="" type="button" onclick="$(window).scrollTop($(\'#' + marker.cardId + '\').offset().top-5); $(\'#' + marker.cardId + '\').animateCss(\'flash\', () => {})" style="background-color: transparent; border: none;" title="\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u043A \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435."><i class="fas fa-search"></i></button>\n            ' + cardName + '\n        </div>\n    ';

    markerInfoWindow.close();
    markerInfoWindow.setOptions({ content: content });
    markerInfoWindow.open(map, marker);

    tippy($('#' + marker.cardId + '-go-to-card-button').get(0), {
        placement: 'bottom'
    });
};

// geocode current address and assign it to marker
var geocodeAddress = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(marker) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var locationName;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        locationName = void 0;
                        _context2.next = 3;
                        return new Promise(function (resolve) {
                            geocoder.geocode({ 'location': marker.waypoint.location }, function (results, status) {
                                if (status == 'OK') {
                                    // find current country
                                    results.forEach(function (result) {
                                        if (result.types.indexOf('country') > -1) marker.country = result.formatted_address;
                                    });

                                    locationName = results[0].formatted_address;

                                    placesService.nearbySearch({
                                        location: marker.waypoint.location,
                                        radius: '50'
                                    }, function (results, status) {
                                        if (status == 'OK') {
                                            results.forEach(function (result) {
                                                if (result.types.indexOf('point_of_interest') > -1) {
                                                    locationName = result.name + '(' + result.vicinity + ')';
                                                }
                                            });
                                        }
                                        resolve();
                                    });
                                }
                            });
                        }).then(function () {
                            if (marker.cardName == marker.locationName) updateCardName(marker, locationName);

                            marker.locationName = locationName;

                            if (callback) callback();
                        });

                    case 3:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function geocodeAddress(_x) {
        return _ref2.apply(this, arguments);
    };
}();

var removeMarker = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(marker) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        markers.splice(markers.indexOf(marker), 1);
                        waypoints.splice(waypoints.indexOf(marker.waypoint), 1);
                        marker.setMap(null);
                        removeWaypointCard(marker);
                        marker = null;

                        if (!(waypoints.length < 2)) {
                            _context3.next = 9;
                            break;
                        }

                        directionsDisplay.setMap(null);
                        _context3.next = 11;
                        break;

                    case 9:
                        _context3.next = 11;
                        return calcRoute();

                    case 11:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, undefined);
    }));

    return function removeMarker(_x3) {
        return _ref3.apply(this, arguments);
    };
}();

var removeAllMarkers = function removeAllMarkers() {
    markers.forEach(function (marker) {
        marker.setMap(null);
        removeWaypointCard(marker);
        marker = null;
    });

    markers.length = 0;
    waypoints.length = 0;

    directionsDisplay.setMap(null);
};

var addEventListeners = function addEventListeners(marker) {
    // show tooltip with location name
    marker.addListener('click', function () {
        showInfoWindow(marker);
    });

    // remove marker
    marker.addListener('rightclick', function () {
        return removeMarker(marker);
    });

    // on drag start remove tooltip
    marker.addListener('dragstart', function (e) {
        if (markerInfoWindow) markerInfoWindow.close();
    });

    // on drag end recalculate path
    marker.addListener('dragend', function (e) {
        marker.waypoint.location = e.latLng;
        calcRoute();
        geocodeAddress(marker);
    });
};

var initEditorAndTooltips = function initEditorAndTooltips(marker) {
    var editor = new MediumEditor('#' + marker.cardId + ' .waypoint-card-body-editor', {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Начните печатать...'
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3']
        }
    });

    tippy('[title]');
};

var generateWaypointCardHTML = function generateWaypointCardHTML(marker) {
    return '\n        <div id="' + marker.cardId + '" class="waypoint-card rounded">\n            <div class="waypoint-card-header d-flex align-items-center">\n                <input class="waypoint-card-header-input" type="text" placeholder="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430...">\n                <button class="waypoint-card-header-icon show-on-map-button" type="button" title="\u0421\u0444\u043E\u043A\u0443\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u0443 \u043D\u0430 \u044D\u0442\u043E\u043C \u043C\u0430\u0440\u043A\u0435\u0440\u0435.">\n                    <i class="fas fa-map-marker-alt"></i>\n                </button>\n                <button class="waypoint-card-header-icon reset-location-button" type="button" title="\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0435\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430, \u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u044F \u0438\u0437 \u0433\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u0438.">\n                    <i class="fas fa-redo-alt"></i>\n                </button>\n                <button class="waypoint-card-header-icon remove-marker-button" type="button" title="\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043C\u0430\u0440\u043A\u0435\u0440 \u0438 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443.">\n                    <i class="far fa-trash-alt mr-1" style="color: red;"></i>\n                </button>\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body">\n                <textarea class="form-control waypoint-card-body-editor"></textarea>\n                <div class="d-flex align-items-center justify-content-end">\n                    <span class="waypoint-card-body-editor-help" title="<ul style=\'text-align: left; padding: 0; margin: 0; margin-left: 16px;\'><li>\u041F\u0440\u0438 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u0430, \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043C\u0435\u043D\u044E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430, \u0432 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438 \u043A \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u043C\u0443 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0443 \u0442\u0435\u043A\u0441\u0442\u0430.</li><li>\u0427\u0442\u043E\u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044E, \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0435\u0451 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442 \u0432 \u0442\u043E\u043C \u043C\u0435\u0441\u0442\u0435, \u0433\u0434\u0435 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u0447\u0442\u043E \u0431\u044B \u043E\u043D\u0430 \u043E\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C.</li></ul>">\u041F\u043E\u043C\u043E\u0449\u044C \u043F\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E <i class="fas fa-question-circle"></i></span>\n                </div>\n                <small id="post-body-main-error" class="form-text text-danger"></small>\n            </div>\n        </div>\n    ';
};

var createWaypointCard = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(marker) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        _context4.next = 2;
                        return new Promise(function (resolve) {
                            var cardHtml = generateWaypointCardHTML(marker);
                            var cardDOMElement = $($.parseHTML(cardHtml));

                            $('.waypoint-cards').append(cardDOMElement);

                            initEditorAndTooltips(marker);

                            // card`s header input any change detected -> update card name
                            var headerElement = $('#' + marker.cardId + ' .waypoint-card-header-input');
                            headerElement.change(function () {
                                if (headerElement.val()) {
                                    updateCardName(marker, headerElement.val().trim());
                                }
                            });

                            // button for focusing on marker
                            $('#' + marker.cardId + ' .show-on-map-button').click(function () {
                                focusMap(marker);
                            });

                            // button for reseting card`s name to geolocated one
                            $('#' + marker.cardId + ' .reset-location-button').click(function () {

                                if (!marker.locationName) {
                                    geocodeAddress(marker);
                                }

                                updateCardName(marker, marker.locationName);
                            });

                            // button for reseting card`s name to geolocated one
                            $('#' + marker.cardId + ' .remove-marker-button').click(function () {
                                removeMarker(marker);
                            });

                            resolve();
                        });

                    case 2:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, undefined);
    }));

    return function createWaypointCard(_x4) {
        return _ref4.apply(this, arguments);
    };
}();

var updateCardName = function updateCardName(marker, cardName) {
    // update marker location name
    marker.cardName = cardName;

    // update address info window content
    markerInfoWindow.setOptions({ content: marker.cardName });

    // update card header`s input
    var headerInputElement = $('#' + marker.cardId + ' .waypoint-card-header-input');
    headerInputElement.val(marker.cardName);
};

var removeWaypointCard = function removeWaypointCard(marker) {
    $('#' + marker.cardId).remove();
};

var generateMapHelperCard = function generateMapHelperCard() {
    var helperCardHTML = '\n        <div class="waypoint-card rounded">\n            <div class="waypoint-card-body">\n                \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u0441\u0442\u0430 \u0432 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0432\u044B \u043F\u043E\u0431\u044B\u0432\u0430\u043B\u0438, \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0430\u0436\u0430\u0432 \u043D\u0430 \u044D\u0442\u043E \u043C\u0435\u0441\u0442\u043E \u043D\u0430 \u043A\u0430\u0440\u0442\u0435.\n                <button class="mt-2 btn btn-success w-100">\u041F\u043E\u043D\u044F\u0442\u043D\u043E</button>\n            </div>\n        </div>\n    ';

    var helperCardElement = $(helperCardHTML);

    helperCardElement.find('button').click(function () {
        helperCardElement.remove();

        $.ajax({
            method: 'post',
            url: '/user/mark-post-map-help-as-read'
        });
    });

    $('.waypoint-cards').append(helperCardElement);
};

var generateMetaCard = function generateMetaCard() {
    var metaCardHTML = '\n        <div class="waypoint-card meta-card rounded">\n            <div class="waypoint-card-header d-flex flex-column">\n                <input class="waypoint-card-header-input meta-title" type="text" placeholder="\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A...">\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body">\n                <textarea class="form-control waypoint-card-body-editor meta-body"></textarea>\n                <div class="d-flex align-items-center justify-content-end">\n                    <span class="waypoint-card-body-editor-help" title="<ul style=\'text-align: left; padding: 0; margin: 0; margin-left: 16px;\'><li>\u041F\u0440\u0438 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u0430, \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043C\u0435\u043D\u044E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430, \u0432 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438 \u043A \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u043C\u0443 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0443 \u0442\u0435\u043A\u0441\u0442\u0430.</li><li>\u0427\u0442\u043E\u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044E, \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0435\u0451 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442 \u0432 \u0442\u043E\u043C \u043C\u0435\u0441\u0442\u0435, \u0433\u0434\u0435 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u0447\u0442\u043E \u0431\u044B \u043E\u043D\u0430 \u043E\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C.</li></ul>">\u041F\u043E\u043C\u043E\u0449\u044C \u043F\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E <i class="fas fa-question-circle"></i></span>\n                </div>\n                <small id="post-body-main-error" class="form-text text-danger"></small>\n            </div>\n        </div>\n    ';
    $('.waypoint-cards').append(metaCardHTML);

    var editor = new MediumEditor('.meta-card .waypoint-card-body-editor', {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Описание поездки, впечатления...'
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3']
        }
    });

    tippy('[title]');
};

var prepareData = function prepareData() {
    var data = {};

    /* base data */
    var metaTitle = $('.meta-title').val();
    if (metaTitle && metaTitle.trim()) {
        data.title = metaTitle.trim();

        // set page title to post title
        document.title = data.title;
    }

    var metaBody = MediumEditor.getEditorFromElement($('.meta-body').get(0)).getContent();
    if (metaBody) data.body = metaBody;

    /* markers */
    data.markers = [];

    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];

        var dataMarker = {};

        dataMarker.positionIndex = i;

        var markerPosition = marker.getPosition().toString();
        dataMarker.position = markerPosition;

        var cardId = marker.cardId;
        dataMarker.cardId = cardId;

        var markerHeader = $('#' + cardId + ' .waypoint-card-header-input').val();
        if (markerHeader && markerHeader.trim()) dataMarker.header = markerHeader.trim();else dataMarker.header = '';

        var markerBody = MediumEditor.getEditorFromElement($('#' + cardId + ' .waypoint-card-body-editor').get(0)).getContent();
        if (markerBody) dataMarker.body = markerBody;else dataMarker.body = '';

        data.markers.push(dataMarker);
    }

    /* vote */
    if ($('.vote-card-active').length) {
        data.vote = {};

        var voteTitle = $('.vote-card-active .vote-card-header-input').val();
        if (voteTitle && voteTitle.trim()) data.vote.title = voteTitle.trim();

        var voteOptionElements = $('.vote-card-active .waypoint-card-body').find('.vote-card-body-input');
        if (voteOptionElements.length) {
            data.vote.options = [];

            voteOptionElements.each(function (index, element) {
                var optionTitle = $(element).val();
                if (optionTitle && optionTitle.trim()) {
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
    markers.forEach(function (marker) {
        if (data.countries.indexOf(marker.country) == -1) data.countries.push(marker.country);
    });

    return data;
};

var loadData = function loadData(data) {
    // set page title to post title
    if (data.post.title) document.title = data.post.title;else document.title = 'Своим ходом - черновик';

    $('.meta-title').val(data.post.title);
    MediumEditor.getEditorFromElement($('.meta-body').get(0)).setContent(he.decode(data.post.body));

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
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: position
        });

        initMarker(marker, {
            cardId: cardId
        });

        addEventListeners(marker);

        createWaypointCard(marker);

        marker.cardName = header;
        updateCardName(marker, header);

        geocodeAddress(marker, function () {});

        if (body) {
            MediumEditor.getEditorFromElement($('#' + cardId + ' .waypoint-card-body-editor').get(0)).setContent(he.decode(body));
        }
    });

    if (data.voteAttached) {
        // create main vote card
        createVoteCard();

        // find main vote card for further manipulations
        var voteCard = $('.vote-card-active');

        // set vote header
        voteCard.find('.vote-card-header-input').val(data.vote.title);

        // remove autogenerated vote option fields
        voteCard.find('.waypoint-card-body').empty();
        data.vote.options.forEach(function (option) {
            createVoteOption(option.title);
        });

        // create empty vote option field at the bottom
        createVoteOption();
    }

    calcRoute();
};

var validateData = function validateData() {
    $('.notifyjs-wrapper').trigger('notify-hide');

    var errors = false;

    var showEmptyError = function showEmptyError(element) {
        element.notify('Это поле не может быть пустым.', { position: 'right', autoHide: false, className: 'error' });
        errors = true;
    };

    var metaTitle = $('.meta-card .meta-title');
    if (!metaTitle.val() && !metaTitle.val().trim()) showEmptyError(metaTitle);

    var metaBody = $('.meta-card .waypoint-card-body-editor');
    var metaBodyContent = striptags(MediumEditor.getEditorFromElement(metaBody.get(0)).getContent());
    if (!metaBodyContent) showEmptyError($(metaBody.get(0)));

    // if (data.markers.length < 1) return;
    $('.waypoint-cards .waypoint-card:not(.meta-card)').each(function (index, element) {

        var header = $(element).find('.waypoint-card-header-input');
        if (!header.val() && !header.val().trim()) showEmptyError(header);

        var body = $(element).find('.waypoint-card-body-editor');
        var bodyContent = striptags(MediumEditor.getEditorFromElement(body.get(0)).getContent());
        if (!bodyContent) showEmptyError($(body.get(0)));
    });

    var voteCard = $('.vote-card-active');
    if (voteCard.length) {
        var voteHeader = voteCard.find('.vote-card-header-input');
        if (!voteHeader.val() && !voteHeader.val().trim()) {
            voteHeader.notify('Тема голосования не может быть пустой.', { position: 'right', className: 'error', autoHide: false });
            errors = true;
        }

        var voteOptions = voteCard.find('.vote-card-body-input');
        var filledVoteOptions = 0;
        voteOptions.each(function (index, element) {
            var optionValue = $(element).val();
            if (optionValue && optionValue.trim()) filledVoteOptions += 1;
        });
        if (filledVoteOptions < 2) {
            voteCard.find('.waypoint-card-body').notify('Не может быть меньше 2 вариантов голосования.', { position: 'right', className: 'error', autoHide: false });
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

var validateVote = function validateVote(showNotifications) {
    var voteCard = $('.vote-card-active');
    if (voteCard.length) {
        var voteHeader = voteCard.find('.vote-card-header-input');
        if (!voteHeader.val() && !voteHeader.val().trim()) {
            voteHeader.notify('Тема голосования не может быть пустой.', { position: 'right', className: 'error', autoHide: false });
            return false;
        }

        var voteOptions = voteCard.find('.vote-card-body-input');
        var filledVoteOptions = 0;
        voteOptions.each(function (index, element) {
            var optionValue = $(element).val();
            if (optionValue && optionValue.trim()) filledVoteOptions += 1;
        });
        if (filledVoteOptions < 2) {
            voteCard.find('.waypoint-card-body').notify('Не может быть меньше 2 вариантов голосования.', { position: 'right', className: 'error', autoHide: false });
            return false;
        };
    }

    return true;
};

var createAddVoteCard = function createAddVoteCard() {
    $('.vote-card').remove();
    var html = '\n        <div class="waypoint-card vote-card rounded">\n            <div class="waypoint-card-header d-flex flex-row">\n                <button class="btn w-100" onclick="createVoteCard();" title="<span style=\'text-align: center;\'>\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u044D\u0442\u0443 \u043A\u043D\u043E\u043F\u043A\u0443, \u0435\u0441\u043B\u0438 \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u0440\u0435\u0434\u0438 \u0432\u0430\u0448\u0438\u0445 \u0447\u0438\u0442\u0430\u0442\u0435\u043B\u0435\u0439. \u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u0435 \u0431\u0443\u0434\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0432 \u0441\u0430\u043C\u044B\u0439 \u043A\u043E\u043D\u0435\u0446.</span>">\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u0435</button>\n            </div>\n        </div>\n    ';
    $('#cards').append(html);
};

var createVoteOption = function createVoteOption() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var placeholder = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Вариант голосования...';

    var html = '\n        <div class="d-flex flex-row align-items-center">\n            <i class="far fa-square mr-1"></i>\n            <input class="vote-card-body-input" type="text" ' + (value ? 'value="' + value + '"' : '') + 'placeholder="' + placeholder + '">\n        </div>\n    ';

    $('.vote-card > .waypoint-card-body').children().last().off();
    $('.vote-card > .waypoint-card-body').append(html);
    $('.vote-card > .waypoint-card-body').children().last().keypress(function () {
        return createVoteOption();
    });
};

var createVoteCard = function createVoteCard() {
    $('.vote-card').remove();

    var html = '\n        <div class="waypoint-card vote-card vote-card-active rounded">\n            <div class="waypoint-card-header d-flex flex-row align-items-center">\n                <input class="vote-card-header-input" type="text" placeholder="\u0422\u0435\u043C\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u044F...">\n                <span title="\u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435! \u041F\u043E\u0441\u043B\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u0432\u044B \u043D\u0435 \u0441\u043C\u043E\u0436\u0435\u0442\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0442\u0435\u043C\u0443 \u0438\u043B\u0438 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u044F \u0431\u0435\u0437 \u0441\u0431\u0440\u043E\u0441\u0430 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u0432!"><i class="waypoint-card-header-icon fas fa-exclamation-circle mr-1"></i></span>\n                <button class="waypoint-card-header-icon" type="button" onclick="createAddVoteCard();" title="\u0423\u0431\u0440\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u0435">\n                    <i class="far fa-trash-alt mr-1" style="color: red;"></i>\n                </button>\n            </div>\n            <hr class="card-divider">\n            <div class="waypoint-card-body"> </div>\n        </div>\n    ';

    $('#cards').append(html);

    tippy('[title]');

    for (var i = 0; i < 3; i++) {
        createVoteOption();
    }
};