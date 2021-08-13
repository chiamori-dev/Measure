window.onload = function () {
	startTime = Date.now();
	initMap();
}

let chikamoriLatLng;
let staff_address = [];
let distance_address = [];
let root_address = [];
let geocoder;
// const targetCVS = "testStaff.csv";
const targetCVS = "staff.csv";
let startTime,endTime;
let currentCount = 0;
const delayTime = 500;
const initMap = async () => {
	staff_address = await getCSV();
	geocoder = new google.maps.Geocoder();
	const chikamoriAdress = "高知県高知市大川筋1-1-16";
	const promise = geocoder.geocode(
		{
			'address': chikamoriAdress,
			'region':'jp'
		}
	);
	
	promise.then((response) => {
		chikamoriLatLng = response.results[0].geometry.location;
		if (chikamoriLatLng && staff_address) {
			genDistanceList();
		}
	})
	.catch((error) => {
		console.log(error);
	});
}

const getCSV = () => {
	return new Promise((resolve, reject) => {
		var req = new XMLHttpRequest();
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

const genResult = () => {
	const csvStr = converSttaffToCSV(root_address);
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
	const time = endTime-startTime;
	const sec = Math.floor(time/1000)%60;
	const min=Math.floor(time/1000/60)%60;
	console.log(time+'ミリ秒');
	console.log(min+'分'+sec+'秒');
}

const haversineDistance = (mk1, mk2) => {
	var R = 6371.0710;
	var rlat1 = mk1.lat() * (Math.PI / 180);
	var rlat2 = mk2.lat() * (Math.PI / 180);
	var difflat = rlat2 - rlat1;
	var difflon = (mk2.lng() - mk1.lng()) * (Math.PI / 180);
	var d = 2 * R
		* Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2)
			+ Math.cos(rlat1) * Math.cos(rlat2)
			* Math.sin(difflon / 2) * Math.sin(difflon / 2)));
	return d;
}

const genDistanceList = () => {
	if(staff_address.length>0){
		let staff = staff_address[staff_address.length-1];
		geocoder.geocode({ 'address': staff[1], 'region': 'jp' },
			function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					const latlng = results[0].geometry.location;
					const distance = haversineDistance(latlng, chikamoriLatLng);
					staff_address[staff_address.length-1].push(distance.toFixed(1));
					staff_address[staff_address.length-1].push(latlng.lat());
					staff_address[staff_address.length-1].push(latlng.lng());
				}
				distance_address.unshift(staff_address[staff_address.length-1].concat());
				staff_address.pop();
				setTimeout(function(){
					genDistanceList();
				},delayTime);
			}
		);
	}else{
		currentCount = 0;
		genRootList();
	}
}

const genRootList = () => {
	if(distance_address.length>0){
		let directionsService = new google.maps.DirectionsService();
		const chikamoriMark = {lat: chikamoriLatLng.lat(), lng: chikamoriLatLng.lng()};
		const targetMark = {lat:distance_address[distance_address.length-1][3],lng:distance_address[distance_address.length-1][4]};
		if(!targetMark.lat){
			console.log("remove >>> " + distance_address[distance_address.length-1]);
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
		console.log(targetMark);
		directionsService.route(route,
			function(response, status) {
				if (status !== 'OK') {
					window.alert('Directions request failed due to ' + status);
					return;
				} else {
					var directionsData = response.routes[0].legs[0];
					if (directionsData) {
						distance_address[distance_address.length-1].pop();
						distance_address[distance_address.length-1].pop();
						distance_address[distance_address.length-1].push(directionsData.distance.text.replace('km',''));
					}
				}
				root_address.unshift(distance_address[distance_address.length-1].concat());
				distance_address.pop();
				setTimeout(function(){
					genRootList();
				},delayTime*2);
	  	}
		);
	}else{
		genResult();
	}
}

const convertCSVtoStaff = (str) => {
	var result = []
	var tmp = str.split("\r\n");
	for (var i = 0; i < tmp.length; ++i) {
		result[i] = tmp[i].split(',');
	}
	return result;
}

const converSttaffToCSV = (arr) => {
	let result = "";
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];
		for (let j = 0; j < element.length; j++) {
			const value = element[j];
			result += value;
			if (j != element.length - 1) {
				result += ",";
			}
		}
		if (i != arr.length - 1) {
			result += "\n";
		}
	}
	return result;
}