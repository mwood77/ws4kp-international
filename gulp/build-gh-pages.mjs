/* eslint-disable import/no-extraneous-dependencies */
import {
	src, dest, series, parallel,
} from 'gulp';
import terser from 'gulp-terser';
import concat from 'gulp-concat';
import ejs from 'gulp-ejs';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import { deleteAsync } from 'del';
import webpack from 'webpack-stream';
import TerserPlugin from 'terser-webpack-plugin';
import { readFile } from 'fs/promises';

const clean = () => deleteAsync(['./docs']);

const jsSourcesData = [
	'server/scripts/data/travelcities.js',
	'server/scripts/data/regionalcities.js',
	'server/scripts/data/stations.js',
];

const jsVendorSources = [
	'server/scripts/vendor/auto/jquery.js',
	'server/scripts/vendor/jquery.autocomplete.min.js',
	'server/scripts/vendor/auto/nosleep.js',
	'server/scripts/vendor/auto/swiped-events.js',
	'server/scripts/vendor/auto/suncalc.js',
];

const mjsSources = [
	'server/scripts/modules/currentweatherscroll.mjs',
	'server/scripts/modules/hazards.mjs',
	'server/scripts/modules/currentweather.mjs',
	'server/scripts/modules/almanac.mjs',
	'server/scripts/modules/icons.mjs',
	'server/scripts/modules/extendedforecast.mjs',
	'server/scripts/modules/hourly.mjs',
	'server/scripts/modules/hourly-graph.mjs',
	'server/scripts/modules/latestobservations.mjs',
	'server/scripts/modules/localforecast.mjs',
	'server/scripts/modules/radar.mjs',
	'server/scripts/modules/regionalforecast.mjs',
	'server/scripts/modules/travelforecast.mjs',
	'server/scripts/modules/marine-forecast.mjs',
	'server/scripts/modules/aqi-forecast.mjs',
	'server/scripts/modules/customweatherstation.mjs',
	'server/scripts/modules/progress.mjs',
	'server/scripts/index.mjs',
];

const BUILD_PATH = './docs/resources';

const webpackOptions = {
	mode: 'production',
	output: { filename: 'ws.min.js' },
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin({ extractComments: false })],
	},
};

const compressJsData = () => src(jsSourcesData)
	.pipe(concat('data.min.js'))
	.pipe(terser())
	.pipe(dest(BUILD_PATH));

const compressJsVendor = () => src(jsVendorSources)
	.pipe(concat('vendor.min.js'))
	.pipe(terser())
	.pipe(dest(BUILD_PATH));

const buildJs = () => src(mjsSources)
	.pipe(webpack(webpackOptions))
	.pipe(dest(BUILD_PATH));

const copyCss = () => src(['server/styles/main.css'])
	.pipe(concat('ws.min.css'))
	.pipe(dest(BUILD_PATH));

const compressHtml = async () => {
	const packageJson = await readFile('package.json');
	const { version } = JSON.parse(packageJson);

	return src('views/*.ejs')
		.pipe(ejs({
			production: true,
			version,
		}, {}, { ext: '.html' })) // Prevents EJS from escaping values
		.pipe(rename({ extname: '.html' }))
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(dest('./docs'));
};

const copyOtherFiles = () => src(['server/robots.txt', 'server/manifest.json'], { base: 'server/' })
	.pipe(dest('./docs'));

const build = series(clean, parallel(buildJs, copyCss, compressHtml, copyOtherFiles, compressJsData, compressJsVendor));

export default build;
