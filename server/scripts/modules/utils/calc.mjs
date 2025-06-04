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

function getMarineAdvisory(periodMarineData) {
	periodMarineData.waveHeight = parseFloat(periodMarineData.waveHeight);
	periodMarineData.swellPeriod = parseFloat(periodMarineData.swellPeriod);
	periodMarineData.windSpeed = periodMarineData.windSpeed ? parseFloat(periodMarineData.windSpeed) : null;

	const advisories = [];

	// Advisory based on wave height alone
	if (periodMarineData.waveHeight >= 1.2 && periodMarineData.waveHeight < 2.1) {
		advisories.push('Small Craft Advisory');
	}

	if (periodMarineData.waveHeight >= 2.1 && periodMarineData.aveHeight < 4) {
		advisories.push('Rough Seas Advisory');
	}

	if (periodMarineData.waveHeight >= 4) {
		advisories.push('Hazardous Seas Warning');
	}

	// Add wind-based advisories
	if (periodMarineData.windSpeed) {
		if (periodMarineData.windSpeed >= 20 && periodMarineData.windSpeed < 34) {
			advisories.push('Small Craft Advisory (Wind)');
		} else if (periodMarineData.windSpeed >= 34 && periodMarineData.windSpeed < 48) {
			advisories.push('Gale Warning');
		} else if (periodMarineData.windSpeed >= 48) {
			advisories.push('Storm Warning');
		}
	}

	// Additional rough surf warning for short-period steep waves
	if (periodMarineData.waveHeight >= 1.5 && periodMarineData.swellPeriod < 5) {
		advisories.push('Rough Surf Advisory');
	}

	return advisories.length ? advisories : ['No Advisory'];
}

const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// wrap a number to 0-m
const wrap = (x, m) => ((x % m) + m) % m;

export {
	calculateSeasCondition,
	getMarineAdvisory,
	directionToNSEW,
	distance,
	wrap,
};
