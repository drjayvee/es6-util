/*jslint node: true*/
'use strict';

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
	grunt.initConfig({
		watch: {
			files: ['src/**/*.js'], 
			tasks: ['babel']
		},
		babel: {
			options: {
				sourceMap: true
			},
			dist: {
				files: [{
					expand: true,
					cwd: 'src/',
					src: ['**/*.js'],
					dest: '.'
				}]
			}
		},
		
		clean: {
			babel: ['js/*', 'test/*.js*']
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['clean:babel', 'babel']);
};
