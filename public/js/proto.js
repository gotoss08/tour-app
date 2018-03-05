var map,
	geocoder,
	placesService,
	directionsService,
	directionsDisplay,
	showInfoWindow;

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
	showInfoWindow = (marker) => {
		let cardName = $(`#${marker.cardId} .waypoint-card-header-input`).val();
		let content = `
			<div class="d-flex align-items-center">
				<button id="${marker.cardId}-go-to-card-button" class="" type="button" onclick="$(window).scrollTop($('#${marker.cardId}').offset().top-5); $('#${marker.cardId}').animateCss('flash', () => {})" style="background-color: transparent; border: none;" title="Переместиться к карточке."><i class="fas fa-search"></i></button>
				${cardName}
			</div>
		`;

		markerInfoWindow.close();
		markerInfoWindow.setOptions({ content: content });
		markerInfoWindow.open(map, marker);

		tippy($(`#${marker.cardId}-go-to-card-button`).get(0), {
			placement: 'bottom'
		});
	};

	let updateMarkerLocationName = (marker, locationName) => {
		// update marker location name
		marker.locationName = locationName;
		marker.locationNames.push(locationName);

		// update address info window content
		markerInfoWindow.setOptions({ content: marker.locationName });

		// update card according to new marker information
		updateWaypointCard(marker);
	};

	// geocode current address and assign it to marker
	let geocodeAddress = (marker) => {
		placesService.nearbySearch({
			location: marker.waypoint.location,
			radius: '50'
		}, (results, status) => {
			let interestFound = false;

			if(status == 'OK') {
				results.forEach((result) => {
					if(!interestFound && result.types.indexOf('point_of_interest') > -1) {
						interestFound = true;
						updateMarkerLocationName(marker, result.name + '(' + result.vicinity + ')');
					}
				});
			}

			if(status == 'ZERO_RESULTS' || !interestFound) {
				geocoder.geocode({ 'location': marker.waypoint.location }, (results, status) => {
					if(status == 'OK') updateMarkerLocationName(marker, results[0].formatted_address);
				});
			}
		});
	};

	// handle left click event
	map.addListener('click', (e) => {
		let marker = new google.maps.Marker({
			map: map,
			draggable: true,
			animation: google.maps.Animation.DROP,
			position: e.latLng
		});

		marker.waypoint = { location: e.latLng };
		marker.cardId = '_' + Math.random().toString(36).substr(2, 9);
		marker.locationNames = [];
		geocodeAddress(marker);

		// show tooltip with location name
		marker.addListener('click', () => {
			showInfoWindow(marker);
		});

		// remove marker
		marker.addListener('rightclick', (e) => {
			waypoints.splice(waypoints.indexOf(marker.waypoint), 1);
			removeWaypointCard(marker);
			marker.setMap(null);
			marker = null;
			if(waypoints.length < 2) {
				directionsDisplay.setMap(null);
			} else {
				calcRoute();
			}
		});

		// on drag start remove tooltip
		marker.addListener('dragstart', (e) => {
			if(markerInfoWindow) markerInfoWindow.close();
		});

		// on drag end recalculate path
		marker.addListener('dragend', (e) => {
			marker.waypoint.location = e.latLng;
			calcRoute();
			geocodeAddress(marker);
		});

		calcRoute(marker.waypoint);

		createWaypointCard(marker);
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

var convertHeadersToTagLinks = () => {
	$('.medium-editor-element h1, h2, h3, h4, h5, h6').addClass('adf');
};

var initEditorAndTooltips = () => {
	let editor = new MediumEditor('.waypoint-card-body-editor', {
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

var generateWaypointCardHTML = (marker) => {
	return `
		<div id="${marker.cardId}-chain" class="waypoint-card-chain"><i class="fas fa-arrow-down"></i></div>
		<div id="${marker.cardId}" class="waypoint-card twinPeaks rounded">
			<h3 class="waypoint-card-header d-flex align-items-center">
				<input class="waypoint-card-header-input" type="text" placeholder="Название точки маршрута..." value="${marker.locationName}">
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
}

var createWaypointCard = (marker) => {
	let cardHtml = generateWaypointCardHTML(marker);
	let cardDOMElement = $($.parseHTML(cardHtml));

	$('.waypoint-cards').append(cardDOMElement);

	initEditorAndTooltips();

	console.log('creating waypoint card ' + marker.cardId);
};

var updateWaypointCard = (marker) => {
	let updateHeaderInputName = () => {
		headerInputElement.val(marker.locationName);
	};

	let headerInputElement = $(`#${marker.cardId} .waypoint-card-header-input`);
	if(marker.locationNames.length > 1) {
		if(marker.locationNames.indexOf(headerInputElement.val()) != -1) {
			updateHeaderInputName();
		}
	} else {
		updateHeaderInputName();
	}

	// reset card name to default location name
	$(`#${marker.cardId} .reset-location-button`).click(() => {
		headerInputElement.val(marker.locationName);
	});

	// show on map button
	$(`#${marker.cardId} .show-on-map-button`).click(() => {
		$(window).scrollTop(0);
		map.setZoom(18);
		map.panTo(marker.getPosition());
		showInfoWindow(marker);
	});

	let bodyEditorElement = $(`#${marker.cardId}-body-editor`);
};

var removeWaypointCard = (marker) => {
	console.log('removing waypoint card ' + marker.cardId);
	$(`#${marker.cardId}, #${marker.cardId}-chain`).remove();
};
