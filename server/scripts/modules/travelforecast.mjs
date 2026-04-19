// travel forecast display
import STATUS from './status.mjs';
import { json } from './utils/fetch.mjs';
import { getWeatherRegionalIconFromIconLink } from './icons.mjs';
import { DateTime } from '../vendor/auto/luxon.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';
import ConversionHelpers from './utils/conversionHelpers.mjs';

const czechTravelCities = [
	{ Name: 'Praha', lat: 50.0880, lon: 14.4207 },
	{ Name: 'Brno', lat: 49.1951, lon: 16.6068 },
	{ Name: 'Ostrava', lat: 49.8209, lon: 18.2625 },
	{ Name: 'Plzeň', lat: 49.7384, lon: 13.3736 },
	{ Name: 'Liberec', lat: 50.7671, lon: 15.0562 },
	{ Name: 'Olomouc', lat: 49.5938, lon: 17.2509 },
	{ Name: 'Č. Budějovice', lat: 48.9745, lon: 14.4743 },
	{ Name: 'Hr. Králové', lat: 50.2104, lon: 15.8328 },
	{ Name: 'Ústí n. L.', lat: 50.6607, lon: 14.0322 },
	{ Name: 'Pardubice', lat: 50.0408, lon: 15.7766 },
	{ Name: 'Zlín', lat: 49.2265, lon: 17.6628 },
	{ Name: 'Karlovy Vary', lat: 50.2305, lon: 12.8725 }
];

class TravelForecast extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		// special height and width for scrolling
		super(navId, elemId, 'Travel Forecast', defaultActive);

		// Remove from loading screen
		this.showOnProgress = true;

		// set up the timing
		this.timing.baseDelay = 20;
		// page sizes are 4 cities, calculate the number of pages necessary plus overflow
		const pagesFloat = czechTravelCities.length / 4;
		const pages = Math.floor(pagesFloat) - 2; // first page is already displayed, last page doesn't happen
		const extra = pages % 1;
		const timingStep = 75 * 4;
		this.timing.delay = [150 + timingStep];
		// add additional pages
		for (let i = 0; i < pages; i += 1) this.timing.delay.push(timingStep);
		// add the extra (not exactly 4 pages portion)
		if (extra !== 0) this.timing.delay.push(Math.round(this.extra * this.cityHeight));
		// add the final 3 second delay
		this.timing.delay.push(150);
	}

	// Tímto přepíšeme název pouze pro zaškrtávací políčko v menu dole
	generateCheckbox(defaultEnabled = true) {
		const label = super.generateCheckbox(defaultEnabled);
		if (label) label.querySelector('span').innerHTML = 'Cestovní předpověď';
		return label;
	}

	async getData() {
		// super checks for enabled
		if (!super.getData()) return;
		const forecastPromises = czechTravelCities.map(async (city) => {
			try {
				const forecast = await json(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
				const currentHour = new Date().getHours();
				const todayShift = currentHour >= 16 ? 1 : 0;
				const wmoCode = forecast.daily.weather_code[todayShift];
				return {
					today: todayShift === 0,
					high: ConversionHelpers.convertTemperatureUnits(forecast.daily.temperature_2m_max[todayShift]),
					low: ConversionHelpers.convertTemperatureUnits(forecast.daily.temperature_2m_min[todayShift]),
					name: city.Name,
					icon: getWeatherRegionalIconFromIconLink(getConditionText(wmoCode), true),
				};
			} catch (error) {
				console.error(`GetTravelWeather for ${city.Name} failed`);
				return { name: city.Name, error: true };
			}
		});

		// wait for all forecasts
		const forecasts = await Promise.all(forecastPromises);
		this.data = forecasts;

		// test for some data available in at least one forecast
		const hasData = this.data.some((forecast) => forecast.high);
		if (!hasData) {
			this.setStatus(STATUS.noData);
			return;
		}

		this.setStatus(STATUS.loaded);
		this.drawLongCanvas();
	}

	async drawLongCanvas() {
		// get the element and populate
		const list = this.elem.querySelector('.travel-lines');
		list.innerHTML = '';

		// set up variables
		const cities = this.data;

		const lines = cities.map((city) => {
			if (city.error) return false;
			const fillValues = {
				city,
			};

			// check for forecast data
			if (city.icon) {
				fillValues.city = city.name;
				// get temperatures and convert if necessary
				const { low, high } = city;

				// convert to strings with no decimal
				const lowString = Math.round(low).toString();
				const highString = Math.round(high).toString();

				fillValues.low = lowString;
				fillValues.high = highString;
				const { icon } = city;

				fillValues.icon = { type: 'img', src: icon };
			} else {
				fillValues.error = 'DATA NEJSOU K DISPOZICI';
			}
			return this.fillTemplate('travel-row', fillValues);
		}).filter((d) => d);
		list.append(...lines);
	}

	async drawCanvas() {
		// there are technically 2 canvases: the standard canvas and the extra-long canvas that contains the complete
		// list of cities. The second canvas is copied into the standard canvas to create the scroll
		super.drawCanvas();

		// set up variables
		const cities = this.data;

		this.elem.querySelector('.header .title.dual .bottom').innerHTML = `Na ${getTravelCitiesDayName(cities)}`;

		this.finishDraw();
	}

	async showCanvas() {
		// special to travel forecast to draw the remainder of the canvas
		await this.drawCanvas();
		super.showCanvas();
	}

	// screen index change callback just runs the base count callback
	screenIndexChange() {
		this.baseCountChange(this.navBaseCount);
	}

	// base count change callback
	baseCountChange(count) {
		// calculate scroll offset and don't go past end
		let offsetY = Math.min(this.elem.querySelector('.travel-lines').offsetHeight - 289, (count - 150));

		// don't let offset go negative
		if (offsetY < 0) offsetY = 0;

		// copy the scrolled portion of the canvas
		this.elem.querySelector('.main').scrollTo(0, offsetY);
	}

	// necessary to get the lastest long canvas when scrolling
	getLongCanvas() {
		return this.longCanvas;
	}
}

// effectively returns early on the first found date
const getTravelCitiesDayName = (cities) => cities.reduce((dayName, city) => {
	if (city && dayName === '') {
		// today or tomorrow
		const day = DateTime.local().plus({ days: (city.today) ? 0 : 1 });
		const czechDaysAccusative = ['Pondělí', 'Úterý', 'Středu', 'Čtvrtek', 'Pátek', 'Sobotu', 'Neděli'];
		// return the day
		return czechDaysAccusative[day.weekday - 1];
	}
	return dayName;
}, '');

// register display, not active by default
registerDisplay(new TravelForecast(5, 'travel', false));
