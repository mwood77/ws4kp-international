// Marine Forecast Display

import STATUS from './status.mjs';
import getHourlyData from './hourly.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { DateTime } from '../vendor/auto/luxon.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class MarineForecast extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		super(navId, elemId, 'Marine Forecast', defaultActive);

		// move the top right data into the correct location on load
		document.addEventListener('DOMContentLoaded', () => {
			// this.moveHeader();
		});
	}

	// moveHeader() {
	// 	// get the header
	// 	const header = this.fillTemplate('top-right', {});
	// 	// place the header
	// 	this.elem.querySelector('.header .right').append(header);
	// }

	async getMarineData(_weatherParameters) {
		if (!super.getMarineData(_weatherParameters)) return;
		this.setStatus(STATUS.loading);

		this.marineData = parseMarineData(_weatherParameters);

		this.setStatus(STATUS.loaded);
	}

	drawCanvas() {
		if (!this.image) this.image = this.elem.querySelector('.chart img');

		// get available space
		const availableWidth = 532;
		const availableHeight = 285;

		// this.image.width = availableWidth;
		// this.image.height = availableHeight;

		// // get context
		const canvas = document.createElement('canvas');
		canvas.width = availableWidth;
		canvas.height = availableHeight;
		const ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;

		// // calculate time scale
		// const timeScale = calcScale(0, 5, this.data.temperature.length - 1, availableWidth);
		// const startTime = DateTime.now().startOf('hour');
		// if (ConversionHelpers.getHoursFormat() === '12-hour') {
		// 	document.querySelector('.x-axis .l-1').innerHTML = formatTime(startTime);
		// 	document.querySelector('.x-axis .l-2').innerHTML = formatTime(startTime.plus({ hour: 6 }));
		// 	document.querySelector('.x-axis .l-3').innerHTML = formatTime(startTime.plus({ hour: 12 }));
		// 	document.querySelector('.x-axis .l-4').innerHTML = formatTime(startTime.plus({ hour: 18 }));
		// 	document.querySelector('.x-axis .l-5').innerHTML = formatTime(startTime.plus({ hour: 24 }));
		// } else {
		// 	document.querySelector('.x-axis .l-1').innerHTML = startTime.toFormat('HH');
		// 	document.querySelector('.x-axis .l-2').innerHTML = startTime.plus({ hour: 6 }).toFormat('HH');
		// 	document.querySelector('.x-axis .l-3').innerHTML = startTime.plus({ hour: 12 }).toFormat('HH');
		// 	document.querySelector('.x-axis .l-4').innerHTML = startTime.plus({ hour: 18 }).toFormat('HH');
		// 	document.querySelector('.x-axis .l-5').innerHTML = startTime.plus({ hour: 24 }).toFormat('HH');
		// }

		// // order is important last line drawn is on top
		// // clouds
		// const percentScale = calcScale(0, availableHeight - 10, 100, 10);
		// const cloud = createPath(this.data.skyCover, timeScale, percentScale);
		// drawPath(cloud, ctx, {
		// 	strokeStyle: 'lightgrey',
		// 	lineWidth: 3,
		// });

		// // precip
		// const precip = createPath(this.data.probabilityOfPrecipitation, timeScale, percentScale);
		// drawPath(precip, ctx, {
		// 	strokeStyle: 'aqua',
		// 	lineWidth: 3,
		// });

		// // temperature
		// const minTemp = Math.min(...this.data.temperature);
		// const maxTemp = Math.max(...this.data.temperature);
		// const midTemp = Math.round((minTemp + maxTemp) / 2);
		// const tempScale = calcScale(minTemp, availableHeight - 10, maxTemp, 10);
		// const tempPath = createPath(this.data.temperature, timeScale, tempScale);
		// drawPath(tempPath, ctx, {
		// 	strokeStyle: 'red',
		// 	lineWidth: 3,
		// });

		// // temperature axis labels
		// // limited to 3 characters, sacraficing degree character
		// const degree = String.fromCharCode(176);
		// this.elem.querySelector('.y-axis .l-1').innerHTML = (maxTemp + degree).substring(0, 3);
		// this.elem.querySelector('.y-axis .l-2').innerHTML = (midTemp + degree).substring(0, 3);
		// this.elem.querySelector('.y-axis .l-3').innerHTML = (minTemp + degree).substring(0, 3);

		// set the image source
		// this.image.src = canvas.toDataURL();

		super.drawCanvas();
		this.finishDraw();
	}
}

const parseMarineData = (weatherParameters) => {
	console.log('Parsing marine data', weatherParameters);
};

// register display
registerDisplay(new MarineForecast(12, 'marine-forecast'));
