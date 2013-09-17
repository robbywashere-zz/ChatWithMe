/*global module:false*/
module.exports = function(grunt) {




    // Load in `grunt-spritesmith`

    // Project configuration.
    grunt.initConfig({

        sprite: {
            all: {
                src: 'www/images/*.png',
                destImg: 'www/css/sprites.png',
                destCSS: 'www/css/sprites.css',
                imgPath: 'css/sprites.png',

                cssOpts: {
                    'cssClass': function(item) {
                        return '.icon.' + item.name;
                    }

                }
            }
        },
        pkg: grunt.file.readJSON('package.json'),
        // Metadata.
        meta: {
            version: '0.1.0'
        },

        banner: '/*! <%= pkg.name %> - v<%= meta.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '* <%= pkg.homepage %>\n' + '* Copyright (c) <%= grunt.template.today("yyyy") %> ' + '<%= pkg.author %>; Licensed MIT */\n',
        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true,
                footer: ';Fireside.css = ' + JSON.stringify(grunt.file.read('www/css/out.min.css')) + ';Fireside.template = ' + JSON.stringify(grunt.file.read('www/partial.html')) + ';',
            },
            dist: {
                src: [
                        'www/js/vendor/store+json2.min.js',
                        'www/js/vendor/strophe.js',
                        'www/js/intro.js',
                        'www/js/Fireside-util.js',
                        'www/js/Fireside-logic.js',
                        'www/js/Fireside-ui.js',
                        'www/js/outro.js'
                ],
                dest: 'www/js/Fireside.js',
                nonull: true
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },


            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'www/js/Fireside.min.js'
            }
        },
        jshint: {
            files: ['www/js/*', '!www/js/vendor/**', '!www/js/**.min.js', '!<%= concat.dist.dest %>'],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            }
        },


        cssmin: {

            combine: {
                files: {
                    'www/css/out.css': ['www/css/cbox-side-view.css', 'www/css/sprites.css']
                },
                nonull: true
            },
            minify: {
                expand: true,
                src: 'www/css/out.css',
                ext: '.min.css',
                nonull: true
            }
        }


    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-spritesmith');

    // Default task.
    grunt.registerTask('default', ['sprite', 'cssmin', 'concat', 'uglify']);

};
