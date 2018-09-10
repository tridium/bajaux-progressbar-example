/*jshint devel: true */
/*global testGlobals */

(function () {

  'use strict';

  require.config({
    baseUrl: '/base',
    config: {
      baja: {
        webdev: true
      }
    },
    hbs: {
      disableI18n: true,
      disableHelpers: true
    },
    paths: {
      baja: '/module/bajaScript/rc/plugin/baja',
      bajaScript: '/module/bajaScript/rc',
      bajaux: '/module/bajaux/rc',
      css: '/module/js/com/tridium/js/ext/require/css',
      Handlebars: '/module/js/rc/handlebars/handlebars-v4.0.6',
      hbs: '/module/js/rc/require-handlebars-plugin/hbs.built.min',
      jquery: '/module/js/rc/jquery/jquery-3.2.0.min',
      lex: '/module/js/rc/lex/lexplugin',
      nmodule: '/module',
      'nmodule/bajauxProgressBar': 'src',
      'nmodule/bajauxProgressBarTest': 'srcTest',
      Promise: '/module/js/rc/bluebird/bluebird',
      'niagara-test-server': '/niagara-test-server',
      underscore: '/module/js/rc/underscore/underscore',
      dialogs: '/module/js/rc/dialogs/dialogs',
      //specUtils: '/module/webEditorsTest/rc/spec/specUtils'
      //specUtils: '/module/microsTest/rc/specUtils/specUtils',
      log: '/module/js/rc/log/logPlugin'
    }
  });

  function testOnly(regex) {
    if (regex) {
      testGlobals.testOnly = regex;
    }
  }

  require([ 'niagara-test-server/karmaUtils',
    'niagara-test-server/globals' ], function (karmaUtils) {

    testOnly('');

    karmaUtils.setupAndRunSpecs({
      user: 'admin',
      pass: 'asdf1234',
      specs: [ 'srcTest/rc/spec/allSpecs' ]
    }, function (err) {
      if (err) {
        console.error(err);
      }
    });
  });
}());
