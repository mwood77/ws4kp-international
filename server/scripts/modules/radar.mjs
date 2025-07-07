/* eslint-disable no-underscore-dangle */
// current weather conditions display
import STATUS from './status.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';
import { DateTime } from '../vendor/auto/luxon.mjs';

import { getConditionText } from './utils/weather.mjs';
import { getWeatherIconFromIconLink } from './icons.mjs';

class Radar extends WeatherDisplay {
	constructor(navId, elemId) {
		super(navId, elemId, 'Local Radar', false);

		this.okToDrawCurrentConditions = false;
		this.okToDrawCurrentDateTime = false;

		// Initialize instance properties
		this.radarLayers = [];
		this.mapFrames = [];
		this.animationPosition = 0;
		this.lastPastFramePosition = -1;
		this.loadingTilesCount = 0;
		this.loadedTilesCount = 0;
		this.radarData = {};

		// City location marker
		this.locationMarker = null;

		// Radar options
		this.radarOptions = {
			kind: 'radar',
			tileSize: 256,
			colorScheme: 4,
			smoothData: 1,
			snowColors: 1,
			extension: 'webp',
		};

		// Set max images - this will be updated when we get actual data
		this.dopplerRadarImageMax = 6;

		// Update timing for animation
		this.timing.baseDelay = 500; // 500ms per frame
		this.timing.delay = 1; // Each frame shows for 1 * baseDelay
		this.timing.totalScreens = 1; // Will be updated when data loads
	}

	createWeatherIconHTML(weatherCode, temperature, cityName) {
		const text = getConditionText(parseInt(weatherCode, 10));
		const weatherIcon = getWeatherIconFromIconLink(text, 'America/New_York', true);

		return `
		<div style="margin:0; padding: 0; display: flex; flex-direction: column;">
			<div class="row-1" style="display: flex; width: 100%;">
				<div style="
					text-shadow: 3px 3px 0 #000, -1.5px -1.5px 0 #000, 0 -1.5px 0 #000, 1.5px -1.5px 0 #000, 1.5px 0 0 #000, 1.5px 1.5px 0 #000, 0 1.5px 0 #000, -1.5px 1.5px 0 #000, -1.5px 0 0 #000;
					font-family: 'Star4000';
					font-size: 18pt;"
				>${cityName}</div>
			</div>
			<div class="temperature-icon" style="display: flex; align-items: center; margin-top: -14px;">
				<div style="
					padding-right: 6px;
					font-family: 'Star4000'; 
					text-shadow: 3px 3px 0 #000, -1.5px -1.5px 0 #000, 0 -1.5px 0 #000, 1.5px -1.5px 0 #000, 1.5px 0 0 #000, 1.5px 1.5px 0 #000, 0 1.5px 0 #000, -1.5px 1.5px 0 #000, -1.5px 0 0 #000;
					font-size: 36px;
					color: #ff0;">${Math.round(temperature)}</div>
				<img src="${weatherIcon}" alt="Weather" style="width: auto; height: 40px;" />
			</div>
		</div>
	`;
	}

	// Method to add location marker
	addLocationMarker(latitude, longitude, cityName, weatherData = null) {
	// Remove existing marker if it exists
		if (this.locationMarker && window._leafletMap) {
			window._leafletMap.removeLayer(this.locationMarker);
		}

		if (!window._leafletMap) {
			console.warn('Map not initialized');
			return;
		}

		let markerContent;

		console.log(weatherData)

		if (weatherData && weatherData.icon && weatherData.temperature !== undefined) {
		// Create marker with weather icon and data
			markerContent = this.createWeatherIconHTML(
				weatherData.icon,
				weatherData.temperature,
				cityName,
			);
		} else {
		// Simple city name marker
			markerContent = `
			<div class="city-marker" style="
				background: rgba(0, 0, 0, 0.8);
				color: white;
				border-radius: 6px;
				padding: 6px 10px;
				font-family: Arial, sans-serif;
				font-size: 14px;
				font-weight: bold;
				text-align: center;
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				border: 2px solid white;
				white-space: nowrap;
			">
				${cityName}
			</div>
		`;
		}

		// Create custom divIcon
		const customIcon = window.L.divIcon({
			html: markerContent,
			className: 'custom-weather-marker',
			iconSize: [120, 60],
			iconAnchor: [60, 60], // Center the marker
			popupAnchor: [0, -60],
		});

		// Create and add marker
		this.locationMarker = window.L.marker([latitude, longitude], {
			icon: customIcon,
			zIndexOffset: 1000, // Ensure it appears above other layers
		}).addTo(window._leafletMap);

		return this.locationMarker;
	}

	// Method to update location marker with new weather data
	updateLocationMarker(weatherData) {
		if (!this.locationMarker || !weatherData) return;

		const markerContent = this.createWeatherIconHTML(
			weatherData.icon,
			weatherData.temperature,
			weatherData.cityName || 'Current Location',
		);

		const customIcon = window.L.divIcon({
			html: markerContent,
			className: 'custom-weather-marker',
			iconSize: [120, 60],
			iconAnchor: [60, 60],
			popupAnchor: [0, -60],
		});

		this.locationMarker.setIcon(customIcon);
	}

	isTilesLoading() {
		return this.loadingTilesCount > this.loadedTilesCount;
	}

	removeLayer(layer) {
		if (!layer) {
			console.warn('Tried to remove a layer, but layer is undefined or null');
			return;
		}

		if (!window._leafletMap) {
			console.warn('Leaflet map is not initialized');
			return;
		}

		if (!window._leafletMap.hasLayer(layer)) {
			console.warn('Layer not found on the map:', layer);
			return;
		}

		console.log('Removing layer:', layer);
		window._leafletMap.removeLayer(layer);
	}

	addLayer(frame) {
		if (!frame) return null;

		const tileUrl = `${this.radarData.host}${frame.path}/${this.radarOptions.tileSize}/{z}/{x}/{y}/${this.radarOptions.colorScheme}/${this.radarOptions.smoothData}_${this.radarOptions.snowColors}.${this.radarOptions.extension}`;

		// Check if layer already exists
		const existingLayer = this.radarLayers.find((layer) => layer._url && layer._url.includes(frame.path));

		if (existingLayer) {
			return existingLayer;
		}

		const source = new window.L.TileLayer(tileUrl, {
			tileSize: this.radarOptions.tileSize,
			opacity: 0, // Start invisible
			zIndex: frame.time,
		});

		// Add event handlers for tile loading
		source.on('loading', () => {
			this.loadingTilesCount++;
		});

		source.on('load', () => {
			this.loadedTilesCount++;
		});

		source.on('tileerror', (e) => {
			console.warn('Tile failed to load:', e);
			this.loadedTilesCount++; // Count failed tiles as "loaded" to prevent infinite waiting
		});

		this.radarLayers.push(source);
		source.addTo(window._leafletMap);

		return source;
	}

	changeRadarPosition(position, preloadOnly = false, force = false) {
	// Wrap position to valid range
		while (position >= this.mapFrames.length) {
			position -= this.mapFrames.length;
		}
		while (position < 0) {
			position += this.mapFrames.length;
		}

		if (this.mapFrames.length === 0) return;

		const nextFrame = this.mapFrames[position];

		// Find or create the layer for the next frame
		let nextLayer = this.radarLayers.find((layer) => layer._url && layer._url.includes(nextFrame.path));

		if (!nextLayer) {
			nextLayer = this.addLayer(nextFrame);
		}

		// Quit if this call is for preloading only
		if (preloadOnly) {
			return;
		}

		// Don't wait for tiles if forced, or if we're not currently loading
		if (!force && this.isTilesLoading()) {
		// Set a timeout to try again
			setTimeout(() => {
				this.changeRadarPosition(position, false, true);
			}, 100);
			return;
		}

		// Hide all layers first
		this.radarLayers.forEach((layer) => {
			if (layer && layer.setOpacity) {
				layer.setOpacity(0);
			}
		});

		// Update position
		this.animationPosition = position;

		// Show the current frame
		if (nextLayer && nextLayer.setOpacity) {
			nextLayer.setOpacity(0.8);
		}

		// Update timestamp display
		this.updateTimestamp(nextFrame);
	}

	updateTimestamp(frame) {
		const timeElem = this.elem.querySelector('.time');
		if (timeElem && frame.time) {
			const frameTime = DateTime.fromSeconds(frame.time);
			const pastOrForecast = frame.time > Date.now() / 1000 ? 'FORECAST' : 'PAST';
			const timeString = frameTime.toLocaleString(DateTime.TIME_SIMPLE);
			timeElem.innerHTML = `${pastOrForecast}: ${timeString}`;
		}
	}

	showFrame(nextPosition, force = false) {
		if (this.mapFrames.length === 0) return;

		const preloadingDirection = nextPosition - this.animationPosition > 0 ? 1 : -1;

		this.changeRadarPosition(nextPosition, false, force);

		// Preload next frame
		const preloadPosition = (nextPosition + preloadingDirection + this.mapFrames.length) % this.mapFrames.length;
		this.changeRadarPosition(preloadPosition, true);
	}

	async getRadarData() {
		const radarSource = 'https://api.rainviewer.com/public/weather-maps.json';
		try {
			const response = await fetch(radarSource);
			return await response.json();
		} catch (error) {
			console.error('Failed to fetch radar data:', error);
			throw error;
		}
	}

	async initializeRadar(api, kind = 'radar') {
	// Clear existing layers
		if (window._leafletMap && Array.isArray(this.radarLayers)) {
			this.radarLayers.forEach((layer) => {
				if (window._leafletMap.hasLayer(layer)) {
					window._leafletMap.removeLayer(layer);
				}
			});
		}

		// Reset state
		this.mapFrames = [];
		this.radarLayers = [];
		this.animationPosition = 0;
		this.loadingTilesCount = 0;
		this.loadedTilesCount = 0;

		if (!api) return;

		if (kind === 'satellite' && api.satellite && api.satellite.infrared) {
			this.mapFrames = api.satellite.infrared;
			this.lastPastFramePosition = api.satellite.infrared.length - 1;
		} else if (api.radar && api.radar.past) {
			this.mapFrames = [...api.radar.past];
			if (api.radar.nowcast) {
				this.mapFrames = this.mapFrames.concat(api.radar.nowcast);
			}
			this.lastPastFramePosition = api.radar.past.length - 1;
		}

		// Update timing based on actual frame count
		this.timing.totalScreens = this.mapFrames.length;
		this.calcNavTiming();

		// Show initial frame
		if (this.mapFrames.length > 0) {
			this.showFrame(this.lastPastFramePosition, true);
		}
	}

	refreshCurrentFrame() {
		if (this.mapFrames.length > 0) {
			this.showFrame(this.animationPosition, true);
		}
	}

	async getData(_weatherParameters) {
		const superResult = super.getData(_weatherParameters);
		if (!superResult) return;

		const weatherParameters = _weatherParameters ?? this.weatherParameters;

		const leafletDefaultZoom = 7;
		const leafletInitializationOptions = {
			zoomControl: false,
			dragging: false,
			touchZoom: false,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			boxZoom: false,
			keyboard: false,
			tap: false,
			attributionControl: false,
		};

		const tileSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';

		try {
			const mapContainer = document.getElementById('map');

			// Initialize Leaflet map if not already done
			if (!mapContainer._leaflet_id) {
				window._leafletMap = window.L.map(mapContainer, leafletInitializationOptions)
					.setView([weatherParameters.latitude, weatherParameters.longitude], leafletDefaultZoom);

				window.L.tileLayer(tileSource, {
					attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
				}).addTo(window._leafletMap);
			} else {
				window._leafletMap.setView([weatherParameters.latitude, weatherParameters.longitude], leafletDefaultZoom);
			}

			// Get radar data
			this.radarData = await this.getRadarData();
			await this.initializeRadar(this.radarData, 'radar');

			const todayKey = DateTime.now().toFormat('yyyy-MM-dd');

			const currentWeatherData = {
				icon: weatherParameters.forecast[todayKey].weather_code,
				temperature: weatherParameters.Temperature,
				city: weatherParameters.city,
			};

			this.addLocationMarker(
				weatherParameters.latitude,
				weatherParameters.longitude,
				weatherParameters.city,
				currentWeatherData,
			);

			this.setStatus(STATUS.loaded);
		} catch (error) {
			console.error('Failed to initialize radar:', error);
			this.setStatus(STATUS.failed);
		}
	}

	// Handle screen index changes from base class navigation
	screenIndexChange(screenIndex) {
		if (this.mapFrames.length > 0) {
			this.showFrame(screenIndex);
		}
	}

	async drawCanvas() {
		super.drawCanvas();

		// Update the display if we have frames
		if (this.mapFrames.length > 0) {
			this.showFrame(this.screenIndex);
		}

		this.finishDraw();
	}
}

// register display
registerDisplay(new Radar(10, 'radar'));
