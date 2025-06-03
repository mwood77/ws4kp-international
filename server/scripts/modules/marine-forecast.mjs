// Marine Forecast Display

import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { directionToNSEW } from './utils/calc.mjs';
import { kphToKnots, metersToFeet } from './utils/units.mjs';
import { aggregateWeatherForecastData } from './utils/weather.mjs';

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
			min: Math.round(kphToKnots(Math.min(...tonightWindSpeedValues))),
			max: Math.round(kphToKnots(Math.max(...tonightWindSpeedValues))),
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

		this.marineData = parseMarineData(_marineData);
		this.data = this.handleWindSpeed(_weatherParameters);

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();

		console.log('Marine data', this.marineData);
		console.log('data', this.data.windSpeed);

		const advisoryFill = {
			message: 'SMALL CRAFT ADVISORY', // @todo: this is a placeholder, should be derived from wave height and period
		};
		this.fillTemplate('advisory', advisoryFill);	// @todo: this isn't filling the template, need to fix this

		// create each day template
		const days = this.marineData.map((period) => {
			const fill = {
				// icon: { type: 'img', src: Day.icon }, // @todo: add icon support for marine forecast
				date: period.text,
				'wind-direction': period.windWaveDirection,
				'wind-speed': `${this.data.windSpeed[period.text.toLowerCase()].min}-${this.data.windSpeed[period.text.toLowerCase()].max}kts`,
				'wave-height': `${metersToFeet(period.waveHeight)}'`,
				'wave-condition': 'CHOPPY', // @todo: this is a placeholder, should be derived from wave height and period
			};

			const { low } = period;
			if (low !== undefined) {
				fill['value-lo'] = period.swellWaveHeight;
			}

			const { high } = period;
			if (high !== undefined) {
				fill['value-hi'] = period.swellWaveHeight;
			}

			// return the filled template
			return this.fillTemplate('day', fill);
		});

		// empty and update the container
		const dayContainer = this.elem.querySelector('.day-container');
		dayContainer.innerHTML = '';
		dayContainer.append(...days);
		this.finishDraw();

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
registerDisplay(new MarineForecast(12, 'marine-forecast', true));
