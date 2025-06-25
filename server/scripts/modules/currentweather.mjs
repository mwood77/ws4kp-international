// current weather conditions display
import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import { directionToNSEW } from './utils/calc.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class CurrentWeather extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Current Conditions', true);
		// pre-load background image (returns promise)
		this.backgroundImage = loadImg('images/BackGround1_1.png');
	}

	async getData(_weatherParameters) {
		// always load the data for use in the lower scroll
		const superResult = super.getData(_weatherParameters);
		const weatherParameters = _weatherParameters ?? this.weatherParameters;

		// we only get here if there was no error above
		this.data = parseData(weatherParameters);
		this.getDataCallback();

		// stop here if we're disabled
		if (!superResult) return;

		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		let condition = getConditionText(this.data.TextConditions);
		if (condition.length > 15) {
			condition = shortConditions(condition);
		}

		const iconImage = getWeatherIconFromIconLink(condition, this.data.timeZone);
		const pressureArrow = getPressureArrow(this.data);

		const fill = {
			temp: this.data.Temperature + String.fromCharCode(176),
			condition,
			wind: this.data.WindDirection.padEnd(3, '') + this.data.WindSpeed.toString().padStart(3, ' '),
			location: this.data.city,
			humidity: `${this.data.Humidity}%`,
			dewpoint: this.data.DewPoint + String.fromCharCode(176),
			ceiling: (this.data.Ceiling === 0 ? 'Unlimited' : this.data.Ceiling + this.data.CeilingUnit),
			visibility: this.data.Visibility + this.data.VisibilityUnit,
			pressure: `${this.data.Pressure} ${this.data.PressureUnit}${pressureArrow}`,
			cloud: this.data.CloudCover ? `${this.data.CloudCover}%` : 'N/A',
			uv: this.data.UV ? this.data.UV : 'N/A',
			icon: { type: 'img', src: iconImage },
		};

		if (this.data.WindGust) fill['wind-gusts'] = `Gusts to ${this.data.WindGust}`;

		const area = this.elem.querySelector('.main');

		area.innerHTML = '';
		area.append(this.fillTemplate('weather', fill));

		this.finishDraw();
	}

	// make data available outside this class
	// promise allows for data to be requested before it is available
	async getCurrentWeather(stillWaiting) {
		if (stillWaiting) this.stillWaitingCallbacks.push(stillWaiting);
		return new Promise((resolve) => {
			if (this.data) resolve(this.data);
			// data not available, put it into the data callback queue
			this.getDataCallbacks.push(() => resolve(this.data));
		});
	}
}

const getPressureArrow = (data) => {
	let arrow = '';
	if (data.PressureDirection === 'rising') arrow = '<img class="pressure-arrow" src=\'images/pressure-arrow.png\'></img>';
	if (data.PressureDirection === 'falling') arrow = '<img class="pressure-arrow invert-pressure-arrow" src=\'images/pressure-arrow.png\'></img>';
	return arrow;
};

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

const getCurrentWeatherByHourFromTime = (data) => {
	const currentTime = new Date();
	const onlyDate = currentTime.toLocaleDateString('en-CA', { timeZone: data.timeZone }).split('T')[0]; // Extracts "YYYY-MM-DD"

	const availableTimes = data.forecast[onlyDate].hours;

	const closestTime = availableTimes.reduce((prev, curr) => {
		const prevDiff = Math.abs(new Date(prev.time) - currentTime);
		const currDiff = Math.abs(new Date(curr.time) - currentTime);
		return currDiff < prevDiff ? curr : prev;
	});

	// Find forecast from 3 hours ago
	const threeHoursAgo = new Date(currentTime.getTime() - 3 * 60 * 60 * 1000);
	const previousHour = availableTimes
		.filter((entry) => new Date(entry.time) <= currentTime && new Date(entry.time) >= threeHoursAgo)
		.reduce((prev, curr) => {
			const prevDiff = Math.abs(new Date(prev.time) - threeHoursAgo);
			const currDiff = Math.abs(new Date(curr.time) - threeHoursAgo);
			return currDiff < prevDiff ? curr : prev;
		}, availableTimes[0]);

	const diff = closestTime.pressure_msl - previousHour.pressure_msl;

	// raw value is always in hPa
	if (diff > 0.5) {
		closestTime.pressureTrend = 'rising';
	} else if (diff < -0.5) {
		closestTime.pressureTrend = 'falling';
	} else {
		closestTime.pressureTrend = 'steady';
	}

	// Append previous pressure point
	closestTime.previous_pressure_msl = previousHour.pressure_msl;

	// Append daily uv index max to the closest time
	closestTime.uv_index_max = data.forecast[onlyDate].uv_index_max;

	return closestTime;
};

// format the received data
const parseData = (data) => {
	const currentForecast = getCurrentWeatherByHourFromTime(data);

	// values from api are provided in metric
	data.Temperature = ConversionHelpers.convertTemperatureUnits(currentForecast.temperature_2m);
	data.TemperatureUnit = ConversionHelpers.getTemperatureUnitText();
	data.DewPoint = ConversionHelpers.convertTemperatureUnits(currentForecast.dew_point_2m);
	data.Ceiling = ConversionHelpers.convertDistanceUnits(ConversionHelpers.calculateCeilingInKM(currentForecast.temperature_2m, currentForecast.dew_point_2m));
	data.CeilingUnit = ConversionHelpers.getDistanceUnitText();
	data.Visibility = ConversionHelpers.convertDistanceUnits((currentForecast.visibility / 1000));
	data.VisibilityUnit = ConversionHelpers.getDistanceUnitText();
	data.WindSpeed = ConversionHelpers.convertWindUnits(currentForecast.wind_speed_10m);
	data.WindDirection = directionToNSEW(currentForecast.wind_direction_10m);
	data.Pressure = ConversionHelpers.convertPressureUnits(currentForecast.pressure_msl);
	data.CloudCover = currentForecast.cloud_cover ? currentForecast.cloud_cover : 0;
	data.UV = Math.round(currentForecast.uv_index_max);
	// data.HeatIndex = Math.round(observations.heatIndex.value);
	// data.WindChill = Math.round(observations.windChill.value);
	data.WindGust = ConversionHelpers.convertWindUnits(currentForecast.wind_gusts_10m);
	data.WindUnit = ConversionHelpers.getWindUnitText();
	data.Humidity = currentForecast.relative_humidity_2m;
	data.PressureUnit = ConversionHelpers.getPressureUnitText();
	data.PressureDirection = currentForecast.pressureTrend;
	data.TextConditions = currentForecast.weather_code;

	return data;
};

const display = new CurrentWeather(1, 'current-weather');
registerDisplay(display);

export default display.getCurrentWeather.bind(display);
