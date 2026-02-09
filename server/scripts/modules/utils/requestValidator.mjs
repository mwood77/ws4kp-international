export default class RequestValidator {
	static validWeatherBodyKeys = [
		'stationName', 'locationCity', 'locationState',
		'temperature', 'conditionText', 'weatherConditionCode',
		'humidity', 'dewPoint', 'ceiling',
		'visibility', 'pressure', 'cloudCover',
		'uvIndex', 'windSpeed', 'windDirection',
		'windGust', 'lastUpdated',
	];

	static validPwsRequestKeys = [
		'ID', 'PASSWORD', 'dateutc',
		'winddir', 'windspeedmph', 'windgustmph', 'windgustdir',
		'humidity', 'dewptf', 'tempf', 'weather',
		'UV', 'visibility',
	];

	static isValidEcowittStyleBody(body) {
		if (typeof body !== 'object' || body === null) {
			return false;
		}

		if (!this.validWeatherBodyKeys.every((key) => key in body)) {
			return false;
		}

		return true;
	}

	static isValidWuPwsRequest(url) {
		const urlKeys = Object.keys(url);

		if (!urlKeys.includes('ID') || !urlKeys.includes('PASSWORD') || !urlKeys.includes('dateutc')) {
			console.error('Received request with missing required ID, PASSWORD, or dateutc keys');
			return false;
		}

		const requiredKeys = this.validPwsRequestKeys;

		if (!requiredKeys.every((key) => key in url)) {
			console.error(`Received request with missing weather data keys. Required keys are: ${requiredKeys.join(', ')}`);
			return false;
		}

		return true;
	}
}
