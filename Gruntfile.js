/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
  // Metadata.
  meta: {
    version: '0.1.0'
  },

  banner: '/*! <%= pkg.name %> - v<%= meta.version %> - ' +
             '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
             '* http://<%= pkg.homepage %>/\n' +
             '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
             '<%= pkg.author %>; Licensed MIT */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true,
        footer: ';Fireside.css = ' + JSON.stringify(grunt.file.read('www/css/cbox-side-view.css')) + ';Fireside.template = ' + JSON.stringify(grunt.file.read('www/partial.html')) + '; Fireside.init();',
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
      nonull:true
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
  minify: {
    expand: true,
    src: ['cbox-side-view.css'],
    dest: 'Fireside.css',
    ext: '.min.css'
  }
}


  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['cssmin','jshint', 'concat', 'uglify']);

};
