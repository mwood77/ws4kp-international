// regional forecast and observations
// type 0 = observations, 1 = first forecast, 2 = second forecast

import STATUS from './status.mjs';
import { distance as calcDistance } from './utils/calc.mjs';
import { json } from './utils/fetch.mjs';
import { celsiusToFahrenheit } from './utils/units.mjs';
import { getWeatherRegionalIconFromIconLink } from './icons.mjs';
import { preloadImg } from './utils/image.mjs';
import { DateTime } from '../vendor/auto/luxon.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import * as utils from './regionalforecast-utils.mjs';
import { getPoint, getConditionText } from './utils/weather.mjs';
import ConversionHelpers from './utils/conversionHelpers.mjs';

class RegionalForecast extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Regional Forecast', false);
		this.showOnProgress = false;

		// timings
		this.timing.totalScreens = 3;
	}

	// Přepíšeme název pouze pro zaškrtávací políčko v menu
	generateCheckbox(defaultEnabled = true) {
		const label = super.generateCheckbox(defaultEnabled);
		if (label) label.querySelector('span').innerHTML = 'Regionální předpověď';
		return label;
	}

	async getData(_weatherParameters) {
		if (!super.getData(_weatherParameters)) return;

		// Použijeme stávající mapu. Tip: Nahraďte Basemap2.png za vlastní mapu ČR (640x480)!
		this.elem.querySelector('.map img').src = 'images/Basemap2.png';

		// Vlastní seznam českých měst pro regionální mapu
		const czechRegionalCities = [
			{ name: 'Praha', lat: 50.0880, lon: 14.4207 },
			{ name: 'Brno', lat: 49.1951, lon: 16.6068 },
			{ name: 'Ostrava', lat: 49.8209, lon: 18.2625 },
			{ name: 'Plzeň', lat: 49.7384, lon: 13.3736 },
			{ name: 'Liberec', lat: 50.7671, lon: 15.0562 },
			{ name: 'Č. Budějovice', lat: 48.9745, lon: 14.4743 },
		];

		const regionalDataAll = await Promise.all(czechRegionalCities.map(async (city) => {
			try {
				const forecast = await json(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);

				// Projekce pro ČR (v procentech)
				const percentX = (city.lon - 12.0) / 7.0;
				const percentY = (51.1 - city.lat) / 2.6;

				const currentWmo = forecast.current_weather.weathercode;
				const isDay = forecast.current_weather.is_day === 1;

				const regionalObservation = {
					daytime: isDay,
					temperature: ConversionHelpers.convertTemperatureUnits(Math.round(forecast.current_weather.temperature)),
					name: city.name,
					icon: getConditionText(currentWmo),
					x: percentX,
					y: percentY,
				};

				const todayWmo = forecast.daily.weather_code[0];
				const forecastToday = {
					daytime: true,
					temperature: ConversionHelpers.convertTemperatureUnits(Math.round(forecast.daily.temperature_2m_max[0])),
					name: city.name,
					icon: getConditionText(todayWmo),
					x: percentX,
					y: percentY,
					time: forecast.daily.time[0]
				};

				const tomorrowWmo = forecast.daily.weather_code[1];
				const forecastTomorrow = {
					daytime: true,
					temperature: ConversionHelpers.convertTemperatureUnits(Math.round(forecast.daily.temperature_2m_max[1])),
					name: city.name,
					icon: getConditionText(tomorrowWmo),
					x: percentX,
					y: percentY,
					time: forecast.daily.time[1]
				};

				preloadImg(getWeatherRegionalIconFromIconLink(regionalObservation.icon, !regionalObservation.daytime));

				return [regionalObservation, forecastToday, forecastTomorrow];
			} catch (error) {
				console.error(`No regional forecast data for '${city.name}'`, error);
				return false;
			}
		}));

		const regionalData = regionalDataAll.filter((data) => data);

		if (regionalData.length === 0) {
			this.setStatus(STATUS.noData);
			return;
		}

		this.data = { regionalData };
		this.setStatus(STATUS.loaded);
	}

	drawCanvas() {
		super.drawCanvas();
		const { regionalData: data } = this.data;

		const titleTop = this.elem.querySelector('.title.dual .top');
		const titleBottom = this.elem.querySelector('.title.dual .bottom');
		if (this.screenIndex === 0) {
			titleTop.innerHTML = 'Regionální';
			titleBottom.innerHTML = 'Pozorování';
		} else {
			const forecastDate = DateTime.fromISO(data[0][this.screenIndex].time);
			const czechDays = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
			const dayName = czechDays[forecastDate.weekday - 1];

			titleTop.innerHTML = 'Předpověď na';
			titleBottom.innerHTML = data[0][this.screenIndex].daytime
				? dayName
				: `${dayName} Noc`;
		}

		const map = this.elem.querySelector('.map');
		map.style.transform = 'none';
		map.style.position = 'absolute';
		map.style.left = '0px';
		map.style.top = '0px';
		map.style.margin = '0px';
		map.style.padding = '0px';
		map.style.width = '100%';
		map.style.height = '100%';

		const mapImg = this.elem.querySelector('.map img');
		if (mapImg) {
			mapImg.style.transform = 'none';
			mapImg.style.position = 'absolute';
			mapImg.style.left = '0px';
			mapImg.style.top = '0px';
			mapImg.style.margin = '0px';
			mapImg.style.padding = '0px';
			mapImg.style.width = '100%';
			mapImg.style.height = '100%';
			mapImg.style.objectFit = 'fill';
		}

		const cities = data.map((city) => {
			const fill = {};
			const period = city[this.screenIndex];

			fill.icon = { type: 'img', src: getWeatherRegionalIconFromIconLink(period.icon, !period.daytime) };
			fill.city = period.name;
			fill.temp = period.temperature;

			const elem = this.fillTemplate('location', fill);
			elem.style.left = `${period.x * 100}%`;
			elem.style.top = `${period.y * 100}%`;

			return elem;
		});

		const locationContainer = this.elem.querySelector('.location-container');
		locationContainer.innerHTML = '';
		locationContainer.append(...cities);

		this.finishDraw();
	}
}

// register display
registerDisplay(new RegionalForecast(6, 'regional-forecast'));
