var map,
	geocoder,
	placesService,
	directionsService,
	directionsDisplay;

const waypoints = [];

var initMap = () => {
	// init map
	map = new google.maps.Map($('#map').get(0), {
		center: { lat: 49.82081217632622, lng: 73.08635614723323 },
		zoom: 20
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

	// info window for showing marker address
	var markerInfoWindow = new google.maps.InfoWindow();

	// handle left click event
	map.addListener('click', (e) => {
		let marker = new google.maps.Marker({
			map: map,
			draggable: true,
			animation: google.maps.Animation.DROP,
			position: e.latLng
		});

		marker.waypoint = { location: e.latLng };
		marker.card_id = '_' + Math.random().toString(36).substr(2, 9);

		marker.addListener('click', () => {
			let content, interestFound = false;

			let showInfoWindow = () => {
				markerInfoWindow.close();
				markerInfoWindow.setOptions({ content: content });
				markerInfoWindow.open(map, marker);
			};

			placesService.nearbySearch({
				location: e.latLng,
				radius: '50'
			}, (results, status) => {
				if(status == 'OK') {
					results.forEach((result) => {
						if(!interestFound && result.types.indexOf('point_of_interest') > -1) {
							content = result.name + '(' + result.vicinity + ')';
							interestFound = true;
							showInfoWindow();
						}
					});
				}

				if(status == 'ZERO_RESULTS' || !interestFound) {
					geocoder.geocode({ 'location': e.latLng }, (results, status) => {
						if(status == 'OK') {
							content = results[0].formatted_address;
							showInfoWindow();
						}
					});
				}
			});
		});

		marker.addListener('rightclick', (e) => {
			waypoints.splice(waypoints.indexOf(marker.waypoint), 1);
			removeWaypointCard(marker.card_id);
			marker.setMap(null);
			marker = null;
			if(waypoints.length < 2) {
				directionsDisplay.setMap(null);
			} else {
				calcRoute();
			}
		});

		marker.addListener('dragend', (e) => {
			marker.waypoint.location = e.latLng;
			calcRoute();
		});

		calcRoute(marker.waypoint);

		createWaypointCard(marker.card_id);
	});

	// method for calculating path between all waypoints
	var calcRoute = (waypoint) => {
		if(waypoint) waypoints.push(waypoint);

		if(waypoints.length >= 2) {
			let start = waypoints[0];
			waypoints.splice(0,1);
			let finish = waypoints[waypoints.length-1];
			waypoints.splice(waypoints.length-1,1);

			let request = {
				origin: start,
				destination: finish,
				waypoints: waypoints,
				travelMode: 'DRIVING',
				unitSystem: google.maps.UnitSystem.METRIC
			};

			directionsService.route(request, (result, status) => {
				if(status == 'OK') {
					directionsDisplay.setMap(map);
					directionsDisplay.setDirections(result);
				}
			});

			waypoints.splice(0, 0, start);
			waypoints.splice(waypoints.length, 0, finish);
		}
	};
};

var createWaypointCard = (card_id) => {
	console.log('creating waypoint card ' + card_id);
};

var removeWaypointCard = (card_id) => {
	console.log('removing waypoint card ' + card_id);
};