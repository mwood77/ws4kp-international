export default class RequestValidator {
	static validWeatherBodyKeys = [
		'stationName', 'locationCity', 'locationState',
		'temperature', 'conditionText', 'weatherConditionCode',
		'humidity', 'dewPoint', 'ceiling',
		'visibility', 'pressure', 'cloudCover',
		'uvIndex', 'windSpeed', 'windDirection',
		'windGust', 'lastUpdated',
	];

	static isValidWeatherBody(body) {
		if (typeof body !== 'object' || body === null) {
			return false;
		}

		if (!this.validWeatherBodyKeys.every((key) => key in body)) {
			return false;
		}

		return true;
	}
}
