/**
 * @copyright 2018 Tridium, Inc. All Rights Reserved.
 */

/**
 * @module nmodule/bajauxProgressBar/rc/ProgressBarGauge
 * @private
 */
define([
    'nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget',
    'nmodule/bajauxProgressBar/rc/progressbar/progressbar.min',
    'baja!',
    'baja!gx:Font,bajauxProgressBar:ProgressBarType',
    'jquery',
    'Promise',
    'lex!bajauxProgressBar',
    'css!nmodule/bajauxProgressBar/rc/bajauxProgressBar'
  ], function (
    LivePointWidget,
    ProgressBar,
    baja,
    types,
    $,
    Promise,
    lexs
  ) {

  'use strict';

  var DEFAULT_FONT = baja.$('gx:Font'), // => '12.0pt sans-serif'
    DEFAULT_FONT_VALUE = 'null',
    DEFAULT_FONT_SIZE = 12,
    PROGRESS_BAR_TYPE = baja.$('bajauxProgressBar:ProgressBarType'), // defaults to 'Line'
    lex = lexs[0];

  /**
   * A gauge that uses the progress bar JavaScript library.
   *
   * @see {@link http://progressbarjs.readthedocs.io/en/latest/}
   * @see {@link http://kimmobrunfeldt.github.io/progressbar.js/}
   *
   * @private
   * @class
   * @alias module:nmodule/bajauxProgressBar/rc/ProgressBarGauge
   * @extends module:nmodule:/bajauxProgressBar/rc/livepoint/LivePointWidget
   */
  var ProgressBarGauge = function () {
    LivePointWidget.apply(this, arguments);

    this.properties()
      .add('valueText', '%out.value%')
      .add('min', -1)
      .add('max', -1)
      .add({
        name: 'gaugeType',
        value: PROGRESS_BAR_TYPE.getTag(),
        typeSpec: 'bajauxProgressBar:ProgressBarType'
      })
      .add({
        name: 'fill',
        value: 'white',
        typeSpec: 'gx:Color'
      })
      .add({
        name: 'background',
        value: 'white',
        typeSpec: 'gx:Color'
      })
      .add({
        name: 'barColor',
        value: '#00C0FF',
        typeSpec: 'gx:Color'
      })
      .add({
        name: 'trailColor',
        value: '#f4f4f4',
        typeSpec: 'gx:Color'
      })
      .add({
        name: 'textColor',
        value: '#3a3a3a',
        typeSpec: 'gx:Color'
      })
      .add({
        name: 'font',
        value: DEFAULT_FONT_VALUE,
        typeSpec: 'gx:Font'
      })
      .add({
        name: 'showText',
        value: true,
        typeSpec: 'baja:Boolean',
        properties: { trueText: lex.get('showText'), falseText: lex.get('hideText') }
      })
      .add({
        name: 'lineWidth',
        value: 2.1,
        typeSpec: 'baja:Double'
      });
  };

  ProgressBarGauge.prototype = Object.create(LivePointWidget.prototype);
  ProgressBarGauge.prototype.constructor = ProgressBarGauge;

  /**
   * Parses the given string into its constituent font settings
   *
   * @param {String} fontString
   * @returns {Object} an object containing the font settings
   */
  function parseFont(fontString) {

    if (!fontString || fontString === DEFAULT_FONT_VALUE) {
      fontString = DEFAULT_FONT.encodeToString();
    }

    var fontWeight = fontString.indexOf('bold') >= 0 ? 'bold' : 'normal';
    var fontStyle = fontString.indexOf('italic') >= 0 ? 'italic' : 'normal';
    var textDecoration = fontString.indexOf('underline') >= 0 ? 'underline' : 'none';

    // remove instances of bold, italic & underline from the string
    fontString = fontString.replace(/bold/g, '');
    fontString = fontString.replace(/italic/g, '');
    fontString = fontString.replace(/underline/g, '');
    fontString = fontString.trim();

    // This leaves pt size and fontName, so we can separate them around the pt (the first one!)
    var splitPoint = fontString.indexOf('pt'),
      fontSize = '',
      fontFamily = '';

    if (splitPoint >= 0) {
      fontSize = fontString.substring(0, splitPoint + 2);
      fontFamily = fontString.substring(splitPoint + 3); // 3 because we're expecting a space after xx.xpt
    }
    // change pt to px
    fontSize = fontSize.replace(/pt/g, 'px');

    // fix for sans Serif
    if (fontFamily.toLowerCase() === 'sansserif') {
      fontFamily = 'sans-serif';
    }

    return {
      'font-family': fontFamily,
      'font-size': fontSize,
      'font-weight': fontWeight,
      'font-style': fontStyle,
      'text-decoration': textDecoration
    };
  }


  /**
   * @returns {Object} settings to animate the Progress Bar
   */
  ProgressBarGauge.prototype.makeAnimationObject = function () {
    var containerWidth, fontSize, midway,
      isCircleGauge = this.properties().getValue('gaugeType') === 'Circle',
      css = parseFont(this.properties().getValue('font'));

    this.jq().css(css);

    if (isCircleGauge) {
      containerWidth = this.jq().width();
      fontSize = (css['font-size']) ? css['font-size'].replace(/px/g, '') : DEFAULT_FONT_SIZE;
      midway = (Number(fontSize) + containerWidth) / 2; // An adjustment to make the text sit in the middle of the circle
    }

    return {
      easing: 'easeInOut',
      color: this.properties().getValue('barColor'),
      strokeWidth: this.properties().getValue('lineWidth'),
      trailColor: this.properties().getValue('trailColor'),
      trailWidth: this.properties().getValue('lineWidth') * 0.5,
      fill: this.properties().getValue('fill'),
      duration: 800,
      text: {
        value: '',
        style: isCircleGauge ? {
          color: this.properties().getValue('textColor'),
          width: '100%',
          'text-align': 'center',
          position: 'relative',
          top: -midway + 'px'
        } : {
          color: this.properties().getValue('textColor'),
          position: 'absolute',
          left: '50%',
          top: '50%',
          padding: 0,
          margin: 0,
          // You can specify styles which will be browser prefixed
          transform: {
            prefix: true,
            value: 'translate(-50%, -50%)'
          }
        }
      },
      warnings: false
    };
  };

  /**
   * Render the Progress Bar widget.
   *
   * @param {Object} data - key/value pairs of data used to render the widget.
   */
  ProgressBarGauge.prototype.doRender = function (data) {
    var min = data.min || 0,
      max = data.max || 100,
      value = (data.value - min) / max,
      showText = this.properties().getValue('showText');

    this.$bar.animate(value, this.makeAnimationObject());
    this.$bar.setText(showText ? data.valueText : '');

    var background = this.properties().getValue('background');
    if (background) {
      this.jq('.progress-bar-gauge').css({ backgroundColor: background });
    }
  };

  /**
   * Initialize the Progress Bar Widget.
   *
   * @param {jQuery} element The element in which this Widget should build its HTML.
   * @returns {Promise}
   */
  ProgressBarGauge.prototype.doInitialize = function (element) {
    element.addClass('progress-bar-gauge-outer');
    element.html('<div class="progress-bar-gauge"></div>');

    this.$bar = new ProgressBar[this.properties().getValue('gaugeType')](
      element.children('.progress-bar-gauge').get(0),
      this.makeAnimationObject());

    return LivePointWidget.prototype.doInitialize.apply(this, arguments);
  };

  /**
   * Clean up after the Progress Bar when no longer needed.
   *
   * @returns {Promise}
   */
  ProgressBarGauge.prototype.doDestroy = function () {
    var that = this;
    that.jq().removeClass('progress-bar-gauge-outer');
    return Promise.resolve(that.$bar.destroy())
    .then(function () {
      that.$bar = null;
    });
  };

  return ProgressBarGauge;
});
