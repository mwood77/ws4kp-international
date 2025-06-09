// wind direction
const directionToNSEW = (Direction) => {
	const val = Math.floor((Direction / 22.5) + 0.5);
	const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
	return arr[(val % 16)];
};

const calculateSeasCondition = (periodMarineData) => {
	// Quick checks for extreme calm or choppy
	if (periodMarineData.waveHeight < 0.1) return 'calm';
	if (periodMarineData.waveHeight < 0.5 && periodMarineData.swellPeriod >= 6) return 'smooth';

	// Logic based on wave height and swell period
	if (periodMarineData.waveHeight < 0.5) {
		return periodMarineData.swellPeriod < 5 ? 'slight' : 'smooth';
	} if (periodMarineData.waveHeight < 1.25) {
		return periodMarineData.swellPeriod < 5 ? 'choppy' : 'slight';
	} if (periodMarineData.waveHeight < 2.5) {
		return periodMarineData.swellPeriod < 5 ? 'choppy' : 'mdt chop';
	} if (periodMarineData.waveHeight < 4) {
		return 'rough';
	} if (periodMarineData.waveHeight < 6) {
		return 'v rough';
	} if (periodMarineData.waveHeight < 9) {
		return 'high';
	} if (periodMarineData.waveHeight < 14) {
		return 'v high';
	}
	return 'phenomenal';
};

function calculateAqiPM25(concentration) {
	// US AQI Standard for PM2.5 (AFAIK same scale used in WS4000+)
	const breakpoints = [
		{
			cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50,
		},
		{
			cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100,
		},
		{
			cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150,
		},
		{
			cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200,
		},
		{
			cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300,
		},
		{
			cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400,
		},
		{
			cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500,
		},
	];

	// eslint-disable-next-line no-restricted-syntax
	for (const bp of breakpoints) {
		if (concentration >= bp.cLow && concentration <= bp.cHigh) {
			const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
			return Math.round(aqi);
		}
	}

	return null; // concentration is out of range
}

function getMarineAdvisory(periodMarineData, dailyWindMinMaxInKnots) {
	periodMarineData.waveHeight = parseFloat(periodMarineData.waveHeight);
	periodMarineData.swellPeriod = parseFloat(periodMarineData.swellPeriod);

	let advisory = '';

	// Test data for advisory
	// periodMarineData.waveHeight = 1.4; // triggers "Small Craft Advisory"
	// periodMarineData.waveHeight = 3.0;   // triggers "Rough Seas Advisory"
	// periodMarineData.waveHeight = 5;   // triggers "Hazardous Seas Advisory"

	// Advisory based on wave height alone
	if (periodMarineData.waveHeight >= 1.2 && periodMarineData.waveHeight < 2.1) {
		advisory = 'Small Craft Advisory';
	}

	if (periodMarineData.waveHeight >= 2.1 && periodMarineData.waveHeight < 4) {
		advisory = 'Rough Seas Advisory';
	}

	if (periodMarineData.waveHeight >= 4) {
		advisory = 'Hazardous Seas Warning';
	}

	const maxWind = dailyWindMinMaxInKnots[periodMarineData.text.toLowerCase()].max;

	// Wind Modifiers
	if (maxWind >= 20 && maxWind < 34) {
		advisory += ' (Wind)';
	} else if (maxWind >= 34 && maxWind < 48) {
		advisory += ' (Gale)';
	} else if (maxWind >= 48) {
		advisory += ' (Storm)';
	}

	// Additional rough surf warning for short-period steep waves
	if (periodMarineData.waveHeight >= 1.5 && periodMarineData.swellPeriod < 5) {
		// overwrite advisory if it exists
		advisory = '';
		advisory = 'Rough Surf Advisory';
	}

	return advisory.toUpperCase();
}

const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// wrap a number to 0-m
const wrap = (x, m) => ((x % m) + m) % m;

export {
	calculateSeasCondition,
	calculateAqiPM25,
	getMarineAdvisory,
	directionToNSEW,
	distance,
	wrap,
};
