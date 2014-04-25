module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    //clean up destination dir
    clean: {
        clean: 'dist/*'
    },

    sass: {
      compile: {
        options: {
          includePaths: require('node-neat').includePaths,
          outputStyle: 'compressed'
        },
        files: {
          'app/css/main.css': 'app/css/main.scss'
        }
      // },
      // compileNeat: {
      //   optione: {
      //     includePaths: require('node-neat').includePaths,
      //   },
      //   files: {
      //     'app/css/main.css': 'app/css/main.scss'
      //   }
      }
    },

    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        ignores: ['app/js/vendor/*']
      },
      target: {
        src: 'app/js/**/*.js'
      }
    },

    express: {
      all: {
        options: {
          port: 9000,
          hostname: "0.0.0.0",
          bases: ['app'], 
          livereload: true
        }
      }
    },
 
    //Watch files for changes
    watch: {
      sass: {
        files: ['app/css/**/*.scss'], tasks: ['sass'], options: { livereload: true}
      },
      scripts: {
        files: [
          'app/js/**/*.js',
          'app/js/**/*.html',
          'app/css/**/*.css',
          'app/img/*',
          'app/index.html'
        ],
        options: {
          // spawn: false,
          livereload: true
        },
      },
    },
    // open will open the browser at the project's URL
    open: {
      all: {
        // Gets the port from the connect configuration
        path: 'http://localhost:<%= express.all.options.port%>'
      }
    },
    //minimize javascript modules
    uglify: {
      options: {
        mangle: true,
        compress: true,
        sourceMap: "dist/application.map",
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */',
        report: 'min'
      },
      dist: {
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: 'app',      // Src matches are relative to this path.
            src: ['js/*.js'], // Actual pattern(s) to match.
            dest: 'dist/'   // Destination path prefix.
          }
        ]
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 2 version', 'ie 8', 'ie 9']
      },
      multiple_files: {
        expand: true,
        flatten: true,
        src: 'app/css/**/*.css',
        dest: 'dist/css/'
      }
    },
    //minimize stylesheets
    cssmin: {
      combine: {
        files: {
          'dist/css/main.css': ['app/css/**/*.css']
        }
      },
      minify: {
        expand: true,
        cwd: 'dist/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/css/',
        ext: '.min.css'
      }
    },
    htmlbuild: {
      dist: {
        src: 'app/index.html',
        dest: 'dist/',
        options: {
          beautify: true,
          relative: true,
          styles: {
            bundle: ['dist/css/app.min.css']
          }
        }
      }
    },
    copy: {
     index: {
       files: [
         // copy index.html
         {src: ['app/index.html'], dest: 'dist/index.html', filter: 'isFile'},
         {src: ['app/js/mtbs-fires.json'], dest: 'dist/js/mtbs-fires.json', filter: 'isFile'}
       ]
     },
      images: {
        files: [
          // copy img folder
          {expand: true, cwd: 'app/img/', src: ['*'], dest: 'dist/img/', flatten: true, filter: 'isFile'}
        ]
      },
      vendorLibs: {
        files: [
          // copy img folder
          {expand: true, cwd: 'app/js/vendor/', src: ['*'], dest: 'dist/js/vendor/', flatten: true, filter: 'isFile'}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['clean', 'sass', 'cssmin', 'uglify', 'copy']);
  grunt.registerTask('server', [
    'express',
    'open',
    'watch'
  ]);
}
