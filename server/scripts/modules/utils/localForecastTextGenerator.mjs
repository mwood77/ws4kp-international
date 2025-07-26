import { directionToNSEW } from './calc.mjs';

import ConversionHelpers from './conversionHelpers.mjs';

function generateLocalForecast(dateStamp, hourlyData) {
	const MORNING_HOURS = [...Array(12).keys()].map((h) => h + 6); // 6 AM - 6 PM
	const NIGHT_HOURS = [...Array(6).keys()].map((h) => h + 18).concat([...Array(6).keys()]); // 6 PM - 6 AM

	const phraseVariations = {
		'CHANCE OF PRECIPITATION': ['PRECIPITATION PROBABILITY', 'EXPECTED PRECIPITATION LIKELIHOOD', 	'CHANCE OF SHOWERS', 'PRECIPITATION POSSIBLE', 'LIKELIHOOD OF RAIN', 'SHOWERS EXPECTED', 'PRECIPITATION LIKELY'],
		WIND: ['WINDS FROM THE', 'EXPECT WINDS COMING FROM', 'BREEZES BLOWING FROM', 	'BREEZES FROM THE', 'GUSTS COMING FROM THE', 'WINDS BLOWING IN FROM THE'],
		CLOUDY: ['CLOUD COVER', 'SKIES WILL BE MOSTLY CLOUDY', 'OVERCAST CONDITIONS EXPECTED', 	'PARTLY CLOUDY SKIES', 'MOSTLY CLOUDY WITH INTERVALS OF SUN', 'CLOUDS DOMINATING THE SKY'],
		CLEAR: ['MOSTLY CLEAR SKIES', 'FEW CLOUDS EXPECTED', 'SKIES REMAINING CLEAR', 	'CLEAR AND SUNNY', 'BRIGHT SKIES EXPECTED', 'VERY LITTLE CLOUD COVER'],
		'SNOW SHOWERS': ['FLURRIES LIKELY', 'SNOWFALL EXPECTED', 'LIGHT SNOW POSSIBLE'],
	};

	const forecastTemplates = [
		'{period}...  {cloudCover}, WITH A {tempLabel} AROUND {temp}. {windInfo}. {precipChance}',
		'{period}... {cloudCover}, {tempLabel} NEAR {temp}. {windInfo}. {precipChance}',
		'{period}... {cloudCover}, {tempLabel} CLOSE TO {temp}. {windInfo}. {precipChance}',
		'{cloudCover} THIS {period}, WITH {tempLabel} AROUND {temp}. {windInfo}. {precipChance}',
		'{period} FORECAST: {cloudCover}, {tempLabel} {temp}. {windInfo}. {precipChance}',
		'{period} OUTLOOK: {cloudCover}, EXPECT A {tempLabel} AROUND {temp}. {windInfo}. {precipChance}',
		'{period} WEATHER: {cloudCover}, {tempLabel} AT {temp}. {windInfo}. {precipChance}',
		'{period}... {cloudCover}, {tempLabel} CLOSE TO {temp}. {windInfo}. {precipChance}',
		'{period}... A {tempLabel} NEAR {temp}. {cloudCover}. {windInfo}. {precipChance}',
		'{period}... {cloudCover}. {windInfo}. {precipChance} {tempLabel} AROUND {temp}.',
		'{period} FORECAST: {cloudCover}, WITH TEMPERATURES AROUND {temp}. {windInfo}. {precipChance}',
		'{period} WEATHER OUTLOOK: {cloudCover}. {windInfo}. {precipChance} EXPECT TEMPERATURES AROUND {temp}.',
	];

	function getMostFrequent(arr) {
		return arr.sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length).pop();
	}

	// eslint-disable-next-line no-shadow
	function processForecast(hourlyData, period) {
		const periodData = hourlyData.filter((entry) => (period === 'MORNING' ? MORNING_HOURS : NIGHT_HOURS).includes(new Date(entry.time).getHours()));

		if (!periodData.length) return null;

		const temps = periodData.map((entry) => ConversionHelpers.convertTemperatureUnits(Math.round(entry.temperature_2m)));
		const temp = period === 'MORNING' ? Math.max(...temps) : Math.min(...temps);
		const tempLabel = period === 'MORNING' ? 'HIGH' : 'LOW';

		const windSpeeds = periodData.map((entry) => ConversionHelpers.convertWindUnits(Math.round(entry.wind_speed_10m)));
		const windDirs = periodData.map((entry) => entry.wind_direction_10m);
		const windInfo = `${directionToNSEW(getMostFrequent(windDirs))} WIND ${Math.min(...windSpeeds)} TO ${Math.max(...windSpeeds)} ${ConversionHelpers.getWindUnitText().toUpperCase()}`;

		const precipProbs = periodData.map((entry) => entry.precipitation_probability);
		const maxPrecip = Math.max(...precipProbs);
		let precipChance = 'PRECIPITATION NOT EXPECTED.';

		if (maxPrecip >= 30) {
			const peakHour = periodData.find((entry) => entry.precipitation_probability === maxPrecip)?.time;
			const hour = new Date(peakHour).getHours();
			const precipTime = `AFTER ${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
			precipChance = `${phraseVariations['CHANCE OF PRECIPITATION'][Math.floor(Math.random() * phraseVariations['CHANCE OF PRECIPITATION'].length)]} ${precipTime}. CHANCE IS ${maxPrecip}%.`;
		}

		const cloudCover = periodData.map((entry) => entry.cloud_cover);
		const averagedCloudCover = Math.max(...cloudCover);
		let cloudCoverText = '';

		if (averagedCloudCover >= 0 && averagedCloudCover < 20) {
			cloudCoverText = phraseVariations.CLEAR[Math.floor(Math.random() * 3)];
		} else if (averagedCloudCover >= 20 && averagedCloudCover < 50) {
			cloudCoverText = phraseVariations.CLEAR[Math.floor(Math.random() * 3)];
		} else if (averagedCloudCover >= 50 && averagedCloudCover < 80) {
			cloudCoverText = phraseVariations.CLOUDY[Math.floor(Math.random() * 3)];
		} else {
			cloudCoverText = phraseVariations.CLOUDY[Math.floor(Math.random() * 3)];
		}

		const forecastText = forecastTemplates[Math.floor(Math.random() * forecastTemplates.length)]
			.replace('{period}', period)
			.replace('{cloudCover}', cloudCoverText)
			.replace('{tempLabel}', tempLabel)
			.replace('{temp}', temp)
			.replace('{windInfo}', windInfo)
			.replace('{precipChance}', precipChance)
			.replace(/\n/g, '')
			.replace(/\r/g, '');

		return {
			period,
			temperature: { label: tempLabel, value: temp },
			wind: windInfo,
			precipitation: precipChance,
			skyCondition: cloudCover,
			text: forecastText,
		};
	}

	// Generate forecast for the provided date
	const dayDate = new Date(dateStamp);
	const dayStr = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

	const dailyData = hourlyData.filter((entry) => new Date(entry.time).toDateString() === dayDate.toDateString());

	const morningForecast = processForecast(dailyData, 'MORNING');
	const nightForecast = processForecast(dailyData, 'NIGHT');

	const forecast = {
		date: dayStr,
		periods: {
			morning: morningForecast,
			night: nightForecast,
		},
	};

	return JSON.stringify(forecast, null, 2);
}

export {
	// eslint-disable-next-line import/prefer-default-export
	generateLocalForecast,
};
