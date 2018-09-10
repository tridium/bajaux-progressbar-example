define([
    'baja!',
    'baja!baja:Component,baja:StatusNumeric,baja:StatusBoolean,baja:Boolean,baja:Weekday,control:NumericPoint,control:BooleanPoint',
    'Promise',
    'jquery',
    'underscore',
    'nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget',
    'nmodule/bajauxProgressBar/rc/livepoint/model'
  ], function (
    baja,
    types,
    Promise,
    $,
    _,
    LivePointWidget,
    pointDataModel
  ) {

  'use strict';


  describe('nmodule/bajauxProgressBar/rc/livepoint/model', function () {
    var livePointWidget, dom, pointData, resolvedValue,
      resolveData = pointDataModel.resolveData;

    var EXPECTED_KEYS = [
      'displayTags',
      'min',
      'max',
      'ticks',
      'value',
      'title',
      'valueText',
      'color',
      'units',
      'precision'
    ];

     var MIN_VALUE = 23,
      MAX_VALUE = 77,
      TICKS_VALUE = 9,
      TEST_VALUE = 65.33,
      TITLE_VALUE = 'Name: %name%',
      VALUE_TEXT_VALUE = 'Title: %out.status%',
      OVERRIDE_ORD = 'station:|slot:/somePoint';

    var DEFAULT_MIN_VALUE = 0,
      DEFAULT_MAX_VALUE = 100,
      DEFAULT_TICKS = 5,
      DEFAULT_PRECISION = 2,
      DEFAULT_TITLE = '',
      DEFAULT_VALUE_TEXT = '',
      DEFAULT_UNITS = baja.Unit.DEFAULT;

    var BOOLEAN_MIN_VALUE = 0,
      BOOLEAN_MAX_VALUE = 1,
      BOOLEAN_TICKS = 2;

    var ENUM_MIN_VALUE = 0;

    var DISABLED_COLOR = '#d6cbae',
      FAULT_COLOR = '#fb7734',
      DOWN_COLOR = '#fac600',
      ALARM_COLOR = '#ce1624',
      STALE_COLOR = '#a59d86',
      OVERRIDDEN_COLOR = '#bfaddc';

    var rootComponent, vanillaComponent, componentWithOutSlot, componentWithBoolean, booleanSlot, enumSlot,
      slotOnControlPoint, numericPoint;


    beforeEach(function () {

      rootComponent = baja.$('baja:Component', {
        vanilla: baja.$('baja:Component', {}),
        outSlot: baja.$('baja:Component', {
          out: baja.$('baja:StatusNumeric', {
            value: TEST_VALUE,
            status: baja.Status.ok
          })
        }),
        outSlotWithBoolean: baja.$('baja:Component', {
          out: baja.$('baja:StatusBoolean', {
            value: Boolean.make(true),
            status: baja.Status.ok
          })
        }),
        controlPoint: baja.$('control:BooleanPoint', {
          out: baja.$('baja:StatusBoolean', {
            value: Boolean.make(false),
            status: baja.Status.ok
          })
        }),
        bool: baja.$('baja:Boolean').make(Boolean.make(true)),
        enum: baja.$('baja:Weekday'),
        numeric: baja.$('control:NumericPoint', {
          out: 3.14
        })
      });

      vanillaComponent = rootComponent.get('vanilla');
      componentWithOutSlot = rootComponent.get('outSlot');
      componentWithBoolean = rootComponent.get('outSlotWithBoolean');
      slotOnControlPoint = rootComponent.get('controlPoint').get('out');

      booleanSlot = rootComponent.get('bool');

      enumSlot = rootComponent.get('enum');
      numericPoint = rootComponent.get('numeric');


      // default resolvedValue for the tests, will be overridden by some tests
      resolvedValue = componentWithOutSlot;

      livePointWidget = new LivePointWidget();
      dom = $('<div></div>');

      spyOn(livePointWidget, 'render').andCallFake(function () {
        return Promise.resolve();
      });

      spyOn(livePointWidget, 'resolve').andCallFake(function () {
        return Promise.resolve(resolvedValue);
      });

      return livePointWidget.initialize(dom);
    });

    afterEach(function () {
      pointData = null;
      if (livePointWidget) { return livePointWidget.destroy(); }
    });


    describe('#resolveData()', function () {

      describe('returned object from $overrideVal', function () {
        beforeEach(function () {
          livePointWidget.properties().setValue('overrideOrd', OVERRIDE_ORD);

          return livePointWidget.$resolveOverrideOrd()
            .then(function (value) {
              return resolveData(livePointWidget);
            })
            .then(function (data) {
              pointData = data;
            });
        });

        it('has expected keys', function () {
          expect(Object.keys(pointData)).toEqual(EXPECTED_KEYS);
        });

        it('has a value from the component', function () {
          expect(pointData.value).toEqual(TEST_VALUE);
        });

      });

      describe('returned object using widget.value()', function () {
        beforeEach(function () {
          resolvedValue = vanillaComponent;

          livePointWidget.$value = resolvedValue;

          return resolveData(livePointWidget)
            .then(function (data) {
              pointData = data;
            });
        });

        it('has expected keys', function () {
          expect(Object.keys(pointData)).toEqual(EXPECTED_KEYS);
        });

        it('has a value from the component', function () {
          expect(pointData.value).toBeNull();
        });
      });

      describe('populate values from widget properties', function () {
        beforeEach(function () {
          livePointWidget.$value = resolvedValue;

          livePointWidget.properties().add('min', MIN_VALUE);
          livePointWidget.properties().add('max', MAX_VALUE);
          livePointWidget.properties().add('ticks', TICKS_VALUE);
          livePointWidget.properties().add('title', TITLE_VALUE);
          livePointWidget.properties().add('valueText', VALUE_TEXT_VALUE);

          return resolveData(livePointWidget)
          .then(function (data) {
            pointData = data;
          });
        });

        it('has expected keys', function () {
          expect(Object.keys(pointData)).toEqual(EXPECTED_KEYS);
        });

        it('populates min value from widget properties', function () {
          expect(pointData.min).toBe(MIN_VALUE);
        });

        it('populates max value from widget properties', function () {
          expect(pointData.max).toBe(MAX_VALUE);
        });

        it('populates ticks value from widget properties', function () {
          expect(pointData.ticks).toBe(TICKS_VALUE);
        });

        it('populates and formats title value from widget properties', function () {
          return baja.Format.format({
            pattern: TITLE_VALUE,
            object: livePointWidget.value()
          }).then(function (expectedText) {
            expect(pointData.title).toBe(expectedText);
          });
        });

        it('populates valueText from widget properties', function () {
          return baja.Format.format({
            pattern: VALUE_TEXT_VALUE,
            object: livePointWidget.value()
          }).then(function (expectedText) {
            expect(pointData.valueText).toBe(expectedText);
          });
        });

      });

      describe('populate values for a boolean', function () {
        var expectedDisplayTags = [
            false.toString(),
            true.toString()
          ],
          expectedValue;

        beforeEach(function () {
          resolvedValue = booleanSlot;
          livePointWidget.$value = resolvedValue;
          expectedValue = booleanSlot.getOrdinal();

          return resolveData(livePointWidget)
            .then(function (data) {
              pointData = data;
            });
        });

        it('has expected keys', function () {
          expect(Object.keys(pointData)).toEqual(EXPECTED_KEYS);
        });

        it('populates displayTags', function () {
          expect(pointData.displayTags).toEqual(expectedDisplayTags);
        });

        it('populates min', function () {
          expect(pointData.min).toBe(BOOLEAN_MIN_VALUE);
        });

        it('populates max', function () {
          expect(pointData.max).toBe(BOOLEAN_MAX_VALUE);
        });

        it('populates ticks', function () {
          expect(pointData.ticks).toBe(BOOLEAN_TICKS);
        });

        it('populates value', function () {
          expect(pointData.value).toBe(expectedValue);
        });
      });

      describe('boolean facets', function () {

        it('populates displayTags from facets', function () {

          var displayFacets = [ 'SomeFalseText', 'SomeTrueText' ];

          livePointWidget.properties().setValue('overrideOrd', OVERRIDE_ORD);
          resolvedValue = componentWithBoolean;
          resolvedValue.setFacets({
            slot: 'out',
            facets: baja.Facets.make([ 'falseText', 'trueText' ], displayFacets)
          });
          livePointWidget.$value = resolvedValue;

          return livePointWidget.$resolveOverrideOrd()
            .then(function () {
              return resolveData(livePointWidget);
            })
            .then(function (data) {
              pointData = data;
              expect(pointData.displayTags).toEqual(displayFacets);
            });
        });
      });

      describe('StatusValue on a ControlPoint', function () {

        it('populates displayTags from parent\'s facets if parent is a controlPoint', function () {
          var displayFacets = [ 'SomeOtherFalseText', 'SomeOtherTrueText' ];

          livePointWidget.properties().setValue('overrideOrd', OVERRIDE_ORD);
          resolvedValue = slotOnControlPoint;
          resolvedValue.getParent().set({
            slot: 'facets',
            value: baja.Facets.make([ 'falseText', 'trueText' ], displayFacets)
          });

          livePointWidget.$value = resolvedValue;

          return livePointWidget.$resolveOverrideOrd()
            .then(function () {
              return resolveData(livePointWidget);
            })
            .then(function (data) {
              pointData = data;
              expect(pointData.displayTags).toEqual(displayFacets);
            });
        });
      });

      describe('status', function () {

        function setUpAndResolveData(status) {
          if (status) {
            resolvedValue.get('out').set({
              slot: 'status',
              value: status
            });
          }

          livePointWidget.$value = resolvedValue;

          return resolveData(livePointWidget)//;
          .then(function (data) {
            pointData = data;
          });
        }

        it('does not set a color for baja.Status.ok', function () {
          return setUpAndResolveData()
            .then(function () {
              expect(pointData.color).toBeUndefined();
              expect(pointData.value).toBeTruthy();
            });
        });

        it('does not set a color for baja.Status.isNull', function () {
          return setUpAndResolveData(baja.Status.isNull)
            .then(function () {
              expect(pointData.color).toBeUndefined();
            });
        });

        it('sets the value to null for baja.Status.nullStatus', function () {
          return setUpAndResolveData(baja.Status.nullStatus)
            .then(function () {
              expect(pointData.value).toBeNull();
            });
        });

        it('sets color for baja.Status.disabled ', function () {
          return setUpAndResolveData(baja.Status.disabled)
            .then(function () {
              expect(pointData.color).toBe(DISABLED_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });

        it('sets color for baja.Status.fault ', function () {
          return setUpAndResolveData(baja.Status.fault)
            .then(function () {
              expect(pointData.color).toBe(FAULT_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });

        it('sets color for baja.Status.down ', function () {
          return setUpAndResolveData(baja.Status.down)
            .then(function () {
              expect(pointData.color).toBe(DOWN_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });

        it('sets color for baja.Status.alarm ', function () {
          return setUpAndResolveData(baja.Status.alarm)
            .then(function () {
              expect(pointData.color).toBe(ALARM_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });

        it('sets color for baja.Status.stale ', function () {
          return setUpAndResolveData(baja.Status.stale)
            .then(function () {
              expect(pointData.color).toBe(STALE_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });

        it('sets color for baja.Status.overridden ', function () {
          return setUpAndResolveData(baja.Status.overridden)
            .then(function () {
              expect(pointData.color).toBe(OVERRIDDEN_COLOR);
              expect(pointData.value).toBeTruthy();
            });
        });
      });

      describe('populate values for an enum', function () {
        var expectedTicks, expectedMax, expectedTags, expectedValue;

        beforeEach(function () {
          resolvedValue = enumSlot;
          livePointWidget.$value = resolvedValue;

          expectedTicks = enumSlot.getRange().getOrdinals().length;
          expectedMax = expectedTicks - 1;
          expectedValue = enumSlot.getOrdinal();
          expectedTags = enumSlot.getRange().getOrdinals().map(function (ordinal) {
            return enumSlot.getRange().getDisplayTag(ordinal);
          });

          return resolveData(livePointWidget)
          .then(function (data) {
            pointData = data;
          });
        });

        it('has expected keys', function () {
          expect(Object.keys(pointData)).toEqual(EXPECTED_KEYS);
        });

        it('populates displayTags', function () {
          expect(pointData.displayTags).toEqual(expectedTags);
        });

        it('populates min', function () {
          expect(pointData.min).toBe(ENUM_MIN_VALUE);
        });

        it('populates max', function () {
          expect(pointData.max).toBe(expectedMax);
        });

        it('populates ticks', function () {
          expect(pointData.ticks).toBe(expectedTicks);
        });

        it('populates value', function () {
          expect(pointData.value).toBe(expectedValue);
        });
      });

      describe('default values', function () {
        beforeEach(function () {
          return resolveData(livePointWidget)
          .then(function (data) {
            pointData = data;
          });
        });

        it('displayTags', function () {
          expect(pointData.displayTags).toBeUndefined();
        });

        it('min', function () {
          expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
        });
        it('max', function () {
          expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
        });

        it('ticks', function () {
          expect(pointData.ticks).toBe(DEFAULT_TICKS);
        });

        it('value', function () {
          expect(pointData.value).toBeNull();
        });

        it('title', function () {
          expect(pointData.title).toBe(DEFAULT_TITLE);
        });

        it('valueText', function () {
          expect(pointData.valueText).toBe(DEFAULT_VALUE_TEXT);
        });

        it('color', function () {
          expect(pointData.color).toBeUndefined();
        });

        it('units', function () {
          expect(pointData.units).toBe(DEFAULT_UNITS);
        });

        it('precision', function () {
          expect(pointData.precision).toBe(DEFAULT_PRECISION);
        });

      });

      describe('min/max calculations', function () {

        var testValue, testMin, testMax;

        function setUpAndResolveData(/*value, min, max*/) {
          resolvedValue = numericPoint;
          livePointWidget.$value = resolvedValue;

          if (testValue || testValue === 0) {
            resolvedValue.set({
              slot: 'out',
              value: testValue
            });
          }

          if (testMin) {
            livePointWidget.properties().add('min', testMin);
          }
          if (testMax) {
            livePointWidget.properties().add('max', testMax);
          }

          livePointWidget.$value = resolvedValue;

          return resolveData(livePointWidget)//;
          .then(function (data) {
            pointData = data;
          });
        }

        beforeEach(function () {
          testValue = null;
          testMin = null;
          testMax = null;
        });

        it('uses minimum if value is less that the min property', function () {
          testValue = 55;
          testMin = 66;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testMin);
            expect(pointData.min).toBe(testMin);
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('uses zero as the default if min property not set', function () {
          testValue = 55;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testValue);
            expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('sets a value for min if min property not set and value is less than 0', function () {
          testValue = -55;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testValue);
            expect(pointData.min).toBe(-60);
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('sets min to zero if min property not set and value is 0', function () {
          testValue = 0;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testValue);
            expect(pointData.min).toBe(testValue);
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('populates $lastMin on the widget', function () {
          testValue = 22;

          expect(livePointWidget.$lastMin).toBeUndefined();
          return setUpAndResolveData().then(function () {
            expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
            expect(livePointWidget.$lastMin).toBe(DEFAULT_MIN_VALUE);
          });
        });

        it('uses $lastMin if populated on the widget', function () {
           var lastMinValue = 11;

          testValue = 32;
          livePointWidget.$lastMin = lastMinValue;

          expect(livePointWidget.$lastMin).toBe(lastMinValue);
          return setUpAndResolveData().then(function () {
            expect(pointData.min).toBe(lastMinValue);
            expect(livePointWidget.$lastMin).toBe(lastMinValue);
          });
        });


        // --> Max tests ...

        it('uses maximum if value is more that the max property', function () {
          testValue = 55;
          testMax = 44;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testMax);
            expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
            expect(pointData.max).toBe(testMax);
          });
        });

        it('uses 100 as the default max if max property not set', function () {
          testValue = 55;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testValue);
            expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('set a value for max if max property not set and value is greater than 100', function () {
          testValue = 255;

          return setUpAndResolveData().then(function () {
            expect(pointData.value).toBe(testValue);
            expect(pointData.min).toBe(DEFAULT_MIN_VALUE);
            expect(pointData.max).toBe(300);
          });
        });

        it('populates $lastMax on the widget', function () {
          testValue = 22;

          expect(livePointWidget.$lastMax).toBeUndefined();
          return setUpAndResolveData().then(function () {
            expect(pointData.max).toBe(DEFAULT_MAX_VALUE);
            expect(livePointWidget.$lastMax).toBe(DEFAULT_MAX_VALUE);
          });
        });

        it('uses $lastMax if populated on the widget', function () {
          var lastMaxValue = 47;

          testValue = 22;
          livePointWidget.$lastMax = lastMaxValue;

          expect(livePointWidget.$lastMax).toBe(lastMaxValue);
          return setUpAndResolveData().then(function () {
            expect(pointData.max).toBe(lastMaxValue);
            expect(livePointWidget.$lastMax).toBe(lastMaxValue);
          });
        });

      });

    });
  });
});
