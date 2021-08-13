window.onload = () => {
	startTime = Date.now();
	initialize();
}

let chikamoriLatLng;
let staff_address = [];
let distance_address = [];
let root_address = [];
let geocoder;
const targetCVS = "testStaff.csv";
// const targetCVS = "staff.csv";
let startTime, endTime;
const delayTime = 1500;
let distanceCount = 0;
let rootCount = 0;
const initialize = async () => {
	staff_address = await getCSV();
	geocoder = new google.maps.Geocoder();
	const chikamoriAdress = "高知県高知市大川筋1-1-16";
	const promise = geocoder.geocode(
		{
			'address': chikamoriAdress,
			'region': 'jp'
		}
	);

	promise.then((response) => {
		chikamoriLatLng = response.results[0].geometry.location;
		if (chikamoriLatLng && staff_address) {
			// genDistanceList();
			useMapBox();
		}
	})
		.catch((error) => {
			console.log(error);
		});
}

const getCSV = () => {
	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest();
		req.open("get", targetCVS, true);
		req.onload = () => {
			if (req.readyState === 4 && req.status === 0) {
				resolve(convertCSVtoStaff(req.responseText));
			} else {
				reject(new Error(req.statusText));
			}
		};
		req.onerror = () => {
			reject(new Error(req.statusText));
		};
		req.send(null);
	});
}

const useMapBox = () => {
	if (staff_address.length > 0) {
		const staff = staff_address[staff_address.length - 1];
		console.log(staff.sNumberStr);
		if (!staff.address) {
			distance_address.unshift(_.cloneDeep(staff));
			staff_address.pop();
			useMapBox();
			return;
		}

		var mapboxClient = mapboxSdk({ accessToken: 'pk.eyJ1IjoiY2hvdW5vLXl1a2loaWtvIiwiYSI6ImNrcXowNmhxbjE4ZmUyb256dXp3d2F1ZGIifQ.TOLYaE58a1m0inv1OhBVpg' });
		mapboxClient.geocoding.forwardGeocode({
			query: staff.address,
			autocomplete: false,
			limit: 1
		})
		.send()
		.then(function (response) {
			if (
				response &&
				response.body &&
				response.body.features &&
				response.body.features.length
			) {
				var feature = response.body.features[0];
				console.log(JSON.stringify(feature));
				const targetStaff = staff_address[staff_address.length - 1];
				distance_address.unshift(_.cloneDeep(targetStaff));
				const lineDistance = haversineDistance_separate(feature.center[1],feature.center[0],chikamoriLatLng);
				console.log('latlng >> '+ feature.center[1]+','+feature.center[0]);
				console.log('line >> '+ lineDistance.toFixed(1));
				staff_address.pop();
				setTimeout(() => {
					useMapBox();
				}, delayTime);
			}
		});

		// promise.then((response) => {
		// 	const latlng = response.results[0].geometry.location;
		// 	const distance = haversineDistance(latlng, chikamoriLatLng);
		// 	const targetStaff = staff_address[staff_address.length - 1];
		// 	targetStaff.latlng = latlng;
		// 	targetStaff.isPremise = isPremise(response);
		// 	if (targetStaff.isPremise == 1) {
		// 		targetStaff.lineDistance = distance.toFixed(1);
		// 	}
		// 	distance_address.unshift(_.cloneDeep(targetStaff));
		// 	staff_address.pop();
		// 	setTimeout(() => {
		// 		genDistanceList();
		// 	}, delayTime);
		// })
		// 	.catch((error) => {
		// 		console.log(error);
		// 	});
	} else {
		//genRootList();
	}
}

const genDistanceList = () => {
	console.log('line >> ' + distanceCount);
	distanceCount++;
	if (staff_address.length > 0) {
		const staff = staff_address[staff_address.length - 1];
		console.log(staff.sNumberStr);
		if (!staff.address) {
			distance_address.unshift(_.cloneDeep(staff));
			staff_address.pop();
			genDistanceList();
			return;
		}

		const promise = geocoder.geocode(
			{
				'address': staff.address,
				'region': 'jp'
			}
		);

		promise.then((response) => {
			const latlng = response.results[0].geometry.location;
			const distance = haversineDistance(latlng, chikamoriLatLng);
			const targetStaff = staff_address[staff_address.length - 1];
			targetStaff.latlng = latlng;
			targetStaff.isPremise = isPremise(response);
			if (targetStaff.isPremise == 1) {
				targetStaff.lineDistance = distance.toFixed(1);
			}
			distance_address.unshift(_.cloneDeep(targetStaff));
			staff_address.pop();
			setTimeout(() => {
				genDistanceList();
			}, delayTime);
		})
			.catch((error) => {
				console.log(error);
			});
	} else {
		genRootList();
	}
}

const genRootList = () => {
	console.log('root >> ' + rootCount);
	rootCount++;
	if (distance_address.length > 0) {
		let directionsService = new google.maps.DirectionsService();
		const chikamoriMark = { lat: chikamoriLatLng.lat(), lng: chikamoriLatLng.lng() };
		const targetStaff = distance_address[distance_address.length - 1];
		const targetMark = { lat: targetStaff.lat, lng: targetStaff.lng };
		if (!targetMark.lat) {
			console.log("remove >>> " + distance_address[distance_address.length - 1]);
			root_address.unshift(_.cloneDeep(distance_address[distance_address.length - 1]));
			distance_address.pop();
			genRootList();
			return;
		}

		const isPremise = targetStaff.isPremise;
		if (isPremise != 1) {
			root_address.unshift(_.cloneDeep(distance_address[distance_address.length - 1]));
			console.log('not premise >> ' + targetStaff.isPremise);
			distance_address.pop();
			genRootList();
			return;
		}

		const route = {
			origin: targetMark,
			destination: chikamoriMark,
			travelMode: 'DRIVING',
			avoidHighways: true
		}

		const promise = directionsService.route(route);
		promise.then((response) => {
			const directionsData = response.routes[0].legs[0];
			const targetStaff = distance_address[distance_address.length - 1];
			if (directionsData) {
				targetStaff.rootDistance = directionsData.distance.text.replace('km', '');
				console.log(targetStaff.sNumber + ' >> done');
			}
			root_address.unshift(_.cloneDeep(distance_address[distance_address.length - 1]));
			distance_address.pop();
			setTimeout(function () {
				genRootList();
			}, delayTime);
		}).catch((error) => {
			console.log(error);
		});
	} else {
		genResult(root_address);
	}
}

const genResult = (targetArr) => {
	const csvStr = converSttaffToCSV(targetArr);
	const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
	const blob = new Blob([bom, csvStr], { 'type': 'text/csv' });
	const url = window.URL || window.webkitURL;
	const blobURL = url.createObjectURL(blob);
	let a = document.createElement('a');
	a.download = decodeURI("result.csv");
	a.href = blobURL;
	a.type = 'text/csv';
	a.click();
	endTime = Date.now();
	const time = endTime - startTime;
	const sec = Math.floor(time / 1000) % 60;
	const min = Math.floor(time / 1000 / 60) % 60;
	console.log(time + 'ミリ秒');
	console.log(min + '分' + sec + '秒');
}