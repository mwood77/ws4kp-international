import { text, json } from './fetch.mjs';

// Simple point in polygon test (ray casting)
const pointInPolygon = (point, polygon) => {
	if (!polygon || polygon.length === 0) return false;
	let inside = false;
	const x = point[0];
	const y = point[1];

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i][0];
		const yi = polygon[i][1];
		const xj = polygon[j][0];
		const yj = polygon[j][1];

		const intersect = ((yi > y) !== (yj > y))
			&& (x < ((xj - xi) * (y - yi)) / ((yj - yi) === 0 ? 1e-18 : (yj - yi)) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
};

// Map country codes/names to MeteoAlarm feed slugs
const countryFeedMap = {
	GB: 'united-kingdom',
	UK: 'united-kingdom',
	IE: 'ireland',
	FR: 'france',
	DE: 'germany',
	ES: 'spain',
	IT: 'italy',
	NL: 'netherlands',
	BE: 'belgium',
	AT: 'austria',
	CH: 'switzerland',
	SE: 'sweden',
	NO: 'norway',
	DK: 'denmark',
	FI: 'finland',
	PL: 'poland',
	PT: 'portugal',
	GR: 'greece',
	HR: 'croatia',
	RO: 'romania',
	BG: 'bulgaria',
	CZ: 'czechia',
	SK: 'slovakia',
	HU: 'hungary',
	LT: 'lithuania',
	LV: 'latvia',
	EE: 'estonia',
	LU: 'luxembourg',
	SI: 'slovenia',
	MT: 'malta',
	CY: 'cyprus',
	IS: 'iceland',
};

// Try to get feed for a country
const getFeedSlug = (country) => {
	if (!country) return null;
	const code = country.toUpperCase();
	if (countryFeedMap[code]) return countryFeedMap[code];
	// Try direct slug if already lowercase name
	const normalized = country.toLowerCase().replace(/\s+/g, '-');
	return normalized;
};

const normalizeMeteoAlarmWarning = (warning, lat, lon) => {
	try {
		const alert = warning.alert || warning;
		const info = alert.info && alert.info[0] ? alert.info[0] : alert.info;
		if (!info) return null;

		// Check if point is in any polygon
		let inArea = false;
		if (info.area && Array.isArray(info.area)) {
			for (let i = 0; i < info.area.length; i++) {
				const area = info.area[i];
				if (area.polygon && Array.isArray(area.polygon)) {
					for (let p = 0; p < area.polygon.length; p++) {
						const polyStr = area.polygon[p];
						if (typeof polyStr === 'string') {
							// Parse "lat,lon lat,lon ..." or sometimes other formats
							const coords = polyStr.split(/\s+/).map((pt) => {
								const parts = pt.split(',');
								if (parts.length === 2) {
									return [parseFloat(parts[1]), parseFloat(parts[0])]; // [lon, lat]
								}
								return null;
							}).filter(Boolean);
							if (coords.length > 0 && pointInPolygon([lon, lat], coords)) {
								inArea = true;
								break;
							}
						}
					}
					if (inArea) break;
				}
			}
		}

		if (!inArea && info.area && info.area.some) {
			// try different structure
		}

		// If no polygons or can't determine, be conservative for now - include if it's a general warning for the region?
		// Better to include if we can't filter precisely, but user wants filtering. Try to be strict.
		if (!inArea) {
			// Some feeds might have different structure; also check if use_polygon_over_geocode indicates polygon usage
			const usePolygon = info.parameter && info.parameter.some((p) => p.valueName === 'use_polygon_over_geocode' && p.value === 'true');
			if (usePolygon && info.area && info.area.length > 0 && info.area[0].polygon) {
				// we already tried above
			} else if (info.area && info.area.length > 0 && !info.area[0].polygon) {
				// No polygon, might be geocoded - skip strict filtering for now or include?
				// To be safe and meet "ensuring the user's selected location is within the hazard polygon", 
				// only include if we found point in polygon
				return null;
			} else {
				return null;
			}
		}

		// Map to NWS-like structure
		return {
			properties: {
				event: info.event || info.headline || 'Weather Warning',
				severity: info.severity || 'Unknown',
				urgency: info.urgency || 'Unknown',
				description: info.description || info.instruction || info.headline || '',
				headline: info.headline,
			},
			_id: alert.identifier || warning.uuid,
		};
	} catch (e) {
		console.error('Error normalizing meteoalarm warning', e);
		return null;
	}
};

const getHazardsMeteoAlarm = async (lat, lon, country) => {
	try {
		const slug = getFeedSlug(country);
		if (!slug) return [];
		const url = `https://feeds.meteoalarm.org/api/v1/warnings/feeds-${slug}`;
		const data = await json(url, { retryCount: 2 });
		const warnings = data.warnings || data.alerts || data.features || [];
		const results = [];
		for (let i = 0; i < warnings.length; i++) {
			const norm = normalizeMeteoAlarmWarning(warnings[i], lat, lon);
			if (norm) results.push(norm);
		}
		return results;
	} catch (e) {
		console.error('Failed to fetch MeteoAlarm hazards', e);
		return [];
	}
};

export { getHazardsMeteoAlarm, pointInPolygon };
