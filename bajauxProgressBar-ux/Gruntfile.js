/*jshint node: true */

'use strict';

var SRC_FILES = [
  'src/rc/**/*.js',
  'Gruntfile.js',
  '!src/rc/**/*.buil*.js',
  '!src/rc/**/*.min.js'
  ],
  SPEC_FILES = [
    'srcTest/rc/spec/**/*.js'
  ],
  TEST_FILES = [
    'srcTest/rc/spec/**/*.js',
    'srcTest/rc/browserMain.js'
  ],
  ALL_FILES = SRC_FILES.concat(SPEC_FILES).concat(TEST_FILES);

module.exports = function runGrunt(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jsdoc: { src: SRC_FILES },
    jshint: { src: ALL_FILES },
    plato: { src: SRC_FILES },
    watch: {
      src: ALL_FILES
    },
    karma: {},
    niagara: {
      station: {
        stationName: 'bajauxProgressBar',
        forceCopy: true,
        sourceStationFolder: './srcTest/rc/stations/bajauxProgressBarTest',
        logLevel: 'INFO' //station logs of this severity or higher will output to console. default is 'NONE'
      }
    }
  });

  grunt.loadNpmTasks('grunt-niagara');
};
