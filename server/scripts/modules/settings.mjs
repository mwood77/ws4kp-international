import Setting from './utils/setting.mjs';
import btnNavigateRefreshClick from '../index.mjs';

document.addEventListener('DOMContentLoaded', () => {
	init();
});

// default speed
const settings = {
	windUnits: { value: 2 },
	marineWindUnits: { value: 1 },
	marineWaveHeightUnits: { value: 1 },
	temperatureUnits: { value: 1 },
	distanceUnits: { value: 1 },
	pressureUnits: { value: 1 },
	hoursFormat: { value: 2 },
	speed: { value: 1.0 },
	experimentalFeatures: { value: false },
	hideWebamp: { value: false },
	kiosk: { value: false },
	scanLines: { value: false },
};

const init = () => {
	// Customizable measurement units
	settings.windUnits = new Setting('windUnits', 'Wind Units', 'select', 2, windUnitsChange, true, [
		[1, 'm/s'],
		[2, 'km/h'],
		[3, 'knots'],
		[4, 'mph'],
	]);
	settings.marineWindUnits = new Setting('marineWindUnits', 'Wind Units (Marine)', 'select', 1, marineWindUnitsChange, true, [
		[1, 'knots'],
		[2, 'm/s'],
	]);
	settings.marineWaveHeightUnits = new Setting('marineWaveHeightUnits', 'Wave Height Units', 'select', 1, marineWaveHeightUnitsChange, true, [
		[1, 'feet'],
		[2, 'meters'],
	]);
	settings.temperatureUnits = new Setting('temperatureUnits', 'Temperature Units', 'select', 1, temperatureChangeUnits, true, [
		[1, 'C'],
		[2, 'F'],
		[3, 'K'],
	]);
	settings.distanceUnits = new Setting('distanceUnits', 'Distance Units', 'select', 1, distanceChangeUnits, true, [
		[1, 'km'],
		[2, 'mi'],
		[3, 'ft'],
		[4, 'meters'],
		[5, 'bananas'],
	]);
	settings.pressureUnits = new Setting('pressureUnits', 'Pressure Units', 'select', 1, pressureChangeUnits, true, [
		[1, 'hPa'],
		[2, 'inHG'],
		[3, 'mmHG'],
	]);
	settings.hoursFormat = new Setting('hoursFormat', 'Hours Format', 'select', 2, hoursChangeFormat, true, [
		[1, '12-hour'],
		[2, '24-hour'],
	]);

	settings.speed = new Setting('speed', 'Speed', 'select', 1.0, null, true, [
		[0.5, 'Very Fast'],
		[0.75, 'Fast'],
		[1.0, 'Normal'],
		[1.25, 'Slow'],
		[1.5, 'Very Slow'],
	]);
	settings.experimentalFeatures = new Setting(
		'experimentalFeatures',
		'Experimental Features <a href="https://github.com/mwood77/ws4kp-international?tab=readme-ov-file#updates-in-1100" target="_blank" rel="noopener noreferrer">(info)</a>',
		'boolean',
		false,
		experimentalFeaturesChange,
		true,
	);
	settings.hideWebamp = new Setting('hideWebamp', 'Hide Webamp (Winamp)', 'boolean', false, hideWebampChange, true);
	settings.scanLines = new Setting('scanLines', 'Enable Scan Lines', 'boolean', false, scanLinesChange, true);

	settings.wide = new Setting('wide', 'Widescreen', 'boolean', false, wideScreenChange, true);
	settings.kiosk = new Setting('kiosk', 'Kiosk', 'boolean', false, kioskChange, false);

	// generate html objects
	const settingHtml = Object.values(settings).map((d) => d.generate());

	// write to page
	const settingsSection = document.querySelector('#settings');
	settingsSection.innerHTML = '';
	settingsSection.append(...settingHtml);
};

const temperatureChangeUnits = (value) => {
	if (value) {
		document.documentElement.setAttribute('temperature-units', value);
	}
};

const distanceChangeUnits = (value) => {
	if (value) {
		document.documentElement.setAttribute('distance-units', value);
	}
};

const pressureChangeUnits = (value) => {
	if (value) {
		document.documentElement.setAttribute('pressure-units', value);
	}
};

const marineWaveHeightUnitsChange = (value) => {
	if (value) {
		document.documentElement.setAttribute('marine-wave-height-units', value);
	}
};

const marineWindUnitsChange = (value) => {
	if (value) {
		document.documentElement.setAttribute('marine-wind-units', value);
	}
};

const windUnitsChange = (value) => {
	if (value) {
		document.documentElement.setAttribute('wind-units', value);
	}
};

const hoursChangeFormat = (value) => {
	if (value) {
		document.documentElement.setAttribute('hours-format', value);
	}
};

const experimentalFeaturesChange = (value) => {
	document.documentElement.setAttribute('experimental-features', value);

	// @todo - this is a bit gnarly
	if (!value) localStorage.removeItem('nearbyCitiesFromLocality');
	btnNavigateRefreshClick();
};

const hideWebampChange = async (value) => {
	if (value) {
		document.documentElement.setAttribute('hide-webamp', value);
	} else {
		document.documentElement.removeAttribute('hide-webamp');
	}

	// Webamp is a global variable, defined in a <script>
	// tag in index.ejs, so we can access it directly

	// Wait until the global webamp instance is available
	if (!window.webamp) {
		console.warn('Webamp not initialized yet.');
		return;
	}

	if (value === true) {
		// eslint-disable-next-line no-undef
		await webamp.close();
	} else {
		// eslint-disable-next-line no-undef
		await webamp.reopen();
	}
};

const scanLinesChange = (value) => {
	const container = document.querySelector('#divTwc');
	if (value) {
		container.classList.add('scan-lines');
	} else {
		container.classList.remove('scan-lines');
	}
};

const wideScreenChange = (value) => {
	const container = document.querySelector('#divTwc');
	if (value) {
		container.classList.add('wide');
	} else {
		container.classList.remove('wide');
	}
};

const kioskChange = (value) => {
	const body = document.querySelector('body');
	if (value) {
		body.classList.add('kiosk');
		window.dispatchEvent(new Event('resize'));
	} else {
		body.classList.remove('kiosk');
	}
};

export default settings;
