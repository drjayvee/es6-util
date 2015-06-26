/*jslint node: true*/
'use strict';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
	grunt.initConfig({
		babel: {
			options: {
				modules: 'amd',
				sourceMap: true
			},
			dist: {
				files: {
					'js/oop.js':		'src/oop.js',
					'js/attribute.js':	'src/attribute.js',
					'js/eventTarget.js':'src/eventTarget.js',
					
					'test/oop-test.js': 		'test/oop-test.es6.js',
					'test/eventTarget-test.js':	'test/eventTarget-test.es6.js',
					'test/attribute-test.js':	'test/attribute-test.es6.js'
				}
			}
		},
		
		clean: {
			babel: 'js'
		}
	});
	
	grunt.registerTask('default', ['clean:babel', 'babel']);
};
