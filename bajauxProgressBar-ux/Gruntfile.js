/*jshint node: true */

"use strict";

var SRC_FILES = [
  'src/rc/**/*.js',
  'Gruntfile.js',
  '!src/rc/**/*.buil*.js',
  '!src/rc/**/*.min.js'
];

module.exports = function runGrunt(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jsdoc:     { src: SRC_FILES },
    jshint:    { src: SRC_FILES },
    plato:     { src: SRC_FILES },
    watch:     { src: SRC_FILES }
  });

  grunt.loadNpmTasks('grunt-niagara');
};
