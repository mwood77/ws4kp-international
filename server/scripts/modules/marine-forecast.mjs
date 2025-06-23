// Marine Forecast Display

import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getWaveIconFromCondition } from './icons.mjs';
import { directionToNSEW, calculateSeasCondition, getMarineAdvisory } from './utils/calc.mjs';
import { kphToKnots } from './utils/units.mjs';
import { aggregateWeatherForecastData } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class MarineForecast extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Marine Forecast', defaultActive);
		this.backgroundImage = loadImg('images/BackGround8_1.png');
	}

	// Override because the loading state isn't registering in getMarineData
	// eslint-disable-next-line no-unused-vars
	async getData(_weatherParameters) { this.setStatus(STATUS.loaded); }

	handleWindSpeed(_weatherParameters) {
		// aggregate wind speed data from conventional hourl weather data
		const aggregatedForecastData = aggregateWeatherForecastData(_weatherParameters);

		const currentTime = new Date();
		const onlyToday = currentTime.toLocaleDateString('en-CA', { timeZone: aggregatedForecastData.timeZone }).split('T')[0]; // Extracts "YYYY-MM-DD"

		// today wind speed
		const todayWindSpeedValues = aggregatedForecastData[onlyToday].hours.slice(0, 11).map((hour) => hour.wind_speed_10m);
		const averageTodayWindSpeed = {
			min: Math.round(kphToKnots(Math.min(...todayWindSpeedValues))),
			max: Math.round(kphToKnots(Math.max(...todayWindSpeedValues))),
		};

		// tonight wind speed
		const tonightWindSpeedValues = aggregatedForecastData[onlyToday].hours.slice(12, 24).map((hour) => hour.wind_speed_10m);
		const averageTonightWindSpeed = {
			min: ConversionHelpers.convertMarineWindUnitsFromKnots(Math.round(kphToKnots(Math.min(...tonightWindSpeedValues)))),
			max: ConversionHelpers.convertMarineWindUnitsFromKnots(Math.round(kphToKnots(Math.max(...tonightWindSpeedValues)))),
		};

		this.setStatus(STATUS.loaded);

		return {
			windSpeed: {
				today: averageTodayWindSpeed,
				tonight: averageTonightWindSpeed,
			},
		};
	}

	async getMarineData(_weatherParameters, _marineData) {
		if (!super.getMarineData(_marineData)) return;
		this.setStatus(STATUS.loading);

		// Check if API data is available, if not present error message
		// Must also remove all templates from data screen ...
		if (!_marineData) {
			const dayContainer = this.elem.querySelector('.day-container');
			const titleContainer = this.elem.querySelector('.title-container');
			const advisoryContainer = this.elem.querySelector('.advisory-container');
			dayContainer.innerHTML = '';
			titleContainer.innerHTML = '';
			advisoryContainer.innerHTML = '';
			advisoryContainer.classList.add('hidden-border');

			console.warn('MarineForecast: No marine data provided, unable to load marine forecast.');
			this.setStatus(STATUS.loaded);
		} else {
			const apiFailureContainer = this.elem.querySelector('.api-failure-container');
			if (apiFailureContainer !== null) {
				apiFailureContainer.innerHTML = '';
				apiFailureContainer.remove();
			}

			const titleContainer = this.elem.querySelector('.title-container');
			// set inner html title template on location re-load.
			// This typically happens when we get a marine API failure, but when
			// it recovers, we are still missing the title information.
			if (titleContainer.querySelectorAll('div').length === 0) {
				const titleContainerReplacementHtml = `
					<div class="title-container">
						<div class="title">WINDS:</div>
						<div class="title seas">SEAS:</div>
					</div>`;
				titleContainer.innerHTML = titleContainerReplacementHtml;
			}
			this.marineData = parseMarineData(_marineData);
			this.data = this.handleWindSpeed(_weatherParameters);
		}

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		if (!this.marineData) {
			this.finishDraw();
			return;
		}
		const waveConditionText = this.marineData.map((period) => calculateSeasCondition(period).toUpperCase());

		const time = new Date();
		const isAfterFivePM = time.getHours() >= 17;
		const advisoryText = isAfterFivePM ? getMarineAdvisory(this.marineData[1], this.data.windSpeed) : getMarineAdvisory(this.marineData[0], this.data.windSpeed);

		const advisoryFill = {
			message: advisoryText,
		};

		// create each day template
		const days = this.marineData.map((period, index) => {
			const fill = {
				'wave-icon': { type: 'img', src: getWaveIconFromCondition(waveConditionText[index]) },
				date: period.text,
				'wind-direction': period.windWaveDirection,
				'wind-speed': `${this.data.windSpeed[period.text.toLowerCase()].min}-${this.data.windSpeed[period.text.toLowerCase()].max}${ConversionHelpers.getMarineWindUnitText()}`,
				'wave-height': `${ConversionHelpers.convertWaveHeightUnits(period.waveHeight)}${ConversionHelpers.getWaveHeightUnitText()}`,
				'wave-condition': `${waveConditionText[index]}`,
			};

			// return the filled template
			return this.fillTemplate('day', fill);
		});

		// empty and update the container
		const dayContainer = this.elem.querySelector('.day-container');
		dayContainer.innerHTML = '';
		dayContainer.append(...days);

		const advisoryContainer = this.elem.querySelector('.advisory-container');
		advisoryContainer.classList.add('hidden-border');
		advisoryContainer.innerHTML = '';

		if (advisoryText !== '') {
			const preparedTemplate = this.fillTemplate('advisory', advisoryFill);
			advisoryContainer.append(preparedTemplate);
			advisoryContainer.classList.remove('hidden-border');
		}

		this.finishDraw();
	}
}

const aggregateHourlyData = (hourlyDataArray, startingPosition, endingPosition) => {
	if (!hourlyDataArray || hourlyDataArray.length === 0) {
		console.error('MarineForecast: aggregateHourlyData() - No hourly data available for aggregation');
	}
	const start = startingPosition || 0;
	const end = endingPosition || hourlyDataArray.length;

	const selectedHours = hourlyDataArray.slice(start, end);

	const average = Math.round((selectedHours.reduce((sum, value) => sum + value, 0) / selectedHours.length) * 100) / 100;

	return average;
};

const parseMarineData = (weatherParameters) => {
	const aggregatedMarineforecast = [];

	// construct "today" object
	const today = {
		text: 'Today',
		swellWaveDirection: directionToNSEW(Math.floor(aggregateHourlyData(weatherParameters.hourly.swell_wave_direction, 0, 11))),
		swellWaveHeight: aggregateHourlyData(weatherParameters.hourly.swell_wave_height, 0, 11),
		swellWavePeriod: aggregateHourlyData(weatherParameters.hourly.swell_wave_period, 0, 11),
		waveHeight: aggregateHourlyData(weatherParameters.hourly.wave_height, 0, 11),
		windWaveDirection: directionToNSEW(Math.floor(aggregateHourlyData(weatherParameters.hourly.wind_wave_direction, 0, 11))),
	};

	// construct "tonight" object
	const tonight = {
		text: 'Tonight',
		swellWaveDirection: directionToNSEW(Math.floor(aggregateHourlyData(weatherParameters.hourly.swell_wave_direction, 12, 23))),
		swellWaveHeight: aggregateHourlyData(weatherParameters.hourly.swell_wave_height, 12, 23),
		swellWavePeriod: aggregateHourlyData(weatherParameters.hourly.swell_wave_period, 12, 23),
		waveHeight: aggregateHourlyData(weatherParameters.hourly.wave_height, 12, 23),
		windWaveDirection: directionToNSEW(Math.floor(aggregateHourlyData(weatherParameters.hourly.wind_wave_direction, 12, 23))),
	};

	aggregatedMarineforecast.push(today, tonight);

	return aggregatedMarineforecast;
};

// register display
registerDisplay(new MarineForecast(11, 'marine-forecast'));
