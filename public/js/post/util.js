'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var createMap = function createMap() {
    return new google.maps.Map($('#map').get(0), {
        center: { lat: 49.82081217632622, lng: 73.08635614723323 },
        zoom: 3,
        gestureHandling: 'greedy',
        keyboardShortcuts: false
    });
};

var createGeocoderService = function createGeocoderService() {
    return new google.maps.Geocoder();
};

var createPlacesService = function createPlacesService() {
    return new google.maps.places.PlacesService(map);
};

var createDirectionsService = function createDirectionsService() {
    return new google.maps.DirectionsService();
};

var createDirectionsDisplay = function createDirectionsDisplay(map) {
    var directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true,
        preserveViewport: true
    });
    directionsDisplay.setMap(map);
    return directionsDisplay;
};

var createMarkerWindow = function createMarkerWindow() {
    return new google.maps.InfoWindow();
};

var focusMap = function focusMap(marker) {
    map.setZoom(12);
    map.panTo(marker.getPosition());
    showInfoWindow(marker);
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

var createMarker = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(latLng) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var marker;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
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
                        _context.next = 6;
                        return geocodeAddress(marker);

                    case 6:
                        _context.next = 8;
                        return calcRoute(marker.waypoint);

                    case 8:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function createMarker(_x2) {
        return _ref.apply(this, arguments);
    };
}();

// method for calculating path between all waypoints
var calcRoute = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var start, finish, request;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(waypoints.length >= 2)) {
                            _context2.next = 8;
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
                            travelMode: 'DRIVING'
                        };
                        _context2.next = 8;
                        return new Promise(function (resolve) {
                            directionsService.route(request, function (result, status) {
                                if (status == 'OK') {
                                    directionsDisplay.setMap(map);
                                    directionsDisplay.setDirections(result);
                                }

                                waypoints.splice(0, 0, start);
                                waypoints.splice(waypoints.length, 0, finish);
                                resolve();
                            });
                        });

                    case 8:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function calcRoute() {
        return _ref2.apply(this, arguments);
    };
}();

var convertHeadersToTagLinks = function convertHeadersToTagLinks() {
    var headersDOM = $('.medium-editor-element > h2, h3');
    for (var i = 0; i < headersDOM.length; i++) {
        var header = $(headersDOM[i]);
        var headerText = header.html();
        header.html($('<a></a>').attr('href', 'www.google.ru').text(headerText));
    }
};