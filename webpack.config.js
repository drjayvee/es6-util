/*jshint node: true, esnext: true*/

const path = require('path');
const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
	entry: 'nucore.js',
	output: {
		filename: 'nucore.js',
		chunkFilename: '[name].nucore.js',
		path: path.resolve(__dirname, 'js'),
		publicPath: 'js/',
		library: 'NuCore',
		libraryTarget: 'var',
	},
	plugins: [
		new MinifyPlugin(),
	],
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
