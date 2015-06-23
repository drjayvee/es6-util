'use strict';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
	grunt.initConfig({
		babel: {
			options: {
				modules: 'amd',
				sourceMap: true,
				resolveModuleSource: function (source, file) {
					if (source === 'node_modules/jquery/dist/jquery') {
						source = 'jquery';
					}
					return source;
				}
			},
			dist: {
				files: {
					'js/oop.js':		'src/oop.js',
					'js/attribute.js':	'src/attribute.js',
					'js/event.js':		'src/event.js'
				}
			}
		}
	});
	
	grunt.registerTask('default', ['babel']);
};
