// Air Quality Index (AQI)

import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getAirQualityPoint } from './utils/weather.mjs';
import ExperimentalFeatures from './utils/experimental.mjs';

class AirQualityForecast extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Air Quality', defaultActive);
		this.backgroundImage = loadImg('images/Background12.png');
		this.nearbyCities = [];
	}

	// We're setting the core data object; largely used for location data
	async getData(_weatherParameters) {
		const superResult = await super.getData(_weatherParameters);
		const weatherParameters = _weatherParameters ?? this.weatherParameters;

		this.data = weatherParameters;

		if (!superResult) return;
		this.setStatus(STATUS.loaded);
	}

	async getAirQualityData(_weatherParameters, _aqiData) {
		if (!super.getAqiData(_weatherParameters)) return;
		this.setStatus(STATUS.loading);

		// @todo - there's a problem where if the user changes location, the (local to this screen's) nearbyCities array isn't flushed. Or the display isn't flushed correctly...
		this.nearbyCities.length = 0;

		// Check if API data is available, if not present error message
		// Must also remove all templates from data screen ...
		if (!_aqiData) {
			const aqiContainer = this.elem.querySelector('.aqi-container');
			aqiContainer.innerHTML = '';

			console.error('AqiForecast: No aqi data provided, unable to load aqi forecast.');
			this.setStatus(STATUS.loaded);
		} else {
			const apiFailureContainer = this.elem.querySelector('.api-failure-container');
			if (apiFailureContainer !== null) {
				apiFailureContainer.innerHTML = '';
				apiFailureContainer.remove();
			}
			this.aqiData = await parseAirQualityData(_weatherParameters, _aqiData, this.data);
		}

		const nearbyCities = JSON.parse(localStorage.getItem('nearbyCitiesFromLocality'));

		if (nearbyCities && nearbyCities.length > 0 && ExperimentalFeatures.getExperimentalFlag()) {
			const citiesAqiData = await Promise.all(
				nearbyCities.map(async (city) => {
					const aqiData = await getAirQualityPoint(city.lat, city.lon);
					return { ...city, aqiData };
				}),
			);

			const formattedNearbyData = Array.from(
				new Set(
					citiesAqiData.map((cityAndData) => cityAndData.city),
				),
			).map((uniqueCity) => {
				const cityAndData = citiesAqiData.find((c) => c.city === uniqueCity);
				const coreData = {
					country: this.data.country,
					state: this.data.state,
					city: cityAndData.city,
				};
				return parseAirQualityData(_weatherParameters, cityAndData.aqiData, coreData);
			});

			// we only need 2 cities
			this.nearbyCities.push(...formattedNearbyData.slice(0, 2));
		}

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		// Fill template values
		const fill = {
			'aqi-location': `${this.aqiData?.location}`,
			'aqi-index': this.aqiData.aqi,
		};

		// // return the filled template
		const aqiForLocation = this.fillTemplate('aqi', fill);

		// fill with nearby cities
		const cities = this.nearbyCities.map((city) => {
			const cityFill = {
				'aqi-location': `${city?.location}`,
				'aqi-index': city.aqi,
			};

			// return the filled template
			return this.fillTemplate('aqi', cityFill);
		});

		// empty and update the container
		const aqiContainer = this.elem.querySelector('.aqi-container');
		aqiContainer.innerHTML = '';
		aqiContainer.append(aqiForLocation);
		aqiContainer.append(...cities);

		// Find all chart images (one for main location, others for nearby cities)
		const chartImages = this.elem.querySelectorAll('.chart img');
		const availableWidth = 300;
		const availableHeight = 36;

		// Draw main location AQI bar
		if (chartImages[0]) {
			const canvasMain = document.createElement('canvas');
			canvasMain.width = availableWidth;
			canvasMain.height = availableHeight;
			const ctxMain = canvasMain.getContext('2d');
			ctxMain.imageSmoothingEnabled = false;
			drawAQIBar(ctxMain, this.aqiData.aqi);
			chartImages[0].width = availableWidth;
			chartImages[0].height = availableHeight;
			chartImages[0].src = canvasMain.toDataURL();
		}

		// Draw AQI bars for nearby cities
		this.nearbyCities.forEach((nCity, index) => {
			const img = chartImages[index + 1];
			if (img) {
				const canvasCity = document.createElement('canvas');
				canvasCity.width = availableWidth;
				canvasCity.height = availableHeight;
				const ctxCity = canvasCity.getContext('2d');
				ctxCity.imageSmoothingEnabled = false;
				drawAQIBar(ctxCity, nCity.aqi);
				img.width = availableWidth;
				img.height = availableHeight;
				img.src = canvasCity.toDataURL();
			}
		});

		super.drawCanvas();
		this.finishDraw();
	}
}

const getBarWidthFromAQI = (value) => {
	const scale = [
		{ aqi: 0, px: 0 },
		{ aqi: 50, px: 60 },
		{ aqi: 100, px: 120 },
		{ aqi: 150, px: 180 },
		{ aqi: 200, px: 220 },
		{ aqi: 300, px: 300 },
		{ aqi: 500, px: 300 },
	];

	// Clamp AQI value to 0–500
	const aqi = Math.max(0, Math.min(value, 500));

	// Find range
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < scale.length - 1; i++) {
		const left = scale[i];
		const right = scale[i + 1];
		if (aqi >= left.aqi && aqi <= right.aqi) {
			const ratio = (aqi - left.aqi) / (right.aqi - left.aqi);
			return left.px + ratio * (right.px - left.px);
		}
	}

	return 300; // fallback (shouldn’t hit)
};

const drawAQIBar = (ctx, value) => {
	const height = 36;
	const barHeight = 24;
	const baseColor = '#9DAAA3';
	const lightColor = '#DAD6D4';
	const darkColor = '#040802';
	const bevel = 4;
	const barWidth = getBarWidthFromAQI(value);
	const barY = (height - barHeight) / 2;
	// Left bevel
	ctx.fillStyle = lightColor;
	ctx.beginPath();
	ctx.moveTo(0, barY);
	ctx.lineTo(bevel, barY + bevel);
	ctx.lineTo(bevel, barY + barHeight - bevel);
	ctx.lineTo(0, barY + barHeight);
	ctx.closePath();
	ctx.fill();

	// Right bevel
	ctx.fillStyle = darkColor;
	ctx.beginPath();
	ctx.moveTo(barWidth, barY);
	ctx.lineTo(barWidth - bevel, barY + bevel);
	ctx.lineTo(barWidth - bevel, barY + barHeight - bevel);
	ctx.lineTo(barWidth, barY + barHeight);
	ctx.closePath();
	ctx.fill();

	// Top bevel
	ctx.fillStyle = lightColor;
	ctx.beginPath();
	ctx.moveTo(bevel, barY + bevel);
	ctx.lineTo(barWidth - bevel, barY + bevel);
	ctx.lineTo(barWidth, barY);
	ctx.lineTo(0, barY);
	ctx.closePath();
	ctx.fill();

	// Bottom bevel
	ctx.fillStyle = darkColor;
	ctx.beginPath();
	ctx.moveTo(0, barY + barHeight);
	ctx.lineTo(barWidth, barY + barHeight);
	ctx.lineTo(barWidth - bevel, barY + barHeight - bevel);
	ctx.lineTo(bevel, barY + barHeight - bevel);
	ctx.closePath();
	ctx.fill();

	// Center fill
	ctx.fillStyle = baseColor;
	ctx.fillRect(bevel, barY + bevel, barWidth - bevel * 2, barHeight - bevel * 2);
};

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

const parseAirQualityData = (_weatherParameters, aqiData, coreData) => {
	const todayDate = aqiData.hourly.time?.[0];
	const todayName = todayDate ? new Date(todayDate).toLocaleDateString(undefined, { weekday: 'long', timeZone: _weatherParameters.timezone }) : 'Today';

	const today = {
		text: todayName,
		country: coreData.country,
		state: coreData.state,
		location: coreData.city,
		aqi: Math.floor(aggregateHourlyData(aqiData.hourly.pm2_5, 0, 24)),
	};

	return today;
};

// register display
registerDisplay(new AirQualityForecast(12, 'aqi-forecast'));
