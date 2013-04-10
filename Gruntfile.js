module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
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
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        es5: true,
        globals: {
          describe: true,
          it: true
        }
      },
      uses_defaults: ['*.js', 'interfaces/*.js', 'test/**/*.js', 'samples/*.js', 'samples/*/*.js']
    },
  typescript: {
    base: {
      src: ['*.ts']
    },
  },
  simplemocha: {
    options: {
      timeout: 3000,
      ignoreLeaks: false,
      reporter: 'spec'
    },
    all: { src: 'test/**/*.js' }
  }
  });

  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('default', ['typescript', 'jshint', 'simplemocha']);

};