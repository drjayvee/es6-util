/*jshint node: true, esnext: true*/

const path = require('path');

module.exports = {
	entry: 'example/widgets.js',
	output: {
		filename: 'widgets.js',
		chunkFilename: '[name].widgets.js',
		path: path.resolve(__dirname, 'js'),
		publicPath: 'js/'
	},
	resolve: {
		alias: {
			Popper$: path.resolve(__dirname, 'node_modules/popper.js/dist/popper.js'),
		},
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		]
	}
};
