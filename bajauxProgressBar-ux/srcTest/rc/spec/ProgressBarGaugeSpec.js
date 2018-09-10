define([
    'baja!',
    'baja!gx:Font,bajauxProgressBar:ProgressBarType',
    'jquery',
    'Promise',
    'nmodule/js/rc/jasmine/promiseUtils',
    'nmodule/bajauxProgressBar/rc/ProgressBarGauge',
    'nmodule/bajauxProgressBar/rc/progressbar/progressbar.min'
  ], function (
    baja,
    types,
    $,
    Promise,
    promiseUtils,
    ProgressBarGauge,
    ProgressBar
  ) {

  'use strict';

  var PROGRESS_BAR_TYPE = baja.$('bajauxProgressBar:ProgressBarType'),
    DEFAULT_FONT = baja.$('gx:Font'),
    TEST_COLOR = 'red',
    TEST_WIDGET_TEXT = 'My Widget Text',
    TEST_FONT_SIZE = 30
  ;

  function calculateMidway(gauge, fontSize) {
    var containerWidth = gauge.jq().width();
    var midway = (Number(fontSize) + containerWidth) / 2;
    return -midway + 'px';
  }


  describe('nmodule/bajauxProgressBar/rc/ProgressBarGauge', function () {
    var gauge, dom;

    beforeEach(function () {
      gauge = new ProgressBarGauge();
      dom = $('<div></div>');
    });

    afterEach(function () {
      if (gauge) { return gauge.destroy(); }
    });

    describe('constructor ', function () {
      it('creates properties populated with default values', function () {
        expect(gauge.properties().getValue('valueText')).toEqual('%out.value%');
        expect(gauge.properties().getValue('min')).toEqual(-1);
        expect(gauge.properties().getValue('max')).toEqual(-1);
        expect(gauge.properties().getValue('gaugeType')).toEqual(PROGRESS_BAR_TYPE.getTag());
        expect(gauge.properties().getValue('fill')).toEqual('white');
        expect(gauge.properties().getValue('background')).toEqual('white');
        expect(gauge.properties().getValue('barColor')).toEqual('#00C0FF');
        expect(gauge.properties().getValue('trailColor')).toEqual('#f4f4f4');
        expect(gauge.properties().getValue('textColor')).toEqual('#3a3a3a');
        expect(gauge.properties().getValue('font')).toEqual('null');
        expect(gauge.properties().getValue('showText')).toBe(true);
        expect(gauge.properties().getValue('lineWidth')).toEqual(2.1);
      });
    });

    describe('#doInitialize()', function () {
      it('has a progress-bar-gauge-outer class', function () {
        return gauge.initialize(dom)
        .then(function () {
          expect(dom.hasClass('progress-bar-gauge-outer')).toBeTruthy();
        });
      });

      it('creates a Line ProgressBar by default', function () {
        return gauge.initialize(dom)
        .then(function () {
          expect(gauge.$bar).toEqual(jasmine.any(ProgressBar.Line));
        });
      });

      it('creates a Circle ProgressBar Line from the \'gaugeType\' property', function () {
        gauge.properties().setValue('gaugeType', PROGRESS_BAR_TYPE.make('Circle').getTag());

        expect(gauge.properties().getValue('gaugeType')).toEqual('Circle');

        return gauge.initialize(dom)
          .then(function () {
            expect(gauge.$bar).toEqual(jasmine.any(ProgressBar.Circle));
          });
      });

      it('creates a SemiCircle ProgressBar Line from the \'gaugeType\' property', function () {
        gauge.properties().setValue('gaugeType', PROGRESS_BAR_TYPE.make('SemiCircle').getTag());

        expect(gauge.properties().getValue('gaugeType')).toEqual('SemiCircle');

        return gauge.initialize(dom)
          .then(function () {
            expect(gauge.$bar).toEqual(jasmine.any(ProgressBar.SemiCircle));
          });
      });
    });

    describe('#doRender() ', function () {
      it('sets the text on the widget', function () {
        return gauge.initialize(dom)
          .then(function () {
            gauge.properties().setValue('showText', true);
            gauge.doRender({ valueText: TEST_WIDGET_TEXT });
            expect(gauge.$bar.text.innerHTML).toEqual(TEST_WIDGET_TEXT);
          });
      });

      it('hide the text if the showText property is false', function () {
        return gauge.initialize(dom)
          .then(function () {
            gauge.properties().setValue('showText', false);
            gauge.doRender({ valueText: TEST_WIDGET_TEXT });
            expect(gauge.$bar.text.innerHTML).toEqual('');
          });
      });

      it('sets the background color of the widget from the background property', function () {
        return gauge.initialize(dom)
          .then(function () {
            gauge.properties().setValue('background', TEST_COLOR);
            gauge.doRender({});
            expect(gauge.jq('.progress-bar-gauge').css('background-color')).toEqual(TEST_COLOR);
          });
      });

      it('leaves the background color alone if the background property is not present', function () {
        return gauge.initialize(dom)
          .then(function () {
            var currentBackground = gauge.jq('.progress-bar-gauge').css('background-color');
            gauge.properties().setValue('background', null);
            gauge.doRender({});
            expect(gauge.jq('.progress-bar-gauge').css('background-color')).toEqual(currentBackground);
          });
      });

    });

    describe('#makeAnimationObject() ', function () {
      var animationObject;

      beforeEach(function () {
        // prevents the 'Warning: a promise was rejected with a non-error: [object Error]'
        // where doChanged is called after the widget has been destroyed
        spyOn(gauge, 'doChanged').andReturn(Promise.resolve);

        return gauge.initialize(dom);
      });


      afterEach(function () {
        animationObject = null;
      });

      it('populates color from the barColor property', function () {
        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('barColor', TEST_COLOR);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.color).toBe(TEST_COLOR);
        });
      });

      it('populates strokeWidth and trailWidth from the lineWidth property', function () {
        var lineWidth = 10;

        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('lineWidth', lineWidth);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.strokeWidth).toBe(lineWidth);
          expect(animationObject.trailWidth).toBe(lineWidth / 2);
        });
      });

      it('populates fill from the fill property', function () {
        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('fill', TEST_COLOR);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.fill).toBe(TEST_COLOR);
        });
      });

      it('populates trailColor from the trailColor property', function () {
        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('trailColor', TEST_COLOR);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.trailColor).toBe(TEST_COLOR);
        });
      });

      it('populates style properties for a Line Widget', function () {
        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('textColor', TEST_COLOR);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.text.style.color).toBe(TEST_COLOR);
          expect(animationObject.text.style.position).toBe('absolute');
          expect(animationObject.text.style.left).toBe('50%');
          expect(animationObject.text.style.top).toBe('50%');
          expect(animationObject.text.style.padding).toBe(0);
          expect(animationObject.text.style.margin).toBe(0);
          expect(animationObject.text.style.transform).toBeTruthy();
        });
    });

      it('populates style properties for a SemiCircle Widget', function () {
        gauge.properties().setValue('gaugeType', PROGRESS_BAR_TYPE.make('SemiCircle').getTag());
        return gauge.initialize(dom)
        .then(function () {
          gauge.properties().setValue('textColor', TEST_COLOR);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.text.style.color).toBe(TEST_COLOR);
          expect(animationObject.text.style.position).toBe('absolute');
          expect(animationObject.text.style.left).toBe('50%');
          expect(animationObject.text.style.top).toBe('50%');
          expect(animationObject.text.style.padding).toBe(0);
          expect(animationObject.text.style.margin).toBe(0);
          expect(animationObject.text.style.transform).toBeTruthy();
        });
      });

      it('populates style properties for a Circle Widget', function () {

        gauge.properties().setValue('gaugeType', PROGRESS_BAR_TYPE.make('Circle').getTag());

        return gauge.initialize(dom)
        .then(function () {
          var newFontString = DEFAULT_FONT.make(TEST_FONT_SIZE + 'pt sansserif' + ' bold underline italic').encodeToString();

          gauge.properties().setValue('font', newFontString);
          gauge.properties().setValue('textColor', TEST_COLOR);

          animationObject = gauge.makeAnimationObject();

          expect(animationObject.text.style.color).toBe(TEST_COLOR);
          expect(animationObject.text.style.position).toBe('relative');
          expect(animationObject.text.style.width).toBe('100%');
          expect(animationObject.text.style['text-align']).toBe('center');
          expect(animationObject.text.style.top).toBe(calculateMidway(gauge, TEST_FONT_SIZE));
          expect(animationObject.text.style.transform).toBeUndefined();
        });
      });

      it('uses the default font size if no font size supplied', function () {

        gauge.properties().setValue('gaugeType', PROGRESS_BAR_TYPE.make('Circle').getTag());

        return gauge.initialize(dom)
        .then(function () {
          var newFontString = DEFAULT_FONT.make('Arial').encodeToString();

          gauge.properties().setValue('font', newFontString);
          animationObject = gauge.makeAnimationObject();

          expect(animationObject.text.style.top).toBe(calculateMidway(gauge, 12));
        });
      });

    });

    describe('#doDestroy()', function () {
      beforeEach(function () {
        return gauge.initialize(dom);
      });

      it('removes Progress Bar Gauge from dom', function () {
        expect(dom).toHaveClass('progress-bar-gauge-outer');
        return gauge.destroy()
        .then(function () {
          expect(dom).not.toHaveClass('progress-bar-gauge-outer');
        });
      });

      it('destroys the Progress Bar', function () {
        return gauge.destroy()
        .then(function () {
          expect(gauge.$bar).toBeNull();
        });
      });
    });
  });
});
