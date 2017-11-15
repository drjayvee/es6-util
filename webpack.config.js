/*jshint node: true, esnext: true*/

const path = require('path');
const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
	entry: {
		NuCore: 'nucore.js',
		test: 'test.js',
		widgets: 'widgets.js',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'js'),
		publicPath: 'js/',
		library: '[name]',
		libraryTarget: 'var',
	},
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			use: {
				loader: 'babel-loader',
				options: {
					babelrc: true
				},
			}
		}]
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
