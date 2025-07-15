[![build-docker](https://github.com/mwood77/ws4kp-international/actions/workflows/build-docker.yaml/badge.svg)](https://github.com/mwood77/ws4kp-international/actions/workflows/build-docker.yaml)
[![pages-build-deployment](https://github.com/mwood77/ws4kp-international/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/mwood77/ws4kp-international/actions/workflows/pages/pages-build-deployment)

# WeatherStar 4000+ (International)

<div align="center"> 
    <img src="./overview.gif" alt="Weatherstar 4000+ International" width="600">
</div>

This project is a fork of [`ws4kp`](https://github.com/netbymatt/ws4kp) by [@netbymatt](https://github.com/netbymatt), which has been refactored to run on [Open Meteo's aggregated forecast API](https://open-meteo.com/en/docs). This means this fork of the `ws4kp` works for locations outside of the USA.

A live version of this project is available at https://mwood77.github.io/ws4kp-international

## About

This project aims to bring back the feel of the 90's with a weather forecast that has the look and feel of The Weather Channel at that time but available in a modern way. 

This is by no means intended to be a perfect emulation of the WeatherStar 4000, the hardware that produced those wonderful blue and orange graphics you saw during the local forecast on The Weather Channel. If you would like a much more accurate project please see the [WS4000 Simulator](http://www.taiganet.com/). 

Instead, this project intends to create a simple to use interface with minimal configuration fuss. Some changes have been made to the screens available because either more or less forecast information is available today than was in the 90's. Most of these changes are captured in sections below.

## Acknowledgements

This project is based on the work of [Mike Battaglia](https://github.com/vbguyny/ws4kp) and [@netbymatt](https://github.com/netbymatt). This internationalized version was forked in February 2025.

* Mike Battaglia for the original project and all of the code which draws the weather displays. This code remains largely intact and was a huge amount of work to get exactly right. He's also responsible for all of the background graphics including the maps used in the application.
* The team at [TWCClassics](https://twcclassics.com/) for several resources.
	* A [font](https://twcclassics.com/downloads.html) set used on the original WeatherStar 4000
	* [Icon](https://twcclassics.com/downloads.html) sets
	* Countless photos and videos of WeatherStar 4000 forecasts used as references.
* [@netbymatt](https://github.com/netbymatt) for modernizing & module'ing Mike's original project. 

## Architecture

The original authors of this project tried to use as few libraries (and external dependencies) as possible - I'm trying my best to continue in this manner where applicable.

However, some compromises were made while porting this to a different data providers. NOAA was replaced as the sole data provider, with the following:
- Open Meteo
	- General forecast: https://open-meteo.com/en/docs
	- Marine forecast: https://open-meteo.com/en/docs/marine-weather-api
	- Air Quality: https://open-meteo.com/en/docs/air-quality-api
	- Geocoding: https://open-meteo.com/en/docs/geocoding-api
- Wikipedia API and Wikidata Sparql API
	- [Used for unconventional reverse-geocoding-like lookups](https://github.com/mwood77/ws4kp-international/blob/main/server/scripts/modules/utils/nearby-cities.mjs). It's actually a knowledge graph lookup, but we're splitting hairs here.
- Rainviewer API for radar precipitation (this may change):
	- https://www.rainviewer.com/api.html
- ArcGIS by Esri for leaflet map tiles:
	- https://www.arcgis.com/index.html

The project architecture is MVC-like, where views (`~/views/`) are separated from logic handlers (`~/server/scripts/modules/`
), but there is no distinct flow-control logic. I hope to rectify this in the future.

The closest flow control is handled in these files:
- Entry point is: 
	- https://github.com/mwood77/ws4kp-international/blob/main/server/scripts/index.mjs
- A majority of the local storage manipulation is handled [here](https://github.com/mwood77/ws4kp-international/blob/7c13654b32f639e9c24c057ac1948b194d3f2aa4/server/scripts/index.mjs#L84-L146), but there are some outliers. This mostly pertains to Query Param handling, which needs a refactor. [See this issue](https://github.com/mwood77/ws4kp-international/issues/55)
- Core forecast information is retrieved here: 
	- https://github.com/mwood77/ws4kp-international/blob/main/server/scripts/modules/utils/weather.mjs
- Global settings are instantiated here: 
	- https://github.com/mwood77/ws4kp-international/blob/main/server/scripts/modules/settings.mjs
- Base `Setting` class handles initialization and individual (local) storage: 
	- https://github.com/mwood77/ws4kp-international/blob/main/server/scripts/modules/utils/setting.mjs

Formatted weather data is passed into each "view controller" through their constructor as `_weatherParameters` (in getData(...)), and generally assigned to `this.weatherParameters` or `this.data` (depends on who authored the module). This data object looks like:

```js
// Example data for Tokyo

{
    "latitude": 35.6894,
    "longitude": 139.6917,
    "city": "Tokyo",
    "state": "Tokyo",
    "country": "Japan",
    "timeZone": "Asia/Tokyo",
    "forecast": {
        "2025-07-09": {	// Day
            "hours": [
				...
				// Data points per hour
			],
			// All parent values beneath are "daily" values, which were average from the "hours" array
            "temperature_2m": 28.64583333333333,
            "relative_humidity_2m": 78.79166666666667,
            "dew_point_2m": 24.424999999999994,
            "apparent_temperature": 34.400000000000006,
            "precipitation_probability": 0,
            "precipitation": 0,
            "rain": 0,
            "showers": 0,
            "snowfall": 0,
            "snow_depth": 0,
            "weather_code": "0",
            "pressure_msl": 1010.9916666666668,
            "surface_pressure": 1006.4291666666668,
            "cloud_cover": 8.083333333333334,
            "visibility": 24140,
            "evapotranspiration": 0.07541666666666667,
            "et0_fao_evapotranspiration": 0.2233333333333333,
            "vapour_pressure_deficit": 0.8979166666666667,
            "uv_index": 2.672916666666667,
            "uv_index_clear_sky": 2.672916666666667,
            "is_day": 0.5833333333333334,
            "sunshine_duration": 1849.0775,
            "wet_bulb_temperature_2m": 25.545833333333334,
            "wind_speed_10m": 6.379166666666666,
            "wind_direction_10m": 181.25,
            "wind_gusts_10m": 32.074999999999996,
            "temperature_2m_max": 32.5,
            "temperature_2m_min": 25.5,
            "uv_index_max": 8.35
        }
    },
    "stationId": "stationId-dont-matter-anymore",
    "zoneId": "zoneId-dont-matter",
    "radarId": "radarId-dont-matter",
    "weatherOffice": "weatherOffice-dont-matter",
    "Temperature": 30,
    "TemperatureUnit": "C",
    "DewPoint": 24.2,
    "Ceiling": 0.39,
    "CeilingUnit": "km",
    "Visibility": 24.14,
    "VisibilityUnit": "km",
    "WindSpeed": 8.7,
    "WindDirection": "S",
    "Pressure": 1010.1,
    "CloudCover": 11,
    "UV": 8,
    "WindGust": 46.8,
    "WindUnit": "km/h",
    "Humidity": 71,
    "PressureUnit": "hPa",
    "PressureDirection": "steady",
    "TextConditions": 0,
    "nearbyCities": [
        {
            "city": "Tokyo",
            "lat": "35.683889",
            "lon": "139.774444",
            "population": "9640742"
        },
        {
            "city": "Yokohama",
            "lat": "35.433333333",
            "lon": "139.65",
            "population": "3757630"
        },
        {
            "city": "Osaka",
            "lat": "34.69375",
            "lon": "135.502111111",
            "population": "2751862"
        },
        {
            "city": "Nagoya",
            "lat": "35.181388888",
            "lon": "136.906388888",
            "population": "2326844"
        }
    ]
}
```

Lastly, `ws4kp-international` utilizes a customized instance of [`cors-anywhere`](https://github.com/Rob--W/cors-anywhere) to manage CORS on some APIs. This instance of `cors-anywhere` is owned and managed by me (@mwood77), and is only available to this project. It does not collect any personally identifiable information (PII) and can only interact with the Wikidata API. Features that use this proxy are not enabled by default - the proxy is only utilized when "**Experimental Features**" are enabled.

## Run Your WeatherStar
There are a lot of CORS considerations and issues with api.weather.gov that are easiest to deal with by running a local server to see this in action (or use the live link above). You'll need Node.js >12.0 to run the local server.

### To run via Node locally:
```
git clone https://github.com/mwood77/ws4kp-international.git
cd ws4kp
npm i
npm run start
```

### To run via Docker: 
```
docker run -p 8080:8080 ghcr.io/mwood77/ws4kp-international
```

After running this project in either way, pen your web browser: 
- http://localhost:8080/ 

### Deployment
#### GitHub Pages

`ws4kp-international`'s main "showcase" is a deployed instance via GitHub Pages. To prepare a new release run the following command:

```
# Mac & Linux users
npm run build

# Windows users
npm run build:win
```

This will update the artifacts in the `/docs` folder. Simply commit them as part of your branch, and push them to remote. Deployment will be handled automatically when your PR is merged into `main`.

#### Docker Image
This is handled automatically as part of CI/CD, when your code is merged to `main`.

## Updates in 11.0.0

- Reintroduces Radar screen
- Introduces ***Experimental Features***
	- If this is enabled and data is present, cascading features ~~will~~ may appear across different displays; ex, additional city AQI values on the Air Quality Index Forecast and Radar Screen.
#### Under the hood
- Nearby cities lookup; this is a new query, which gets national city data (top populous cities) when enabled.
	- However this is a very slow query and somewhat unreliable (can take 2-5 seconds to resolve on location change). This data is written to localStorage once retrieved, and removed when "Experimental Features" is disabled.

## Updates in 10.0.0

- Air Quality Index Forecast powered by [Open Meteo's Air Quality API](https://open-meteo.com/en/docs/air-quality-api)

## Updates in 9.0.0

>[!IMPORTANT]
> The Marine Forecast (and this site in general) **should not** be used in life threatening weather situations, or be relied on to inform the public of such situations. It is your responsibility to check your local forecast and make an informed decision. See [Disclaimer](#disclaimer)

- Marine Forecast powered by [Open Meteo's Marine API](https://open-meteo.com/en/docs/marine-weather-api)

## Updates in 8.0.0
- Introduces [Webamp](https://github.com/captbaritone/webamp)
	- Music is streamed from the Internet Archive and the playlist is a chunk of [*Weatherscan Music: The TRUE Complete Collection*](https://archive.org/details/weatherscancompletecollection/01+Fair+Weather.mp3)
- Time is now configurable between 12-hour and 24-hour formats
- Hourly forecast is now retrieved using timezone instead of toISOString
- Scan lines
- Pressure in mmHg added
- Wipe reveal effect added to scrolling conditions

## Updates in 7.0.0
- Weather units are now customizable. These are broken down by category, which are:
	- Wind Units: `m/s`, `km/h`, `knots`, `mph`
	- Temperature Units: `C`, `F`, `K`
	- Distance Units: `km`, `mi`, `ft`, `meters`, `bananas`
	- Pressure Units: `hpa`, `inHg`
- Added new fields to the **Current Conditions** screen:
	- Cloud Cover: `_%`
	- UV Index: `0 -> 11`
- Changed **Hourly Graph**'s time scale to use 24 hours instead of 12 hour cycle
- Converted all compatible views to render correct values based on user's unit selection
- Corrected an incorrect calculation of **Current Conditions** cloud cover value
- Corrected an incorrect calculation of **Current Conditions** ceiling and visibility values

## Updates in 6.0.0 (Internationalization w/ Open Meteo)
This is a significant divergence from 5.0.0 and is exclusive to this fork.

This migrates the project away from NOAA's USA exclusive weather API to [Open Meteo's global weather API](https://open-meteo.com/en/docs). This means that _this fork_ is capable of rendering weather data across the globe.

However, there are some caveats. Migrating to Open Meteo means that there is some loss of functionality, namely the loss of radar imagery, and observation station data, and hazards. This means that the following screens are no longer functional:
- Hazards
- Latest Observations
- Travel Forecast
- Regional Forecast
- ~~Local Radar~~

## Updates in 5.0.0
The change to 5.0 changes from drawing the weather graphics on canvas elements and instead uses HTML and CSS to style all of the weather graphics. A lot of other changes and fixes were implemented at the same time.

* Replace all canvas elements with HTML and CSS
* City and airport names are better parsed to fit the available space
* Remove the dependency on libgif-js
* Use browser for text wrapping where necessary
* Some new weather icons
* Refresh only on slideshow repeat
* Removed Almanac 30-day outlook
* Fixed startup issue when current conditions are unavailable

### Why the fork (pre 5.0.0)?

The fork is a result of wanting a more manageable, modern code base to work with. Part of it is an exercise in my education in JavaScript. There are several technical changes that were made behind the scenes.

* Make use of the new API available at https://api.weather.gov ([documentation](https://www.weather.gov/documentation/services-web-api)). This caused the removal of some of the original WeatherStar 4000 displays, and allowed for new displays to be created.
* Changed code to make extensive use of ES6 functionality including:
	* Arrow functions
	* Promises
	* Async/await and parallel loading of all forecast resources
	* Classes
* Common code base for each display through use of classes
* Separation between weather display code and user interface
* Use of a modern date parsing library [luxon](https://moment.github.io/luxon/)
* Attempt to remove the need for a local server to bypass [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) issues with the various APIs used. This is almost workable but there are still some minor CORS issues with https://api.weather.gov.
	* The necessary CORS pass through URLs have been rewritten so they can be deployed on Node.js using the included server or through S3/Cloudfront in a serverless environment.
* Proper settings for static resource caching
* Build system integration to reduce the number of scripts that need to be loaded

### What's different

I've made several changes to this Weather Star 4000 simulation compared to the original hardware unit and the code that this was forked from.

* Radar displays the timestamp of the image.
* A new hour-by-hour graph of the temperature, cloud cover and precipitation chances for the next 24 hours.
* A new hourly forecast display for the next 24 hours is available, and is shown in the style of the travel cities forecast. (off by default because it duplicates the hourly graph)
* The "Local Forecast" and "Extended Forecast" provide several additional days of information compared to the original format in the 90's.
* Narration was removed. In the original code narration made use of the computer's local text-to-speech engine which didn't sound great.
* Music was removed. I don't want to deal with copyright issues and hosting MP3s. If you're looking for the music that played during forecasts please visit [TWCClassics](https://twcclassics.com/audio/).
* Marine forecast (tides) is not available as it is not part of the new API.
* The nearby cities displayed on screens such as "Latest Observations" and "Regional Forecast" are likely not the same as they were in the 90's. The weather monitoring equipment at these stations move over time for one reason or another, and coming up with a simple formulaic way of finding nearby stations is sufficient to give the same look-and-feel as the original.
* "Flavors" are not present in this simulation. Flavors refer to the order of the weather information that was shown on the original units. Instead, the order of the displays has been fixed and a checkboxes can be used to turn on and off individual displays. The travel forecast has been defaulted to off so only local information shows for new users.

## Sharing a permalink (bookmarking)
Selected displays, the forecast city and widescreen setting are sticky from one session to the next. However if you would like to share your exact configuration or bookmark it click the "Copy Permalink" (or get "Get Parmalink") near the bottom of the page. A URL will be copied to your clipboard with all of you selected displays and location (or copy it from the page if your browser doesn't support clipboard transfers directly). You can then share this link or add it to your bookmarks.

## Kiosk mode
Kiosk mode can be activated by a checkbox on the page. Note that there is no way out of kiosk mode (except refresh or closing the browser), and the play/pause and other controls will not be available. This is deliberate as a browser's kiosk mode it intended not to be exited or significantly modified.

It's also possible to enter kiosk mode using a permalink. First generate a [Permalink](#sharing-a-permalink-bookmarking), then to the end of it add `&kiosk=true`. Opening this link will load all of the selected displays included in the Permalink, enter kiosk mode immediately upon loading and start playing the forecast.

## Wish list (Feature Requests)

If you think a feature is missing, please add a feature request here:
- https://github.com/mwood77/ws4kp-international/issues

## Community Notes

Thanks to the WeatherStar community for providing these discussions to further extend your retro forecasts!

* [Stream as FFMPEG](https://github.com/netbymatt/ws4kp/issues/37#issuecomment-2008491948)

<!-- ## Customization
A hook is provided as `/server/scripts/custom.js` to allow customizations to your own fork of this project, without accidentally pushing your customizations back upstream to the git repository. An sample file is provided at `/server/scripts/custom.sample.js` and should be renamed to `custom.js` activate it. -->

## Issue reporting and feature requests
Found a bug? Please report it here:
- https://github.com/mwood77/ws4kp-international/issues

## Disclaimer

This web site should NOT be used in life threatening weather situations, or be relied on to inform the public of such situations. The Internet is an unreliable network subject to server and network outages and by nature is not suitable for such mission critical use. If you require such access to NWS data, please consider one of their subscription services. The authors of this web site shall not be held liable in the event of injury, death or property damage that occur as a result of disregarding this warning.

The WeatherSTAR 4000 unit and technology is owned by The Weather Channel. This web site is a free, non-profit work by fans. All of the back ground graphics of this web site were created from scratch.  The icons were created by Charles Abel and Nick Smith (http://twcclassics.com/downloads/icons.html) as well as by Malek Masoud.  The fonts were originally created by Nick Smith (http://twcclassics.com/downloads/fonts.html).

