
var createMap = () => {
    return new google.maps.Map($('#map').get(0), {
        center: {lat: 49.82081217632622, lng: 73.08635614723323},
        zoom: 20,
        gestureHandling: 'greedy',
    });
};

var createGeocoderService = () => {
    return new google.maps.Geocoder();
};

var createPlacesService = () => {
    return new google.maps.places.PlacesService(map);
};

var createDirectionsService = () => {
    return new google.maps.DirectionsService();
};

var createDirectionsDisplay = (map) => {
    let directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true,
        preserveViewport: true,
    });
    directionsDisplay.setMap(map);
    return directionsDisplay;
};

var createMarkerWindow = () => {
    return new google.maps.InfoWindow();
};

var focusMap = (marker) => {
    map.setZoom(12);
    map.panTo(marker.getPosition());
    showInfoWindow(marker);
};

var initMarker = (marker, options={}) => {
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

var createMarker = async (latLng, options={}) => {
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
var calcRoute = async () => {
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
            preserveViewport: true,
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
