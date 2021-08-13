const convertCSVtoStaff = (str) => {
	let result = []
	const tmp = str.split("\r\n");
	for (let i = 0; i < tmp.length; ++i) {
		let receivedStaff = new Staff(tmp[i].split(',')[0]);
		receivedStaff.address = tmp[i].split(',')[1];
		result[i]=receivedStaff;
	}
	return result;
}

const converSttaffToCSV = (arr) => {
	let result = "";
	for (let i = 0; i < arr.length; i++) {
		const element = arr[i];
		result += element.sNumberStr+',';
		result += isBlank(element.address)+',';
		result += isBlank(element.lineDistance)+',';
		result += isBlank(element.rootDistance);
		if(element.isPremise&&element.isPremise!=1){
			result += ',' + element.isPremise;
		}
		if (i != arr.length - 1) {
			result += "\n";
		}
	}
	return result;
}

const isBlank = (val) =>{
	if(val){
		return val;
	}else{
		return '';
	}
}

const haversineDistance = (mk1, mk2) => {
	const R = 6371.0710;
	const rlat1 = mk1.lat() * (Math.PI / 180);
	const rlat2 = mk2.lat() * (Math.PI / 180);
	const difflat = rlat2 - rlat1;
	const difflon = (mk2.lng() - mk1.lng()) * (Math.PI / 180);
	const d = 2 * R
		* Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2)
			+ Math.cos(rlat1) * Math.cos(rlat2)
			* Math.sin(difflon / 2) * Math.sin(difflon / 2)));
	return d;
}

const haversineDistance_separate = (lat1,lng1, mk2) => {
	const R = 6371.0710;
	const rlat1 = lat1 * (Math.PI / 180);
	const rlat2 = mk2.lat() * (Math.PI / 180);
	const difflat = rlat2 - rlat1;
	const difflon = (mk2.lng() - lng1) * (Math.PI / 180);
	const d = 2 * R
		* Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2)
			+ Math.cos(rlat1) * Math.cos(rlat2)
			* Math.sin(difflon / 2) * Math.sin(difflon / 2)));
	return d;
}

const removeEmptyAddress = (target) => {
	let result = [];
	for (let i = 0; i < target.length; i++) {
		const element = target[i];
		if(element[1]!=''){
			result.push(element.concat());
		}
	}
	return result;
}

const isPremise = (target) => {
	let result = target.results[0].formatted_address.replace('日本、','');
	const address_components = target.results[0].address_components;
	address_components.forEach(element => {
		const types = element.types.concat();
		for (let i = 0; i < types.length; i++) {
			const val = types[i];
			if(val=='premise'){
				result = 1;
			}
		}
	});
	return result;
}