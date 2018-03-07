'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

$(document).ready(function () {
    $.notify.defaults({
        globalPosition: 'bottom left',
        className: 'info'
    });

    $('#post-publish-button').click(function () {
        var data = prepareData();
        if (data.markers.length < 1) return;

        var self = this;
        var prevHTML = $(self).html();

        var buttonSending = function buttonSending() {
            $.notify('Button click');
            $(self).html('<i class="fas fa-spinner"></i> Sending...');
            $(self).children('i').addClass('spinner-rotation');
            $(self).attr('disabled', true);
            $('#post-status').html('Sending...');
        };

        var buttonReceived = function buttonReceived() {
            $(self).html(prevHTML);
            $(self).attr('disabled', false);
            $('#post-status').html('');
        };

        var request = $.ajax({
            url: '/p/' + receivedPostData.postId + '/update',
            method: 'post',
            data: data
        });

        buttonSending();

        removeAllMarkers();

        request.done(function (data, status) {
            $.notify('send to server was ' + status, 'success');
            $(self).attr('disabled', false);
            $.notify('button ' + $(self).prop('disabled'));
            loadData(data);
        });

        request.fail(function (xhr, status) {
            $.notify('send to server was ' + status, 'danger');
        });

        request.always(function () {
            buttonReceived();
        });
    });

    loadData(receivedPostData);
});

var map = void 0;
var geocoder = void 0;
var placesService = void 0;
var directionsService = void 0;
var directionsDisplay = void 0;
var markerInfoWindow = void 0;

var waypoints = [];
var markers = [];

var initMap = function initMap() {
    // init map
    map = new google.maps.Map($('#map').get(0), {
        center: { lat: 49.82081217632622, lng: 73.08635614723323 },
        zoom: 20,
        gestureHandling: 'greedy'
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
        preserveViewport: true
    });
    directionsDisplay.setMap(map);

    // create basic info window
    markerInfoWindow = new google.maps.InfoWindow();

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
            }, _callee, undefined);
        }))();
    });
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

    return function geocodeAddress(_x2) {
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

                        console.log('marker removed');

                    case 12:
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

    $.notify('All markers removed');
};

var initMarker = function initMarker(marker) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    marker.locationNames = [];

    if (!options.cardId) options.cardId = '_' + Math.random().toString(36).substr(2, 9);
    if (options.locationName) {
        marker.locationName = options.locationName;
        marker.locationNames = [options.locationName];
    }

    marker.waypoint = { location: marker.getPosition() };
    marker.cardId = options.cardId;
    markers.push(marker);

    waypoints.push(marker.waypoint);
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

var createMarker = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(latLng) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var marker;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        marker = new google.maps.Marker({
                            map: map,
                            draggable: true,
                            animation: google.maps.Animation.DROP,
                            position: latLng
                        });


                        initMarker(marker, options);

                        addEventListeners(marker);

                        createWaypointCard(marker);

                        console.log('started geocoding');
                        _context4.next = 7;
                        return geocodeAddress(marker);

                    case 7:
                        console.log('finished geocoding');

                        _context4.next = 10;
                        return calcRoute(marker.waypoint);

                    case 10:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, undefined);
    }));

    return function createMarker(_x6) {
        return _ref4.apply(this, arguments);
    };
}();

// method for calculating path between all waypoints
var calcRoute = function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        var start, finish, request;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        if (!(waypoints.length >= 2)) {
                            _context5.next = 9;
                            break;
                        }

                        start = waypoints[0];

                        waypoints.splice(0, 1);
                        finish = waypoints[waypoints.length - 1];

                        waypoints.splice(waypoints.length - 1, 1);

                        request = {
                            origin: start,
                            destination: finish,
                            waypoints: waypoints,
                            travelMode: 'DRIVING',
                            unitSystem: google.maps.UnitSystem.METRIC
                        };


                        console.log('path start');

                        _context5.next = 9;
                        return new Promise(function (resolve) {
                            directionsService.route(request, function (result, status) {
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

                    case 9:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, undefined);
    }));

    return function calcRoute() {
        return _ref5.apply(this, arguments);
    };
}();

var convertHeadersToTagLinks = function convertHeadersToTagLinks() {
    $('.medium-editor-element h1, h2, h3, h4, h5, h6').addClass('adf');
};

var initEditorAndTooltips = function initEditorAndTooltips(marker) {
    var editor = new MediumEditor('.waypoint-card-body-editor', {
        autoLink: true,
        buttonLabels: 'fontawesome',
        placeholder: {
            text: 'Начните печатать...'
        },
        toolbar: {
            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3']
        }
    });

    marker.editor = editor;

    tippy('[title]');
};

var generateWaypointCardHTML = function generateWaypointCardHTML(marker) {
    return '\n        <div id="' + marker.cardId + '-chain" class="waypoint-card-chain"><i class="fas fa-arrow-down"></i></div>\n        <div id="' + marker.cardId + '" class="waypoint-card twinPeaks rounded">\n            <h3 class="waypoint-card-header d-flex align-items-center">\n                <input class="waypoint-card-header-input" type="text" placeholder="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430...">\n                <button class="show-on-map-button" type="button"  title="\u0421\u0444\u043E\u043A\u0443\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u0443 \u043D\u0430 \u044D\u0442\u043E\u043C \u043C\u0430\u0440\u043A\u0435\u0440\u0435.">\n                    <i class="fas fa-map-marker-alt"></i>\n                </button>\n                <button class="reset-location-button" type="button" title="\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0435\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430, \u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u044F \u0438\u0437 \u0433\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u0438.">\n                    <i class="fas fa-redo-alt"></i>\n                </button>\n            </h3>\n            <div class="waypoint-card-body">\n                <textarea class="form-control waypoint-card-body-editor" name="body"></textarea>\n                <div class="d-flex align-items-center justify-content-end">\n                    <span class="waypoint-card-body-editor-help" title="<ul style=\'text-align: left; padding: 0; margin: 0; margin-left: 16px;\'><li>\u041F\u0440\u0438 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u0430, \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043C\u0435\u043D\u044E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430, \u0432 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438 \u043A \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u043C\u0443 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0443 \u0442\u0435\u043A\u0441\u0442\u0430.</li><li>\u041F\u043E\u0441\u043B\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438, \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438 \u0442\u0430\u043A \u0436\u0435 \u0431\u0443\u0434\u0443\u0442 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u044B \u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u044B \u0432 \u0432\u0438\u0434\u0435 \u0442\u044D\u0433\u043E\u0432.</li><li>\u0427\u0442\u043E\u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044E, \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0435\u0451 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442 \u0432 \u0442\u043E\u043C \u043C\u0435\u0441\u0442\u0435, \u0433\u0434\u0435 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u0447\u0442\u043E \u0431\u044B \u043E\u043D\u0430 \u043E\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C.</li></ul>">\u041F\u043E\u043C\u043E\u0449\u044C \u043F\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E <i class="fas fa-question-circle"></i></span>\n                </div>\n                <small id="post-body-main-error" class="form-text text-danger"></small>\n            </div>\n        </div>\n    ';
};

var createWaypointCard = function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(marker) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        _context6.next = 2;
                        return new Promise(function (resolve) {
                            console.log('creating waypoint card ' + marker.cardId);

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
                                $(window).scrollTop(0);
                                map.setZoom(18);
                                map.panTo(marker.getPosition());
                                showInfoWindow(marker);
                            });

                            // button for reseting card`s name to geolocated one
                            $('#' + marker.cardId + ' .reset-location-button').click(function () {

                                if (!marker.locationName) {
                                    geocodeAddress(marker);
                                }

                                updateCardName(marker, marker.locationName);
                            });

                            resolve();
                        });

                    case 2:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, _callee6, undefined);
    }));

    return function createWaypointCard(_x7) {
        return _ref6.apply(this, arguments);
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
    console.log('removing waypoint card ' + marker.cardId);
    $('#' + marker.cardId + ', #' + marker.cardId + '-chain').remove();
};

var getTotalCountryList = function getTotalCountryList() {
    var countries = [];

    markers.forEach(function (marker) {
        if (countries.indexOf(marker.country) == -1) countries.push(marker.country);
    });

    $.notify(JSON.stringify(countries));

    return countries;
};

var prepareData = function prepareData() {
    var countries = getTotalCountryList();

    var data = {};
    data.markers = [];

    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];

        console.log('++++++++ serialized: ' + JSON.stringify(marker.editor.getContent()));

        var dataMarker = {};

        dataMarker.positionIndex = i;

        var markerPosition = marker.getPosition().toString();
        dataMarker.position = markerPosition;

        console.log('to string position: ' + dataMarker.position);

        var cardId = marker.cardId;
        dataMarker.cardId = cardId;

        var headerInputValue = $('#' + cardId + ' .waypoint-card-header-input').val().trim();
        dataMarker.header = headerInputValue;

        var bodyEditorContent = $('#' + cardId + ' .waypoint-card-body-editor').html().trim();
        dataMarker.body = bodyEditorContent;

        data.markers.push(dataMarker);
    }

    return data;
};

var loadData = function loadData(data) {
    data.markers.sort(function (a, b) {
        return a.positionIndex - b.positionIndex;
    });

    data.markers.forEach(function (marker) {
        // prepare position
        var unpreparedPosition = marker['position'];
        unpreparedPosition = marker['position'].slice(1, marker['position'].length - 1);
        var splittedPosition = unpreparedPosition.split(',');
        var position = new google.maps.LatLng(Number(splittedPosition[0]), Number(splittedPosition[1]));

        var positionIndex = marker.positionIndex;
        var cardId = marker.cardId;
        var header = marker.header;
        var body = marker.body;

        console.log('position: ' + position);

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

        console.log('asdfasfd');

        geocodeAddress(marker, function () {
            console.log(positionIndex + ' geocoded');
        });

        if (body) {
            console.log('body: ' + body);
            console.log('body decoded: ' + he.decode(body));
            $('#' + cardId + ' .waypoint-card-body-editor').removeClass('medium-editor-placeholder').html(he.decode(body));
            console.log($('#' + cardId + ' .waypoint-card-body-editor').html());
        }
    });

    calcRoute();
};

var validateData = function validateData() {
    $('.waypoint-cards').each(function (index, element) {
        console.log(element.html());
    });
};