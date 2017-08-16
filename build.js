/*jshint node: true*/

var path = require('path');
var Builder = require('systemjs-builder');

var builder = new Builder();

builder.config({
	map: {
		'plugin-babel':			'node_modules/systemjs-plugin-babel/plugin-babel.js',
		'systemjs-babel-build':	'node_modules/systemjs-plugin-babel/systemjs-babel-browser.js'
	},
	baseURL: path.resolve('src')
});

var bundleOptions = {
	// minify: true,
	// sourceMaps: true
};

Promise.all([
	builder.bundle('js/* - [js/tabView.js]', 'dist/js/common.js', bundleOptions),
	builder.bundle('[js/tabView.js]', 'dist/js/tabView.js', bundleOptions),
	builder.bundle('[main.js]', 'dist/main.js', bundleOptions)
])
	.then(function () {
		console.log('Build complete');
	})
	.catch(function(err) {
		console.log('Build error');
		console.log(err);
	});
