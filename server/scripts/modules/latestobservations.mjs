// current weather conditions display
import { distance as calcDistance, directionToNSEW } from './utils/calc.mjs';
import { json } from './utils/fetch.mjs';
import STATUS from './status.mjs';
import { locationCleanup } from './utils/string.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';
import ConversionHelpers from './utils/conversionHelpers.mjs';

// Seznam českých měst pro pozorování okolí
const czechObservationStations = [
	{ city: 'Praha', lat: 50.0880, lon: 14.4207 },
	{ city: 'Brno', lat: 49.1951, lon: 16.6068 },
	{ city: 'Ostrava', lat: 49.8209, lon: 18.2625 },
	{ city: 'Plzeň', lat: 49.7384, lon: 13.3736 },
	{ city: 'Liberec', lat: 50.7671, lon: 15.0562 },
	{ city: 'Olomouc', lat: 49.5938, lon: 17.2509 },
	{ city: 'Č. Budějovice', lat: 48.9745, lon: 14.4743 },
	{ city: 'Hr. Králové', lat: 50.2104, lon: 15.8328 },
	{ city: 'Ústí n. L.', lat: 50.6607, lon: 14.0322 },
	{ city: 'Pardubice', lat: 50.0408, lon: 15.7766 },
	{ city: 'Zlín', lat: 49.2265, lon: 17.6628 },
	{ city: 'Karlovy Vary', lat: 50.2305, lon: 12.8725 },
	{ city: 'Jihlava', lat: 49.3961, lon: 15.5904 },
	{ city: 'Chomutov', lat: 50.4605, lon: 13.4178 },
	{ city: 'Kladno', lat: 50.1473, lon: 14.1028 }
];

class LatestObservations extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Nejnovější pozorování', false);

		// constants
		this.MaximumRegionalStations = 7;
		this.showOnProgress = false;
	}

	async getData(_weatherParameters) {
		if (!super.getData(_weatherParameters)) return;
		const weatherParameters = _weatherParameters ?? this.weatherParameters;

		// calculate distance to each station
		const stationsByDistance = czechObservationStations.map((station) => {
			const distance = calcDistance(station.lat, station.lon, weatherParameters.latitude, weatherParameters.longitude);
			return { ...station, distance };
		});

		// sort the stations by distance
		const sortedStations = stationsByDistance.sort((a, b) => a.distance - b.distance);

		// Vezmeme nejbližších 7 měst pro zobrazení
		const regionalStations = sortedStations.slice(0, 7);

		const stationData = await Promise.all(regionalStations.map(async (station) => {
			try {
				const data = await json(`https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current_weather=true&timezone=auto`, { retryCount: 1, stillWaiting: () => this.stillWaiting() });
				if (!data || !data.current_weather) return false;
				return { city: station.city, temperature: data.current_weather.temperature, windSpeed: data.current_weather.windspeed, windDirection: data.current_weather.winddirection, weatherCode: data.current_weather.weathercode };
			} catch (error) {
				console.error(`Unable to get latest observations for ${station.city}`);
				return false;
			}
		}));

		this.data = stationData.filter(d => d).slice(0, this.MaximumRegionalStations);

		// test for at least one station
		if (this.data.length === 0) {
			this.setStatus(STATUS.noData);
			return;
		}
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();
		const conditions = this.data;

		// sort array by station name
		const sortedConditions = conditions.sort((a, b) => ((a.city < b.city) ? -1 : 1));

		if (ConversionHelpers.getTemperatureUnitText() === 'C') {
			this.elem.querySelector('.column-headers .temp.english').classList.remove('show');
			this.elem.querySelector('.column-headers .temp.metric').classList.add('show');
		} else {
			this.elem.querySelector('.column-headers .temp.english').classList.add('show');
			this.elem.querySelector('.column-headers .temp.metric').classList.remove('show');
		}

		const czechConditions = {
			'Clear sky': 'Jasno', 'Mainly clear': 'Většinou jasno', 'Partly cloudy': 'Polojasno',
			'Overcast': 'Zataženo', 'Fog': 'Mlha', 'Depositing rime fog': 'Mrznoucí mlha',
			'Light Drizzle': 'Sl. mrhol.', 'Moderate Drizzle': 'Mír. mrhol.', 'Dense Drizzle': 'Husté mrhol.',
			'Light Freezing Drizzle': 'Sl. mrz. mrhol.', 'Dense Freezing Drizzle': 'Sil. mrz. mrhol.',
			'Slight Rain': 'Slabý déšť', 'Moderate Rain': 'Mírný déšť', 'Heavy Rain': 'Silný déšť',
			'Light Freezing Rain': 'Sl. mrz. déšť', 'Heavy Freezing Rain': 'Sil. mrz. déšť',
			'Slight Snow fall': 'Slabé sněž.', 'Moderate Snow fall': 'Mírné sněž.', 'Heavy Snow fall': 'Silné sněž.',
			'Snow grains': 'Sněhová zrna', 'Slight Rain showers': 'Slabé přeh.', 'Moderate Rain showers': 'Mírné přeh.',
			'Violent Rain showers': 'Silné přeh.', 'Slight Snow showers': 'Sl. sněh. přeh.',
			'Heavy Snow Showers': 'Sil. sněh. přeh.', 'Thunderstorm': 'Bouřka',
			'Thunderstorm with slight hail': 'Bouřka, sl. kr.', 'Thunderstorm with heavy hail': 'Bouřka, sil. kr.'
		};

		const lines = sortedConditions.map((condition) => {
			const engDir = directionToNSEW(condition.windDirection);
			const directionTranslations = {
				'N': 'S', 'NNE': 'SSV', 'NE': 'SV', 'ENE': 'VSV', 'E': 'V', 'ESE': 'VJV', 'SE': 'JV', 'SSE': 'JJV',
				'S': 'J', 'SSW': 'JJZ', 'SW': 'JZ', 'WSW': 'ZJZ', 'W': 'Z', 'WNW': 'ZSZ', 'NW': 'SZ', 'NNW': 'SSZ'
			};
			const windDirection = directionTranslations[engDir] || engDir;

			const Temperature = Math.round(ConversionHelpers.convertTemperatureUnits(condition.temperature));
			const WindSpeed = Math.round(ConversionHelpers.convertWindUnits(condition.windSpeed));

			const engCondition = getConditionText(condition.weatherCode);
			const czCondition = czechConditions[engCondition] || engCondition;

			const fill = {
				location: locationCleanup(condition.city).substr(0, 14),
				temp: Temperature,
				weather: czCondition.substr(0, 14),
			};

			if (WindSpeed > 0) {
				fill.wind = windDirection + (Array(6 - windDirection.length - WindSpeed.toString().length).join(' ')) + WindSpeed.toString();
			} else {
				fill.wind = 'Klid';
			}

			return this.fillTemplate('observation-row', fill);
		});

		const linesContainer = this.elem.querySelector('.observation-lines');
		linesContainer.innerHTML = '';
		linesContainer.append(...lines);

		this.finishDraw();
	}
}
// register display
registerDisplay(new LatestObservations(2, 'latest-observations'));
