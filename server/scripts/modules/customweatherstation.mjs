// custom weather station display, similar to current weather but based on a user-defined station
import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import { directionToNSEW } from './utils/calc.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class CustomWeatherStation extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Custom Weather Station', false, defaultActive);

		// set timings
		this.timing.baseDelay = 5000;
	}

	async getData(_weatherParameters) {
		if (!super.getData(_weatherParameters)) return;

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();
		const customWeatherParameters = this.weatherParameters.customWeather;

		if (!customWeatherParameters) {
			console.warn('CustomWeatherStation: No custom weather data available, unable to custom forecast.');
			this.elem.querySelector('.main').innerHTML = 'No custom weather station data available';
			return;
		}

		let condition = customWeatherParameters.conditionText;
		if (condition.length > 15) {
			condition = `${condition.slice(0, 15)}...`;
		}

		// todo - this is a bit hacky - need to add unit conversions

		const iconImage = getWeatherIconFromIconLink(customWeatherParameters.weatherConditionCode, this.weatherParameters.timeZone);
		// const pressureArrow = getPressureArrow(this.data);

		const fill = {
			temp: customWeatherParameters.temperature + String.fromCharCode(176),
			condition,
			// wind: customWeatherParameters.windDirection.padEnd(3, '') + customWeatherParameters.windSpeed.toString().padStart(3, ' '),
			wind: customWeatherParameters.windDirection + customWeatherParameters.windSpeed,
			location: customWeatherParameters.locationCity,
			humidity: `${customWeatherParameters.humidity}%`,
			dewpoint: customWeatherParameters.dewPoint + String.fromCharCode(176),
			// ceiling: (customWeatherParameters.ceiling === 0 ? 'Unlimited' : customWeatherParameters.ceiling + customWeatherParameters.ceilingUnit),
			ceiling: (customWeatherParameters.ceiling === 0 ? 'Unlimited' : customWeatherParameters.ceiling),
			// visibility: customWeatherParameters.visibility + this.data.VisibilityUnit,
			visibility: customWeatherParameters.visibility,
			// pressure: `${customWeatherParameters.pressure}${this.data.PressureUnit}${pressureArrow}`,
			pressure: `${customWeatherParameters.pressure}`,
			cloud: customWeatherParameters.cloudCover ? `${customWeatherParameters.cloudCover}%` : 'N/A',
			// uv: this.data.UV ? this.data.UV : 'N/A',
			icon: { type: 'img', src: iconImage },
		};

		if (customWeatherParameters.windGust) fill['wind-gusts'] = `Gusts to ${customWeatherParameters.windGust}`;

		const area = this.elem.querySelector('.main');

		area.innerHTML = '';
		area.append(this.fillTemplate('weather', fill));

		this.finishDraw();
	}
}

const shortConditions = (_condition) => {
	let condition = _condition;
	condition = condition.replace(/Light/g, 'L');
	condition = condition.replace(/Heavy/g, 'H');
	condition = condition.replace(/Partly/g, 'P');
	condition = condition.replace(/Mostly/g, 'M');
	condition = condition.replace(/Few/g, 'F');
	condition = condition.replace(/Thunderstorm/g, 'T\'storm');
	condition = condition.replace(/ in /g, '');
	condition = condition.replace(/Vicinity/g, '');
	condition = condition.replace(/ and /g, ' ');
	condition = condition.replace(/Freezing Rain/g, 'Frz Rn');
	condition = condition.replace(/Freezing/g, 'Frz');
	condition = condition.replace(/Unknown Precip/g, '');
	condition = condition.replace(/L Snow Fog/g, 'L Snw/Fog');
	condition = condition.replace(/ with /g, '/');
	return condition;
};

// register display
registerDisplay(new CustomWeatherStation(13, 'custom-weather-station', false));
