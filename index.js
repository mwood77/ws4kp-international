// express
const express = require('express');

const app = express();
const port = process.env.WS4KP_PORT ?? 8080;
const path = require('path');

// template engine
app.set('view engine', 'ejs');

// cors pass through
const fs = require('fs');

// version
const { version } = JSON.parse(fs.readFileSync('package.json'));

const index = (req, res) => {
	res.render(path.join(__dirname, 'views/index'), {
		production: false,
		version,
	});
};

// debugging
if (process.env?.DIST === '1') {
	// distribution
	app.use('/images', express.static(path.join(__dirname, './server/images')));
	app.use('/fonts', express.static(path.join(__dirname, './server/fonts')));
	app.use('/scripts', express.static(path.join(__dirname, './server/scripts')));
	app.use('/', express.static(path.join(__dirname, './dist')));
} else {
	// debugging
	app.get('/index.html', index);
	app.get('/', index);
	app.get('*', express.static(path.join(__dirname, './server')));
}

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

// graceful shutdown
const gracefulShutdown = () => {
	server.close(() => {
		console.log('Server closed');
	});
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
