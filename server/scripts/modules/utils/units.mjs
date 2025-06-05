// *********************************** unit conversions ***********************

const round2 = (value, decimals) => Math.trunc(value * 10 ** decimals) / 10 ** decimals;

// Speed conversions
const kphToKnots = (Kph) => Math.round((Kph * 0.539957) * 100) / 100; // 2 decimal places
const kphToMs = (Kph) => Math.round((Kph / 3.6) * 100) / 100;		// 2 decimal places
const kphToMph = (Kph) => Math.round(Kph / 1.609_34);
const knotsToMs = (Knots) => {
	const result = Math.round((Knots * 0.514_444) * 100) / 100; // 2 decimal places
	return result;
};

// Temperature conversions
const celsiusToFahrenheit = (Celsius) => Math.round((Celsius * 9) / 5 + 32);
const celsiusToKelvin = (Celsius) => Math.round(Celsius + 273.15);

// Distance conversions
const kilometersToMiles = (Kilometers) => Math.round(Kilometers / 1.609_34);
const kilometersToFeet = (Kilometers) => Math.round(Kilometers * 3280.84);
const kilometersToMeters = (Kilometers) => Math.round(Kilometers * 1000);
const KilometersToBananas = (Kilometers) => Math.round(Kilometers * 1000 / 0.18); // 1 banana = 0.18 km
const metersToFeet = (Meters) => Math.round(Meters / 0.3048);

// Pressure conversions
const pascalToInHg = (Pascal) => round2(Pascal * 0.000_295_3, 2);
const pascalToMmHg = (Pascal) => round2(Pascal * 0.007_500_62, 2);

export {
	round2,

	kphToKnots,
	kphToMs,
	kphToMph,
	knotsToMs,

	celsiusToFahrenheit,
	celsiusToKelvin,

	kilometersToMiles,
	kilometersToFeet,
	kilometersToMeters,
	KilometersToBananas,
	metersToFeet,

	pascalToInHg,
	pascalToMmHg,
};
