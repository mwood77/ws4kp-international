import { elemForEach } from './utils/elem.mjs';
import getCurrentWeather from './currentweather.mjs';
import { currentDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

// constants
const degree = String.fromCharCode(176);

// local variables
let interval;
let screenIndex = 0;

// start drawing conditions
// reset starts from the first item in the text scroll list
const start = () => {
	// store see if the context is new

	// set up the interval if needed
	if (!interval) {
		interval = setInterval(incrementInterval, 4000);
	}

	// draw the data
	drawScreen();
};

const stop = (reset) => {
	if (reset) screenIndex = 0;
};

// increment interval, roll over
const incrementInterval = () => {
	// test current screen
	const display = currentDisplay();
	if (!display?.okToDrawCurrentConditions) {
		stop(display?.elemId === 'progress');
		return;
	}
	screenIndex = (screenIndex + 1) % (screens.length);
	// draw new text
	drawScreen();
};

const drawScreen = async () => {
	// get the conditions
	const data = await getCurrentWeather();

	// nothing to do if there's no data yet
	if (!data) return;

	drawCondition(screens[screenIndex](data));
};

const conditionTranslations = {
	'Clear sky': 'Jasno',
	'Mainly clear': 'Většinou jasno',
	'Partly cloudy': 'Polojasno',
	'Overcast': 'Zataženo',
	'Fog': 'Mlha',
	'Depositing rime fog': 'Mrznoucí mlha',
	'Light Drizzle': 'Slabé mrholení',
	'Moderate Drizzle': 'Mírné mrholení',
	'Dense Drizzle': 'Husté mrholení',
	'Light Freezing Drizzle': 'Sl. mrz. mrh.',
	'Dense Freezing Drizzle': 'Sil. mrz. mrh.',
	'Slight Rain': 'Slabý déšť',
	'Moderate Rain': 'Mírný déšť',
	'Heavy Rain': 'Silný déšť',
	'Light Freezing Rain': 'Slabý mrz. déšť',
	'Heavy Freezing Rain': 'Silný mrz. déšť',
	'Slight Snow fall': 'Slabé sněžení',
	'Moderate Snow fall': 'Mírné sněžení',
	'Heavy Snow fall': 'Silné sněžení',
	'Snow grains': 'Sněhová zrna',
	'Slight Rain showers': 'Slabé přeháňky',
	'Moderate Rain showers': 'Mírné přeháňky',
	'Violent Rain showers': 'Silné přeháňky',
	'Slight Snow showers': 'Sl. sněh. přeh.',
	'Heavy Snow Showers': 'Sil sněh. přeh.',
	'Thunderstorm': 'Bouřka',
	'Thunderstorm with slight hail': 'Bouřka, sl. kr.',
	'Thunderstorm with heavy hail': 'Bouřka, sil. kr.'
};

const directionTranslations = {
	'N': 'S', 'NNE': 'SSV', 'NE': 'SV', 'ENE': 'VSV', 'E': 'V', 'ESE': 'VJV', 'SE': 'JV', 'SSE': 'JJV',
	'S': 'J', 'SSW': 'JJZ', 'SW': 'JZ', 'WSW': 'ZJZ', 'W': 'Z', 'WNW': 'ZSZ', 'NW': 'SZ', 'NNW': 'SSZ'
};

// the "screens" are stored in an array for easy addition and removal
const screens = [
	// station name
	(data) => {
		let sanitizedText = 'Podmínky - ';
		// Typically an airport with "International" at the second position
		if (data.city.split(' ').length > 2 && data.city.split(' ')[1].toLowerCase() === 'international') {
			sanitizedText += `${data.city.split(' ')[0]} Mezinár. ${data.city.split(' ')[2]} `;
			// or a very long city name...this will
			// truncate very long airports too, like
			// "John F. Kennedy International Airport"
		} else if (data.city.length > 20) {
			sanitizedText += `${data.city.slice(0, 18)}...`;
		} else {
			sanitizedText += `${data.city} `;
		}
		return sanitizedText;
	},

	// condition
	(data) => {
		const engCond = getConditionText(data.TextConditions);
		const translated = conditionTranslations[engCond] || engCond;
		return `Stav: ${translated}`;
	},

	// temperature
	(data) => {
		const text = `Teplota: ${data.Temperature}${degree}${data.TemperatureUnit}`;
		return text;
	},

	// humidity
	(data) => `Vlhkost: ${data.Humidity}%   Rosný bod: ${data.DewPoint}${degree}${data.TemperatureUnit}`,

	// barometric pressure
	(data) => `Tlak: ${data.Pressure} ${data.PressureUnit}`,

	// wind
	(data) => {
		const engDir = data.WindDirection;
		const windDir = directionTranslations[engDir] || engDir;
		let text = data.WindSpeed > 0
			? `Vítr: ${windDir} ${data.WindSpeed} ${data.WindUnit}`
			: 'Vítr: Klid';

		if (data.WindGust > 0) {
			text += `   Nárazy do ${data.WindGust}`;
		}
		return text;
	},

	// visibility
	(data) => {
		const distance = `${data.Ceiling} ${data.CeilingUnit}`;
		return `Vidit: ${data.Visibility} ${data.VisibilityUnit}   Zákl.obl.: ${data.Ceiling === 0 ? 'Neomezeno' : distance}`;
	},
];

// internal draw function with preset parameters
const drawCondition = (text) => {
	elemForEach('.weather-display .scroll .fixed', (elem) => {
		// Remove old text-layers with exit
		const layers = elem.querySelectorAll('.text-layer');
		layers.forEach((layer) => {
			layer.classList.remove('active');
			layer.classList.add('exit');
			layer.addEventListener('transitionend', () => {
				layer.remove();
			}, { once: true });
		});

		// Create new layer with wrapped content
		const newLayer = document.createElement('div');
		newLayer.className = 'text-layer';
		const content = document.createElement('div');
		content.className = 'text-content';
		content.textContent = text;
		newLayer.appendChild(content);
		elem.appendChild(newLayer);

		// Force reflow
		// eslint-disable-next-line no-void
		void newLayer.offsetWidth;

		// Trigger wipe
		newLayer.classList.add('active');
	});
};
document.addEventListener('DOMContentLoaded', () => {
	start();
});
