module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            basic: {
                src: ['public_html/js/bootstrap/*.js', 'public_html/js/angular/angular.js', 'public_html/js/angular/dependecies/*.js', 'public_html/js/module/*.js', 'public_html/js/factory/*.js', 'public_html/js/controller/*.js', 'public_html/js/controller/filtro/*.js'],
                dest: 'public_html/js/main.js',
            },
            extras: {
                src: ['public_html/css/bootstrap/*.css', 'public_html/css/angular/*.css', 'public_html/css/project/*.css'],
                dest: 'public_html/css/main.css',
            },
        },
        watch: {
            scripts: {
                files: ['public_html/js/module/*.js', 'public_html/js/factory/*.js', 'public_html/js/controller/*.js', 'public_html/js/controller/filtro/*.js'],
                tasks: ['concat'],
                options: {
                    interrupt: true,
                },
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-contrib-watch');
};