module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    //test: {
    //  files: ['test/**/*.js']
    //},
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
        es5: true
      },
      //uses_defaults: ['grunt.js', '*.js', 'interfaces/*.js', 'test/**/*.js', 'samples/*.js', 'samples/*/*.js'],
      uses_defaults: ['grunt.js', '*.js', 'interfaces/*.js', 'samples/*.js', 'samples/*/*.js'],
      globals: {
        exports: true,
        describe: true,
        it: true
      }
    },
  typescript: {
    base: {
      src: ['*.ts']
    }
  }
  });

  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['typescript', 'jshint']);

};