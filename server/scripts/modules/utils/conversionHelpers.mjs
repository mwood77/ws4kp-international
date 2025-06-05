import {
	kphToKnots,
	kphToMs,
	kphToMph,
	knotsToMs,

	celsiusToFahrenheit,
	celsiusToKelvin,

	kilometersToMiles,
	kilometersToFeet,
	kilometersToMeters,
	KilometersToBananas,
	metersToFeet,

	pascalToInHg,
	pascalToMmHg,
} from './units.mjs';

export default class ConversionHelpers {
	static getHoursFormat() {
		let hoursFormat = '';
		// [1, '12-hour'],
		// [2, '24-hour'],
		switch (document.documentElement.attributes.getNamedItem('hours-format').value) {
			case '1':
				hoursFormat = '12-hour';
				break;
			case '2':
				hoursFormat = '24-hour';
				break;
			default:
				hoursFormat = '24-hour';
		}

		return hoursFormat;
	}

	static calculateCeilingInKM(temperature, dewPoint) {
		if (temperature === null || dewPoint === null) {
			return null;
		}

		// Approximate LCL height in meters using (T - Td) * 68
		const heightMeters = (temperature - dewPoint) * 68;

		// Convert to kilometers and round to 2 decimal places
		const heightKm = Math.max(0, Math.round(heightMeters / 10) / 100);
		return heightKm;
	}

	static getMarineWindUnitText() {
		let marineWindUnitText = '';
		// [1, 'knots'],
		// [2, 'm/s'],
		switch (document.documentElement.attributes.getNamedItem('marine-wind-units').value) {
			case '1':
				marineWindUnitText = 'kts';
				break;
			case '2':
				marineWindUnitText = 'm/s';
				break;
			default:
				marineWindUnitText = 'kts';
		}

		return marineWindUnitText;
	}

	static convertMarineWindUnitsFromKnots(openMeteoValue) {
		// [1, 'knots'],
		// [2, 'm/s'],
		const windUnits = document.documentElement.attributes.getNamedItem('marine-wind-units').value;

		if (windUnits === '1') return openMeteoValue; // knots
		if (windUnits === '2') return knotsToMs(openMeteoValue); // m/s
		return openMeteoValue;
	}

	static getWindUnitText() {
		let windUnitText = '';
		// [1, 'm/s'],
		// [2, 'km/h'],
		// [3, 'knots'],
		// [4, 'mph'],
		switch (document.documentElement.attributes.getNamedItem('wind-units').value) {
			case '1':
				windUnitText = 'm/s';
				break;
			case '2':
				windUnitText = 'km/h';
				break;
			case '3':
				windUnitText = 'knots';
				break;
			case '4':
				windUnitText = 'mph';
				break;
			default:
				windUnitText = 'km/h';
		}

		return windUnitText;
	}

	static convertWindUnits(openMeteoValue) {
		// [1, 'm/s'],
		// [2, 'km/h'],
		// [3, 'knots'],
		// [4, 'mph'],
		const windUnits = document.documentElement.attributes.getNamedItem('wind-units').value;

		if (windUnits === '1') return kphToMs(openMeteoValue); // m/s
		if (windUnits === '2') return openMeteoValue; // km/h
		if (windUnits === '3') return kphToKnots(openMeteoValue); // knots
		if (windUnits === '4') return kphToMph(openMeteoValue); // mph
		return openMeteoValue;
	}

	static getTemperatureUnitText() {
		let temperatureUnitText = '';
		// [1, 'C'],
		// [2, 'F'],
		// [3, 'K'],
		switch (document.documentElement.attributes.getNamedItem('temperature-units').value) {
			case '1':
				temperatureUnitText = 'C';
				break;
			case '2':
				temperatureUnitText = 'F';
				break;
			case '3':
				temperatureUnitText = 'K';
				break;
			default:
				temperatureUnitText = 'C';
		}

		return temperatureUnitText;
	}

	static convertTemperatureUnits(openMeteoValue) {
		// [1, 'C'],
		// [2, 'F'],
		// [3, 'K'],
		const temperatureUnits = document.documentElement.attributes.getNamedItem('temperature-units').value;

		if (temperatureUnits === '1') return openMeteoValue; // C
		if (temperatureUnits === '2') return celsiusToFahrenheit(openMeteoValue); // F
		if (temperatureUnits === '3') return celsiusToKelvin(openMeteoValue); // K
		return openMeteoValue;
	}

	static convertDistanceUnits(openMeteoValue) {
		// [1, 'km'],
		// [2, 'mi'],
		// [3, 'ft'],
		// [4, 'm'],
		// [5, 'bananas'],
		const distanceUnits = document.documentElement.attributes.getNamedItem('distance-units').value;

		if (distanceUnits === '1') return openMeteoValue; // km
		if (distanceUnits === '2') return kilometersToMiles(openMeteoValue); // mi
		if (distanceUnits === '3') return kilometersToFeet(openMeteoValue); // ft
		if (distanceUnits === '4') return kilometersToMeters(openMeteoValue); // m
		if (distanceUnits === '5') return KilometersToBananas(openMeteoValue); // bananas
		return openMeteoValue;
	}

	static getDistanceUnitText() {
		let distanceUnitText = '';

		// [1, 'km'],
		// [2, 'mi'],
		// [3, 'ft'],
		// [4, 'm'],
		// [5, 'bananas'],
		switch (document.documentElement.attributes.getNamedItem('distance-units').value) {
			case '1':
				distanceUnitText = 'km';
				break;
			case '2':
				distanceUnitText = 'mi';
				break;
			case '3':
				distanceUnitText = 'ft';
				break;
			case '4':
				distanceUnitText = 'm';
				break;
			case '5':
				distanceUnitText = 'bnas';
				break;
			default:
				distanceUnitText = 'km';
		}

		return distanceUnitText;
	}

	static convertPressureUnits(openMeteoValue) {
		// [1, 'hPa'],
		// [2, 'inHg'],
		// [3, 'mmHg'],
		const pressureUnits = document.documentElement.attributes.getNamedItem('pressure-units').value;

		if (pressureUnits === '1') return openMeteoValue; // hPa
		if (pressureUnits === '2') return pascalToInHg(openMeteoValue);
		if (pressureUnits === '3') return pascalToMmHg(openMeteoValue);
		return openMeteoValue;
	}

	static getPressureUnitText() {
		let pressureUnitText = '';
		// [1, 'hPa'],
		// [2, 'inHg'],
		// [3, 'mmHg'],
		switch (document.documentElement.attributes.getNamedItem('pressure-units').value) {
			case '1':
				pressureUnitText = 'hPa';
				break;
			case '2':
				pressureUnitText = 'inHg';
				break;
			case '3':
				pressureUnitText = 'mmHg';
				break;
			default:
				pressureUnitText = 'hPa';
		}
		return pressureUnitText;
	}

	static convertWaveHeightUnits(openMeteoValue) {
		// [1, 'feet'],
		// [2, 'meters'],
		const waveHeightUnits = document.documentElement.attributes.getNamedItem('marine-wave-height-units').value;

		if (waveHeightUnits === '1') return metersToFeet(openMeteoValue); // feet
		if (waveHeightUnits === '2') return openMeteoValue; // meters
		return openMeteoValue;
	}

	static getWaveHeightUnitText() {
		let waveHeightUnitText = '';
		// [1, 'feet'],
		// [2, 'meters'],
		switch (document.documentElement.attributes.getNamedItem('marine-wave-height-units').value) {
			case '1':
				waveHeightUnitText = "'";
				break;
			case '2':
				waveHeightUnitText = 'm';
				break;
			default:
				waveHeightUnitText = "'";
		}

		return waveHeightUnitText;
	}
}
