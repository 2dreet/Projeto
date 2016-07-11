module.exports = function(grunt){
	grunt.initConfig({
	  concat: {
		basic: {
		  src: ['public_html/js/bootstrap/*.js','public_html/js/angular/angular.js','public_html/js/angular/dependecies/*.js','public_html/js/module/*.js','public_html/js/factory/*.js','public_html/js/controller/*.js'],
		  dest: 'public_html/js/main.js',
		},
		extras: {
		  src: ['public_html/css/bootstrap/*.css','public_html/css/angular/*.css','public_html/css/project/*.css'],
		  dest: 'public_html/css/main.css',
		},
	  },
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
};