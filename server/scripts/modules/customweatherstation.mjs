// custom weather station display, similar to current weather but based on a user-defined station
import STATUS from './status.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class CustomWeatherStation extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Personal Weather Station', false, defaultActive);

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
			console.warn('CustomWeatherStation: No custom weather data available, unable to render custom forecast.');
			this.finishDraw();
			return;
		}

		let condition = getConditionText(customWeatherParameters.conditionText);
		if (condition.length > 15) {
			condition = `${condition.slice(0, 15)}...`;
		}

		const iconImage = getWeatherIconFromIconLink(customWeatherParameters.conditionText, this.weatherParameters.timeZone);

		const fill = {
			temp: ConversionHelpers.convertTemperatureUnits(customWeatherParameters.temperature) + String.fromCharCode(176),
			condition,
			// wind: customWeatherParameters.windDirection.padEnd(3, '') + customWeatherParameters.windSpeed.toString().padStart(3, ' '),
			wind: customWeatherParameters.windDirection + ConversionHelpers.convertWindUnits(customWeatherParameters.windSpeed),
			location: customWeatherParameters.locationCity,
			humidity: `${customWeatherParameters.humidity}%`,
			dewpoint: ConversionHelpers.convertTemperatureUnits(customWeatherParameters.dewPoint) + String.fromCharCode(176),
			visibility: ConversionHelpers.convertDistanceUnits(customWeatherParameters.visibility) + ConversionHelpers.getDistanceUnitText(),
			pressure: `${Math.floor(ConversionHelpers.convertPressureUnits(customWeatherParameters.pressure)) + ConversionHelpers.getPressureUnitText()}`,
			uv: customWeatherParameters.uvIndex ? customWeatherParameters.uvIndex : 'N/A',
			icon: { type: 'img', src: iconImage },
		};

		if (customWeatherParameters.windGust) fill['wind-gusts'] = `Gusts to ${customWeatherParameters.windGust}`;

		const area = this.elem.querySelector('.main');

		area.innerHTML = '';
		area.append(this.fillTemplate('weather', fill));

		this.finishDraw();
	}
}

// register display
registerDisplay(new CustomWeatherStation(13, 'custom-weather-station', false));
