const Staff = class {
	latlng;
	address;
	isPremise;
	formattedAddress;
	lineDistance;
	rootDistance;
	constructor(sNumber){
		this.sNumber = sNumber;
	}

	get sNumberStr(){
		return ('00000'+this.sNumber).slice(-5);
	}

	get lat(){
		if(this.latlng){
			return this.latlng.lat();
		}
	}

	get lng(){
		if(this.latlng){
			return this.latlng.lng();
		}
	}
}