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

// the "screens" are stored in an array for easy addition and removal
const screens = [
	// station name
	(data) => {
		let sanitizedText = 'Conditions at ';
		// Typically an airport with "International" at the second position
		if (data.city.split(' ').length > 2 && data.city.split(' ')[1].toLowerCase() === 'international') {
			sanitizedText += `${data.city.split(' ')[0]} Intl. ${data.city.split(' ')[2]} `;
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
	(data) => `Condition: ${getConditionText(data.TextConditions)}`,

	// temperature
	(data) => {
		const text = `Temp: ${data.Temperature}${degree}${data.TemperatureUnit}`;
		return text;
	},

	// humidity
	(data) => `Humidity: ${data.Humidity}%   Dewpoint: ${data.DewPoint}${degree}${data.TemperatureUnit}`,

	// barometric pressure
	(data) => `Barometric Pressure: ${data.Pressure} ${data.PressureUnit}`,

	// wind
	(data) => {
		let text = data.WindSpeed > 0
			? `Wind: ${data.WindDirection} ${data.WindSpeed} ${data.WindUnit}`
			: 'Wind: Calm';

		if (data.WindGust > 0) {
			text += `   Gusts to ${data.WindGust}`;
		}
		return text;
	},

	// visibility
	(data) => {
		const distance = `${data.Ceiling} ${data.CeilingUnit}`;
		return `Visib: ${data.Visibility} ${data.VisibilityUnit}   Ceiling: ${data.Ceiling === 0 ? 'Unlimited' : distance}`;
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
