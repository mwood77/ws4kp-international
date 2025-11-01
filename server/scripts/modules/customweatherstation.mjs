// custom weather station display, similar to current weather but based on a user-defined station
import STATUS from './status.mjs';
import { loadImg } from './utils/image.mjs';
import { directionToNSEW } from './utils/calc.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { getConditionText } from './utils/weather.mjs';

import ConversionHelpers from './utils/conversionHelpers.mjs';

class CustomWeatherStation extends WeatherDisplay {
	constructor(navId, elemId, defaultActive, defaultShow) {
		super(navId, elemId, 'custom-weather-station', true);

		// set timings
		this.timing.baseDelay = 5000;
	}

	async getData(_weatherParameters) {
		// this.setStatus(STATUS.loaded);
        console.log('getData() called');

		if (!super.getData(_weatherParameters)) return;

        // console.log('Fetching data for Custom Weather Station');
        console.log(this.weatherParameters);

		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
        // console.log('Drawing canvas for Custom Weather Station');
		super.drawCanvas();

		const top = -this.screenIndex * this.pageHeight;
		this.elem.querySelector('.forecasts').style.top = `${top}px`;

		this.finishDraw();
	}
}

// register display
registerDisplay(new CustomWeatherStation(13, 'custom-weather-station', false, false));
