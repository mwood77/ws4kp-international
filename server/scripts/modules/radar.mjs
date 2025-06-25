/* eslint-disable no-underscore-dangle */
// current weather conditions display
import STATUS from './status.mjs';
import WeatherDisplay from './weatherdisplay.mjs';
import { registerDisplay } from './navigation.mjs';

class Radar extends WeatherDisplay {
	radarLayers = [];

	maptFrames = [];

	animationPosition = 0;

	lastPastFramePosition = -1;

	loadingTilesCount = 0;

	loadedTilesCount = 0;

	radarData = {};

	static radarOptions = {
		kind: 'radar',
		tileSize: 256,
		colorScheme: 4,
		smoothData: 1,
		snowColors: 1,
		extension: 'webp',
	};

	constructor(navId, elemId) {
		super(navId, elemId, 'Local Radar', false);

		this.okToDrawCurrentConditions = false;
		this.okToDrawCurrentDateTime = false;

		// set max images
		this.dopplerRadarImageMax = 6;
		// update timing
		this.timing.baseDelay = 350;
		this.timing.delay = [
			{ time: 4, si: 5 },
			{ time: 1, si: 0 },
			{ time: 1, si: 1 },
			{ time: 1, si: 2 },
			{ time: 1, si: 3 },
			{ time: 1, si: 4 },
			{ time: 4, si: 5 },
			{ time: 1, si: 0 },
			{ time: 1, si: 1 },
			{ time: 1, si: 2 },
			{ time: 1, si: 3 },
			{ time: 1, si: 4 },
			{ time: 4, si: 5 },
			{ time: 1, si: 0 },
			{ time: 1, si: 1 },
			{ time: 1, si: 2 },
			{ time: 1, si: 3 },
			{ time: 1, si: 4 },
			{ time: 12, si: 5 },
		];
	}

	static isTilesLoading() {
		return this.loadingTilesCount > this.loadedTilesCount;
	}

	static removeLayer(layer) {
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

	/**
     * Animation functions
     * @param path - Path to the XYZ tile
     */
	static addLayer(frame) {
		if (frame) {
			const source = new window.L.TileLayer(`${this.radarData.host + frame.path}/${this.radarOptions.tileSize}/{z}/{x}/{y}/${this.radarOptions.colorScheme}/${this.radarOptions.smoothData}_${this.radarOptions.snowColors}.${this.radarOptions.extension}`, {
			// window.L.addLayer(`${this.radarData.host + frame.path}/${this.radarOptions.tileSize}/{z}/{x}/{y}/${this.radarOptions.colorScheme}/${this.radarOptions.smoothData}_${this.radarOptions.snowColors}.${this.radarOptions.extension}`, {
				tileSize: Radar.radarOptions.tileSize,
				opacity: 100,
				zIndex: frame.time,
			});

			// Check if the layer with the same _url already exists
			const exists = Object.values(window._leafletMap._layers).some(
				(layer) => layer._url === source._url,
			);
			if (!exists) {
				this.radarLayers.push(source);
				source.addTo(window._leafletMap);
			}
		}

		// console.log(source);

		// // Track layer loading state to not display the overlay
		// // before it will completelly loads
		// source.on('loading', startLoadingTile);
		// source.on('load', finishLoadingTile);
		// source.on('remove', finishLoadingTile);

		// this.radarLayers[frame.path] = source;

		// console.log(this.radarLayers);
		// // }
		// window.L.tileLayer(this.radarLayers[frame.path]).addTo(window._leafletMap);
		// if (!window.L.hasLayer(this.radarLayers[frame.path])) {
		// 	window.L.addLayer(this.radarLayers[frame.path]);
		// }
	}

	/**
     * Display particular frame of animation for the @position
     * If preloadOnly parameter is set to true, the frame layer only adds for the tiles preloading purpose
     * @param position
     * @param preloadOnly
     * @param force - display layer immediatelly
     */
	static changeRadarPosition(position, preloadOnly, force) {
		while (position >= this.mapFrames.length) {
			// eslint-disable-next-line no-param-reassign
			position -= this.mapFrames.length;
		}
		while (position < 0) {
			// eslint-disable-next-line no-param-reassign
			position += this.mapFrames.length;
		}

		const currentFrame = this.mapFrames[this.animationPosition];
		const nextFrame = this.mapFrames[position];

		const layer = this.radarLayers.find((l) => l._url.includes(currentFrame?.path));
		const nextLayer = this.radarLayers.find((l) => l._url.includes(nextFrame?.path));

		console.log(this.mapFrames);

		console.log(`currentFrame: ${JSON.stringify(currentFrame)}`);
		// Radar.removeLayer(layer);

		this.radarLayers.forEach((layerToZero) => {
			if (layerToZero && layerToZero.options) {
				layerToZero.options.opacity = 0;
			}
		});

		console.log(`nextFrame: ${JSON.stringify(nextFrame)}`);
		Radar.addLayer(nextFrame);

		// Quit if this call is for preloading only by design
		// or some times still loading in background
		if (preloadOnly || (Radar.isTilesLoading() && !force)) {
			return;
		}

		this.animationPosition = position;

		console.log(this.radarLayers);

		// if (layer) {
		// 	console.log(layer);
		// 	layer.setOpacity(0);
		// 	console.log('set layer opacity to 0');
		// 	console.log(layer);
		// }
		if (nextLayer) {
			console.log(nextLayer);
			nextLayer.setOpacity(100);
		}

		// if (this.radarLayers[currentFrame.path]) {
		// 	console.log('this.radarLayers[currentFrame.path]');
		// 	console.log(this.radarLayers[currentFrame.path]);
		// 	this.radarLayers[currentFrame.path].setOpacity(0);
		// }
		// this.radarLayers[nextFrame.path].setOpacity(100);

		// const pastOrForecast = nextFrame.time > Date.now() / 1000 ? 'FORECAST' : 'PAST';

		// document.getElementById('timestamp').innerHTML = `${pastOrForecast}: ${(new Date(nextFrame.time * 1000)).toString()}`;
		// console.log(`${pastOrForecast}: ${(new Date(nextFrame.time * 1000)).toString()}`);
	}

	/**
     * Check avialability and show particular frame position from the timestamps list
     */
	static showFrame(nextPosition, force) {
		const preloadingDirection = nextPosition - this.animationPosition > 0 ? 1 : -1;

		Radar.changeRadarPosition(nextPosition, false, force);

		// preload next next frame (typically, +1 frame)
		// if don't do that, the animation will be blinking at the first loop
		Radar.changeRadarPosition(nextPosition + preloadingDirection, true);
	}

	static async getRadarData() {
		const radarSource = 'https://api.rainviewer.com/public/weather-maps.json';
		return fetch(radarSource).then((res) => res.json());
	}

	static async initializeRadar(api, kind) {
		// remove all already added tiled layers
		const map = window._leafletMap;
		if (map && Array.isArray(this.radarLayers)) {
			this.radarLayers.forEach((layer) => {
				map.removeLayer(layer);
			});
		}
		this.mapFrames = [];
		this.radarLayers = [];
		this.animationPosition = 0;

		if (!api) {
			return;
		}
		if (kind === 'satellite' && api.satellite && api.satellite.infrared) {
			this.mapFrames = api.satellite.infrared;

			this.lastPastFramePosition = api.satellite.infrared.length - 1;
			Radar.showFrame(this.lastPastFramePosition, true);
		} else if (api.radar && api.radar.past) {
			this.mapFrames = api.radar.past;
			if (api.radar.nowcast) {
				this.mapFrames = this.mapFrames.concat(api.radar.nowcast);
			}

			// show the last "past" frame
			this.lastPastFramePosition = api.radar.past.length - 1;
			this.radarData = api;
			Radar.showFrame(this.lastPastFramePosition, true);
		}
	}

	async getData(_weatherParameters) {
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

		// const tileSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
		const tileSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';

		// if (!super.getData(_weatherParameters)) return;
		const weatherParameters = _weatherParameters ?? this.weatherParameters;

		const mapContainer = document.getElementById('map');

		// Only initialize if Leaflet hasn't attached a map yet
		if (!mapContainer._leaflet_id) {
			window._leafletMap = window.L.map(mapContainer, leafletInitializationOptions).setView([weatherParameters.latitude, weatherParameters.longitude], leafletDefaultZoom);

			window.L.tileLayer(tileSource, {
				attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
			}).addTo(window._leafletMap);
		} else {
			console.warn('Leaflet map already initialized.');
			window._leafletMap.setView([weatherParameters.latitude, weatherParameters.longitude], leafletDefaultZoom);
		}

		this.radarData = await Radar.getRadarData();
		// this.radarData = data;
		console.log(this.radarData);

		await Radar.initializeRadar(this.radarData, 'radar');

		// Then add a labels-only layer (must be transparent tiles with labels)
		// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		// 	opacity: 0.5, // Adjust for blend effect
		// 	pane: 'overlayPane',
		// }).addTo(map);

		this.setStatus(STATUS.loaded);

		// // ALASKA AND HAWAII AREN'T SUPPORTED!
		// if (weatherParameters.state === 'AK' || weatherParameters.state === 'HI') {
		// 	this.setStatus(STATUS.noData);
		// 	return;
		// }

		// // get the base map
		// let src = 'images/4000RadarMap2.jpg';
		// if (weatherParameters.State === 'HI') src = 'images/HawaiiRadarMap2.png';
		// this.baseMap = await loadImg(src);

		// const baseUrl = 'https://mesonet.agron.iastate.edu/archive/data/';
		// const baseUrlEnd = '/GIS/uscomp/';
		// const baseUrls = [];
		// let date = DateTime.utc().minus({ days: 1 }).startOf('day');

		// // make urls for yesterday and today
		// while (date <= DateTime.utc().startOf('day')) {
		// 	baseUrls.push(`${baseUrl}${date.toFormat('yyyy/LL/dd')}${baseUrlEnd}`);
		// 	date = date.plus({ days: 1 });
		// }

		// const lists = (await Promise.all(baseUrls.map(async (url) => {
		// 	try {
		// 	// get a list of available radars
		// 		return text(url, { cors: true });
		// 	} catch (error) {
		// 		console.log('Unable to get list of radars');
		// 		console.error(error);
		// 		this.setStatus(STATUS.failed);
		// 		return false;
		// 	}
		// }))).filter((d) => d);

		// // convert to an array of gif urls
		// const pngs = lists.flatMap((html, htmlIdx) => {
		// 	const parser = new DOMParser();
		// 	const xmlDoc = parser.parseFromString(html, 'text/html');
		// 	// add the base url
		// 	const base = xmlDoc.createElement('base');
		// 	base.href = baseUrls[htmlIdx];
		// 	xmlDoc.head.append(base);
		// 	const anchors = xmlDoc.querySelectorAll('a');
		// 	const urls = [];
		// 	Array.from(anchors).forEach((elem) => {
		// 		if (elem.innerHTML?.match(/n0r_\d{12}\.png/))	{
		// 			urls.push(elem.href);
		// 		}
		// 	});
		// 	return urls;
		// });

		// // get the last few images
		// const timestampRegex = /_(\d{12})\.png/;
		// const sortedPngs = pngs.sort((a, b) => (a.match(timestampRegex)[1] < b.match(timestampRegex)[1] ? -1 : 1));
		// const urls = sortedPngs.slice(-(this.dopplerRadarImageMax));

		// // calculate offsets and sizes
		// let offsetX = 120;
		// let offsetY = 69;
		// const width = 2550;
		// const height = 1600;
		// offsetX *= 2;
		// offsetY *= 2;
		// const sourceXY = utils.getXYFromLatitudeLongitudeMap(weatherParameters, offsetX, offsetY);

		// // create working context for manipulation
		// const workingCanvas = document.createElement('canvas');
		// workingCanvas.width = width;
		// workingCanvas.height = height;
		// const workingContext = workingCanvas.getContext('2d');
		// workingContext.imageSmoothingEnabled = false;

		// // calculate radar offsets
		// const radarOffsetX = 120;
		// const radarOffsetY = 70;
		// const radarSourceXY = utils.getXYFromLatitudeLongitudeDoppler(weatherParameters, offsetX, offsetY);
		// const radarSourceX = radarSourceXY.x / 2;
		// const radarSourceY = radarSourceXY.y / 2;

		// // Load the most recent doppler radar images.
		// const radarInfo = await Promise.all(urls.map(async (url) => {
		// 	// create destination context
		// 	const canvas = document.createElement('canvas');
		// 	canvas.width = 640;
		// 	canvas.height = 367;
		// 	const context = canvas.getContext('2d');
		// 	context.imageSmoothingEnabled = false;

		// 	// get the image
		// 	const response = await fetch(rewriteUrl(url));

		// 	// test response
		// 	if (!response.ok) throw new Error(`Unable to fetch radar error ${response.status} ${response.statusText} from ${response.url}`);

		// 	// get the blob
		// 	const blob = await response.blob();

		// 	// store the time
		// 	const timeMatch = url.match(/_(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)\./);
		// 	let time;
		// 	if (timeMatch) {
		// 		const [, year, month, day, hour, minute] = timeMatch;
		// 		time = DateTime.fromObject({
		// 			year,
		// 			month,
		// 			day,
		// 			hour,
		// 			minute,
		// 		}, {
		// 			zone: 'UTC',
		// 		}).setZone(timeZone());
		// 	} else {
		// 		time = DateTime.fromHTTP(response.headers.get('last-modified')).setZone(timeZone());
		// 	}

		// 	// assign to an html image element
		// 	const imgBlob = await loadImg(blob);

		// 	// draw the entire image
		// 	workingContext.clearRect(0, 0, width, 1600);
		// 	workingContext.drawImage(imgBlob, 0, 0, width, 1600);

		// 	// get the base map
		// 	context.drawImage(await this.baseMap, sourceXY.x, sourceXY.y, offsetX * 2, offsetY * 2, 0, 0, 640, 367);

		// 	// crop the radar image
		// 	const cropCanvas = document.createElement('canvas');
		// 	cropCanvas.width = 640;
		// 	cropCanvas.height = 367;
		// 	const cropContext = cropCanvas.getContext('2d', { willReadFrequently: true });
		// 	cropContext.imageSmoothingEnabled = false;
		// 	cropContext.drawImage(workingCanvas, radarSourceX, radarSourceY, (radarOffsetX * 2), (radarOffsetY * 2.33), 0, 0, 640, 367);
		// 	// clean the image
		// 	utils.removeDopplerRadarImageNoise(cropContext);

		// 	// merge the radar and map
		// 	utils.mergeDopplerRadarImage(context, cropContext);

		// 	const elem = this.fillTemplate('frame', { map: { type: 'img', src: canvas.toDataURL() } });

		// 	return {
		// 		canvas,
		// 		time,
		// 		elem,
		// 	};
		// }));

		// // put the elements in the container
		// const scrollArea = this.elem.querySelector('.scroll-area');
		// scrollArea.innerHTML = '';
		// scrollArea.append(...radarInfo.map((r) => r.elem));

		// // set max length
		// this.timing.totalScreens = radarInfo.length;
		// // store the images
		// this.data = radarInfo.map((radar) => radar.canvas);

		// this.times = radarInfo.map((radar) => radar.time);
		// this.setStatus(STATUS.loaded);
	}

	async drawCanvas() {
		super.drawCanvas();
		// const time = this.times[this.screenIndex].toLocaleString(DateTime.TIME_SIMPLE);
		// const timePadded = time.length >= 8 ? time : `&nbsp;${time}`;
		// this.elem.querySelector('.header .right .time').innerHTML = timePadded;

		// // get image offset calculation
		// // is slides slightly because of scaling so we have to take a measurement from the rendered page
		// const actualFrameHeight = this.elem.querySelector('.frame').scrollHeight;

		// // scroll to image
		// this.elem.querySelector('.scroll-area').style.top = `${-this.screenIndex * actualFrameHeight}px`;

		this.finishDraw();
		// this.play();
	}

	play() {
		Radar.showFrame(this.animationPosition + 1);

		// Main animation driver. Run this function every 500 ms
		this.animationTimer = setTimeout(this.play, 3000);
	}
}

// register display
registerDisplay(new Radar(10, 'radar'));
