import { directionToNSEW, metarsToWeatherCode } from './calc.mjs';
import {
	mphtoKph, fahrenheitToCelsius, milesToKm, inHgToHectopascal,
} from './units.mjs';

export default class WeatherUndergroundPwsMapper {
	static mapsPWSRequestToWeatherBody(pwsDataObject) {
		return {
			locationCity: pwsDataObject.ID,
			lastUpdated: new Date(pwsDataObject.dateutc).toISOString(),
			windDirection: directionToNSEW(pwsDataObject.winddir),
			windSpeed: mphtoKph(pwsDataObject.windspeedmph),
			windGust: mphtoKph(pwsDataObject.windgustmph),
			humidity: pwsDataObject.humidity,
			dewPoint: fahrenheitToCelsius(pwsDataObject.dewptf),
			temperature: fahrenheitToCelsius(pwsDataObject.tempf),
			conditionText: metarsToWeatherCode(pwsDataObject.weather),
			uvIndex: pwsDataObject.UV,
			visibility: milesToKm(pwsDataObject.visibility),
			pressure: inHgToHectopascal(pwsDataObject.baromin),
		};
	}
}
