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
					'js/oop.js':		'src/js/oop.js',
					'js/attribute.js':	'src/js/attribute.js',
					'js/eventTarget.js':'src/js/eventTarget.js',
					
					'test/oop-test.js': 		'src/test/oop-test.js',
					'test/eventTarget-test.js':	'src/test/eventTarget-test.js',
					'test/attribute-test.js':	'src/test/attribute-test.js'
				}
			}
		},
		
		clean: {
			babel: ['js/*', 'test/*.js*']
		}
	});
	
	grunt.registerTask('default', ['clean:babel', 'babel']);
};
