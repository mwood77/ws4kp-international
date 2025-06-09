// Air Quality Index (AQI)

import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';

class AirQualityForecast extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Air Quality', defaultActive);
		this.backgroundImage = loadImg('images/BackGround9_1.png');
	}

	// Override because the loading state isn't registering in getMarineData
	// eslint-disable-next-line no-unused-vars
	async getData(_weatherParameters) { this.setStatus(STATUS.loaded); }

	async getAirQualityData(_weatherParameters, _aqiData) {
		if (!super.getMarineData(_weatherParameters)) return;
		this.setStatus(STATUS.loading);

		console.debug(`Weather Params: ${JSON.stringify(_weatherParameters)}`);
		console.debug(`AQI Params: ${_aqiData}`);

		this.aqiData = parseAirQualityData(_weatherParameters, _aqiData);

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		console.log('Drawing Air Quality Forecast...');
		console.log(this.aqiData);

		// Set weekday name in header
		// @todo - this isn't working
		const bottomTitleEl = document.getElementById('dualTitle');
		console.log(`Bottom Title Element: ${JSON.stringify(bottomTitleEl)}`);
		if (bottomTitleEl && this.aqiData?.text) {
			console.log(`Setting bottom title to: ${this.aqiData.text}`);
			bottomTitleEl.textContent = this.aqiData.text;
		}

		// const waveConditionText = this.marineData.map((period) => calculateSeasCondition(period).toUpperCase());

		// const time = new Date();
		// const isAfterFivePM = time.getHours() >= 17;
		// const advisoryText = isAfterFivePM ? getMarineAdvisory(this.marineData[1], this.data.windSpeed) : getMarineAdvisory(this.marineData[0], this.data.windSpeed);

		// const advisoryFill = {
		// 	message: advisoryText,
		// };

		// // create each day template
		// const days = this.marineData.map((period, index) => {
		// 	const fill = {
		// 		'wave-icon': { type: 'img', src: getWaveIconFromCondition(waveConditionText[index]) },
		// 		date: period.text,
		// 		'wind-direction': period.windWaveDirection,
		// 		'wind-speed': `${this.data.windSpeed[period.text.toLowerCase()].min}-${this.data.windSpeed[period.text.toLowerCase()].max}${ConversionHelpers.getMarineWindUnitText()}`,
		// 		'wave-height': `${ConversionHelpers.convertWaveHeightUnits(period.waveHeight)}${ConversionHelpers.getWaveHeightUnitText()}`,
		// 		'wave-condition': `${waveConditionText[index]}`,
		// 	};

		// 	// return the filled template
		// 	return this.fillTemplate('day', fill);
		// });

		// // empty and update the container
		// const dayContainer = this.elem.querySelector('.day-container');
		// dayContainer.innerHTML = '';
		// dayContainer.append(...days);

		// const advisoryContainer = this.elem.querySelector('.advisory-container');
		// advisoryContainer.classList.add('hidden-border');
		// advisoryContainer.innerHTML = '';

		// if (advisoryText !== '') {
		// 	const preparedTemplate = this.fillTemplate('advisory', advisoryFill);
		// 	advisoryContainer.append(preparedTemplate);
		// 	advisoryContainer.classList.remove('hidden-border');
		// }

		this.finishDraw();
	}
}

const aggregateHourlyData = (hourlyDataArray, startingPosition, endingPosition) => {
	if (!hourlyDataArray || hourlyDataArray.length === 0) {
		console.error('AirQuality: aggregateHourlyData() - No hourly data available for aggregation');
	}
	const start = startingPosition || 0;
	const end = endingPosition || hourlyDataArray.length;

	const selectedHours = hourlyDataArray.slice(start, end);

	const average = Math.round((selectedHours.reduce((sum, value) => sum + value, 0) / selectedHours.length) * 100) / 100;

	return average;
};

const parseAirQualityData = (weatherParameters, aqiData) => {
	const todayDate = aqiData.hourly.time?.[0];
	const todayName = todayDate ? new Date(todayDate).toLocaleDateString(undefined, { weekday: 'long', timeZone: weatherParameters.timezone }) : 'Today';

	const today = {
		text: todayName,
		aqi: Math.floor(aggregateHourlyData(aqiData.hourly.pm2_5, 0, 24)),
	};

	return today;
};

// register display
registerDisplay(new AirQualityForecast(12, 'aqi-forecast'));
