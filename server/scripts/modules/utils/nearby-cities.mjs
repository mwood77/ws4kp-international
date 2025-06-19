const corsAnywhere = 'https://cors-anywhere.herokuapp.com/';

export default class NearbyCities {
	static internalConstructWikiCityCodeIdUrl(location) {
		return `https://en.wikipedia.org/w/api.php?action=query&titles=${location}&prop=pageprops&format=json`;
	}

	static internalConstructWikiCountryCodeIdUrl(countryCode) {
		return `https://www.wikidata.org/wiki/Special:EntityData/${countryCode}.json`;
	}

	static internalConstructNearbyCitiesSparqlUrl(cityCode, countryCode) {
		const baseUrl = 'https://query.wikidata.org/sparql?query=';

		const query = `SELECT DISTINCT ?cityLabel ?lat ?lon ?population WHERE {
                ?city wdt:P31/wdt:P279* wd:Q515.
                ?city wdt:P17 wd:${countryCode}.
                ?city wdt:P625 ?coords .
                ?city wdt:P1082 ?population .
                BIND(geof:latitude(?coords) AS ?lat)
                BIND(geof:longitude(?coords) AS ?lon)
                FILTER(?city != wd:${cityCode})
                SERVICE wikibase:label {
                    bd:serviceParam wikibase:language "en".
                }
            }
            ORDER BY DESC(?population)
            LIMIT 5`;

		return baseUrl + encodeURIComponent(query);
	}

	static getNearbyCities(textlocation) {
		const finalResult = new Set();

		const defaultHeaders = new Headers({
			'User-Agent': 'ws4kp-international/1.0 (https://mwood77.github.io/ws4kp-international)',
			Origin: 'https://mwood77.github.io',
			'Access-Control-Allow-Origin': '*',
		});

		// 1. Fetch city code from Wikipedia API
		// eslint-disable-next-line consistent-return
		return fetch(corsAnywhere + NearbyCities.internalConstructWikiCityCodeIdUrl(textlocation), { headers: defaultHeaders })
			.then((res) => res.json())
			.then((wikiData) => {
				// Extract city code (wikidata id) from Wikipedia API response
				const pages = wikiData.query && wikiData.query.pages;
				const page = pages && Object.values(pages)[0];
				const cityCode = page && page.pageprops && page.pageprops.wikibase_item;
				if (!cityCode) throw new Error('NearbyCities: City code not found');

				// 2. Fetch country code from Wikidata API
				return fetch(corsAnywhere + NearbyCities.internalConstructWikiCountryCodeIdUrl(cityCode), { headers: defaultHeaders })
					.then((res) => res.json())
					.then((wikidata) => {
						// Extract country code from Wikidata API response
						const entity = wikidata.entities && wikidata.entities[cityCode];
						const claims = entity && entity.claims && entity.claims.P17;
						const countryCode = claims && claims[0] && claims[0].mainsnak.datavalue.value.id;
						if (!countryCode) throw new Error('NearbyCities: Country code not found');

						// 3. Fetch nearby cities from Wikidata SPARQL endpoint
						// first we need to add a new header...
						defaultHeaders.append('Accept', 'application/sparql-results+json');
						return fetch(corsAnywhere + NearbyCities.internalConstructNearbyCitiesSparqlUrl(cityCode, countryCode), { headers: defaultHeaders })
							.then((res) => res.json())
							.then((sparqlData) => {
								// Extract city labels from SPARQL response
								const results = sparqlData.results && sparqlData.results.bindings;
								if (results) {
									const cityNameContainer = [];
									results.forEach((item) => {
										const cityObject = {};

										if (item.cityLabel && item.cityLabel.value) {
											cityObject.city = item.cityLabel.value;
										}

										if (item.lat && item.lon) {
											cityObject.lat = item.lat.value;
											cityObject.lon = item.lon.value;
										}

										if (item.population) {
											cityObject.population = item.population.value;
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
					});
			});
	}
}
