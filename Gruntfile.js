module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            basic: {
                src: [ 'www/js/module/*.js', 'www/js/factory/*.js', 'www/js/controller/*.js', 'www/js/controller/filtro/*.js'],
                dest: 'www/js/main3.js',
            },
            extras: {
                src: ['www/css/bootstrap/*.css', 'www/css/angular/*.css', 'www/css/project/*.css'],
                dest: 'www/css/main.css',
            },
        },
        watch: {
            scripts: {
                files: ['www/js/module/*.js', 'www/js/factory/*.js', 'www/js/controller/*.js', 'www/js/controller/filtro/*.js'],
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