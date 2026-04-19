// hourly forecast list

import STATUS from './status.mjs';
import { json } from './utils/fetch.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';

const hazardLevels = {
	Extreme: 10,
	Severe: 5,
};

const hazardModifiers = {
	'Hurricane Warning': 2,
	'Tornado Warning': 3,
	'Severe Thunderstorm Warning': 1,
};

class Hazards extends WeatherDisplay {
	constructor(navId, elemId, defaultActive) {
		// special height and width for scrolling
		super(navId, elemId, 'Hazards', defaultActive);
		this.showOnProgress = false;

		// 0 screens skips this during "play"
		this.timing.totalScreens = 0;
	}

	// Přepíšeme název pouze pro zaškrtávací políčko v menu dole
	generateCheckbox(defaultEnabled = true) {
		const label = super.generateCheckbox(defaultEnabled);
		if (label) label.querySelector('span').innerHTML = 'Upozornění';
		return label;
	}

	async getData(weatherParameters) {
		// super checks for enabled
		const superResult = super.getData(weatherParameters);

		const alert = this.checkbox.querySelector('.alert');
		alert.classList.remove('show');

		try {
			const lat = this.weatherParameters.latitude;
			const lon = this.weatherParameters.longitude;

			// Vytvoření bounding boxu pro MeteoAlarm EDR API (cca +/- 5 km od lokace)
			const bbox = `${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}`;
			// ADRESA TVÉHO PROXY SERVERU NA ALWAYSDATA (nahraď 'tvoje-jmeno' za svou reálnou doménu)
			const url = new URL('https://negotiu.alwaysdata.net/apiw.php');
			url.searchParams.append('bbox', bbox);

			const alerts = await json(url, { retryCount: 3, stillWaiting: () => this.stillWaiting() });
			const unsortedAlerts = alerts.features ?? [];

			// Adaptace dat z evropského MeteoAlarmu do struktury očekávané aplikací
			const processedAlerts = unsortedAlerts.map((hazard) => {
				const props = hazard.properties || {};

				// Extrakce typu nebezpečí
				let rawEvent = props.event || props.awareness_type || 'UPOZORNĚNÍ';
				if (typeof rawEvent === 'string' && rawEvent.includes(';')) {
					rawEvent = rawEvent.split(';').pop().trim(); // Odstraní číselný kód a nechá jen název
				}
				let desc = props.description || props.instruction || '';
				if (Array.isArray(desc)) desc = desc[0]?.text || desc[0] || '';

				// Sjednocení závažnosti (Severity)
				let severity = props.severity || props.awareness_level || 'Unknown';
				if (severity.includes('Extreme') || severity.includes('4;')) severity = 'Extreme';
				else if (severity.includes('Severe') || severity.includes('3;')) severity = 'Severe';
				else if (severity.includes('Moderate') || severity.includes('2;')) severity = 'Moderate';

				return {
					...hazard,
					properties: {
						...props,
						event: rawEvent.toUpperCase(),
						description: desc,
						severity: severity,
						urgency: props.urgency || 'Immediate',
					}
				};
			});

			const hasImmediate = processedAlerts.reduce((acc, hazard) => acc || hazard.properties.urgency === 'Immediate', false);
			const sortedAlerts = processedAlerts.sort((a, b) => (calcSeverity(b.properties.severity, b.properties.event)) - (calcSeverity(a.properties.severity, a.properties.event)));
			const filteredAlerts = sortedAlerts.filter((hazard) => hazard.properties.severity !== 'Unknown' && (!hasImmediate || (hazard.properties.urgency === 'Immediate')));
			this.data = filteredAlerts;

		} catch (error) {
			console.error('Nepodařilo se stáhnout výstrahy z MeteoAlarm API, nebo nejsou žádné aktivní.');
			this.data = []; // Ochrana proti pádu - modul se při prázdných datech plynule přeskočí
		}

		// TESTOVACÍ VÝSTRAHA - Přidej testovací upozornění do fronty za všech okolností
		//this.data.push({
		//	properties: {
		//		event: 'TESTOVACÍ VAROVÁNÍ: EXTRÉMNÍ BOUŘKY',
		//		description: 'Toto je pouze zkouška varovného systému Weather Star 4000. Ve vašem okolí nehrozí žádné reálné nebezpečí.\n\nPokud by se jednalo o skutečnou událost, následovaly by zde informace o srážkách, větru a doporučené chování.',
		//		severity: 'Severe',
		//		urgency: 'Immediate'
		//	}
		//});

		// Zobrazení ikonky blikajících výstrah (!!!), pokud nějaká data došla
		if (this.data.length > 0) alert.classList.add('show');

		this.getDataCallback();

		if (!superResult) {
			this.setStatus(STATUS.loaded);
			return;
		}
		this.drawLongCanvas();
	}

	async drawLongCanvas() {
		// get the list element and populate
		const list = this.elem.querySelector('.hazard-lines');
		list.innerHTML = '';

		const lines = this.data.map((data) => {
			const fillValues = {};
			// text
			fillValues['hazard-text'] = `${data.properties.event}<br/><br/>${data.properties.description.replaceAll('\n\n', '<br/><br/>').replaceAll('\n', ' ')}`;

			return this.fillTemplate('hazard', fillValues);
		});

		list.append(...lines);

		// no alerts, skip this display by setting timing to zero
		if (lines.length === 0) {
			this.setStatus(STATUS.loaded);
			this.timing.totalScreens = 0;
			this.setStatus(STATUS.loaded);
			return;
		}

		// update timing
		// set up the timing
		this.timing.baseDelay = 20;
		// 24 hours = 6 pages
		const pages = Math.max(Math.ceil(list.scrollHeight / 400) - 3, 1);
		const timingStep = 400;
		this.timing.delay = [150 + timingStep];
		// add additional pages
		for (let i = 0; i < pages; i += 1) this.timing.delay.push(timingStep);
		// add the final 3 second delay
		this.timing.delay.push(250);
		this.calcNavTiming();
		this.setStatus(STATUS.loaded);
	}

	drawCanvas() {
		super.drawCanvas();
		this.finishDraw();
	}

	showCanvas() {
		// special to hourly to draw the remainder of the canvas
		this.drawCanvas();
		super.showCanvas();
	}

	hideCanvas() {
		super.hideCanvas();
		// Explicitní skrytí - oprava bugu z původního jádra, který bránil zavření
		if (this.elem) this.elem.classList.remove('show');
	}

	// screen index change callback just runs the base count callback
	screenIndexChange() {
		this.baseCountChange(this.navBaseCount);
	}

	// base count change callback
	baseCountChange(count) {
		// calculate scroll offset and don't go past end
		let offsetY = Math.min(this.elem.querySelector('.hazard-lines').getBoundingClientRect().height - 390, (count - 150));

		// don't let offset go negative
		if (offsetY < 0) offsetY = 0;

		// copy the scrolled portion of the canvas
		this.elem.querySelector('.main').scrollTo(0, offsetY);
	}

	// make data available outside this class
	// promise allows for data to be requested before it is available
	async getCurrentData(stillWaiting) {
		if (stillWaiting) this.stillWaitingCallbacks.push(stillWaiting);
		return new Promise((resolve) => {
			if (this.data) resolve(this.data);
			// data not available, put it into the data callback queue
			this.getDataCallbacks.push(() => resolve(this.data));
		});
	}

	// after we roll through the hazards once, don't display again until the next refresh (10 minutes)
	screenIndexFromBaseCount() {
		const superValue = super.screenIndexFromBaseCount();
		// false is returned when we reach the end of the scroll
		if (superValue === false) {
			// set total screens to zero to take this out of the rotation
			// this.timing.totalScreens = 0; // Zakomentováno: výstraha se teď ukáže při každé rotaci
		}
		// return the value as expected
		return superValue;
	}
}

const calcSeverity = (severity, event) => {
	// base severity plus some modifiers for specific types of warnings
	const baseSeverity = hazardLevels[severity] ?? 0;
	const modifiedSeverity = hazardModifiers[event] ?? 0;
	return baseSeverity + modifiedSeverity;
};

// register display
registerDisplay(new Hazards(0, 'hazards', false));
