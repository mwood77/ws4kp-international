import createToken from './hmac.mjs';

const corsAnywhereKnownSources = [
	'https://ws4kp-proxy.easypete.com/',
];

export default class RadarBoundsCities {
	static internalConstructBoundingBoxQuery(cornerWestLat, cornerWestLng, cornerEastLat, cornerEastLng) {
		const baseUrl = 'https://query.wikidata.org/sparql?query=';

		const pointCornerWest = `Point(${cornerWestLat} ${cornerWestLng})`;
		const pointCornerEast = `Point(${cornerEastLat} ${cornerEastLng})`;
		const limit = 7;

		const query = `
            SELECT ?item ?itemLabel ?coord ?population WHERE {
            ?item wdt:P31 wd:Q515 .                 # Instance of city
            ?item wdt:P1082 ?population .           # Population
            FILTER(?population > 50000)             # Filter for cities with population greater than 50,000
            ?item wdt:P625 ?coord .                 # Coordinates of the city
            
            SERVICE wikibase:box {
                ?item wdt:P625 ?location .
                bd:serviceParam wikibase:cornerWest "${pointCornerWest}"^^geo:wktLiteral .
                bd:serviceParam wikibase:cornerEast "${pointCornerEast}"^^geo:wktLiteral .
            }

            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
            ORDER BY DESC(?population)
            LIMIT ${limit}
        `;

		return baseUrl + encodeURIComponent(query);
	}

	static async getBoundingBoxCities(cornerWestLat, cornerWestLng, cornerEastLat, cornerEastLng) {
		const finalResult = new Set();

		const defaultHeaders = new Headers({
			Accept: 'application/json',
			'User-Agent': 'ws4kp-international/1.0 (https://mwood77.github.io/ws4kp-international)',
			Origin: 'https://mwood77.github.io',
			'Access-Control-Allow-Origin': '*',
			'x-ws4kp': await createToken(),
		});

		const corsAnywhere = corsAnywhereKnownSources[Math.floor(Math.random() * corsAnywhereKnownSources.length)];
		return fetch(corsAnywhere + RadarBoundsCities.internalConstructBoundingBoxQuery(cornerWestLat, cornerWestLng, cornerEastLat, cornerEastLng), { headers: defaultHeaders })
			.then((res) => res.json())
			.then((sparqlData) => {
				const results = sparqlData.results && sparqlData.results.bindings;
				if (results) {
					const cityNameContainer = [];

					results.forEach((item) => {
						const cityObject = {};

						if (item.itemLabel && item.itemLabel.value) {
							cityObject.city = item.itemLabel.value;
						}

						if (item.coord && item.coord.value) {
							// Wikidata coordinates are in the format "Point(longitude latitude)"
							// ex. "Point(10.738888888 59.913333333)"
							const wikidataCoords = item.coord.value.replace('Point(', '').replace(')', '').split(' ');
							const [lon, lat] = wikidataCoords;
							cityObject.lat = lat;
							cityObject.lon = lon;
						}

						// Wikedata API can return duplicate results with different pop objects,
						// and we don't care about different pop values. So we discard duplicates
						if (cityObject.city && !cityNameContainer.includes(cityObject.city)) {
							cityNameContainer.push(cityObject.city);
							finalResult.add(cityObject);
						}
					});
				}

				return Array.from(finalResult);
			});
	}

	static async getWeatherForCity(lat, lon) {
		const openMeteoAdditionalForecastParameters = '&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto';
		return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}${openMeteoAdditionalForecastParameters}`)
			.then((res) => res.json())
			.then((response) => response.hourly);
	}
}
