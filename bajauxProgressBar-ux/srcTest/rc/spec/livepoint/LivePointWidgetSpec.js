define([
    'baja!',
    'bajaux/Widget',
    'Promise',
    'jquery',
    'nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget',
    'nmodule/webChart/rc/gauge/model',
    'bajaux/dragdrop/dragDropUtils',
    'bajaScript/baja/ord/OrdTarget'
  ], function (
    baja,
    Widget,
    Promise,
    $,
    LivePointWidget,
    WebChartGaugeModel,
    dragDropUtils,
    OrdTarget
  ) {

  'use strict';


  describe('nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget', function () {
    var livePointWidget, dom,
      OVERRIDE_ORD_VALUE = 'override',
      NEW_OVERRIDE_ORD_VALUE = 'new override',
      spyRender, spyResolve, event, subscriber,
      dataTransfer, envelope/*, ord*/;


    beforeEach(function () {
      livePointWidget = new LivePointWidget();
      dom = $('<div></div>');

      spyRender = spyOn(livePointWidget, 'render').andCallThrough();
      spyResolve = spyOn(livePointWidget, 'resolve').andCallThrough();

      spyOn(livePointWidget.getSubscriber(), 'attach').andCallThrough();

      return livePointWidget.initialize(dom).then(function () {
        subscriber = livePointWidget.getSubscriber();
      });
    });

    afterEach(function () {
      if (livePointWidget) { return livePointWidget.destroy(); }
    });

    describe('#doInitialize()', function () {
      it('adds a \'changed\' callback to the subscriber', function () {
        expect(livePointWidget.getSubscriber().attach).toHaveBeenCalled();
        expect(livePointWidget.getSubscriber().attach).toHaveBeenCalledWith('changed', jasmine.any(Function));
      });

      it('dragover calls event \'preventDefault\'', function () {
        function makeDragOverEvent() {
          var e = $.Event('dragover');
          e.preventDefault = jasmine.createSpy('preventDefault');
          return e;
        }

        event = makeDragOverEvent();

        livePointWidget.jq().trigger(event);

        expect(event.preventDefault).toHaveBeenCalled();
      });

      describe('\'changed\' event', function () {
        beforeEach(function () {
          spyRender.andReturn(Promise.resolve());
        });

        it('calls render()', function () {
          var callsSoFar = livePointWidget.render.calls.length;

          livePointWidget.getSubscriber().fireHandlers('changed', baja.error, livePointWidget);

          expect(livePointWidget.render.calls.length).toBe(callsSoFar + 1);
        });
      });

      describe('drop event', function () {
        function makeDropEvent() {
          var e = $.Event('drop');
          e.originalEvent = { dataTransfer: 'test' };
          e.preventDefault = jasmine.createSpy('preventDefault');
          e.stopPropagation = jasmine.createSpy('stopPropagation');
          return e;
        }

        beforeEach(function () {
          event = makeDropEvent();
          spyOn(livePointWidget, '$updateFromDrop');
          livePointWidget.jq().trigger(event);
        });

        it('calls $updateFromDrop() on an drop operation', function () {
          expect(livePointWidget.$updateFromDrop).toHaveBeenCalledWith('test');
        });

        it('calls event `preventDefault()`', function () {
          expect(event.preventDefault).toHaveBeenCalled();
        });

        it('calls event `stopPropagation()`', function () {
          expect(event.stopPropagation).toHaveBeenCalled();
        });
      });
    });


    describe('#$resolveOverrideOrd()', function () {

      describe('ord supplied', function () {
        beforeEach(function () {
          spyResolve.andCallFake(function () {
            return Promise.resolve(OVERRIDE_ORD_VALUE);
          });

          livePointWidget.properties().setValue('overrideOrd', OVERRIDE_ORD_VALUE);
        });

        it('populates widget properities', function () {
          return livePointWidget.$resolveOverrideOrd()
            .then(function () {
              expect(livePointWidget.$lastMin).toBeUndefined();
              expect(livePointWidget.$lastMax).toBeUndefined();
              expect(livePointWidget.$overrideVal).toBe(OVERRIDE_ORD_VALUE);
            });
        });

        it('calls render()', function () {
          var callsSoFar = livePointWidget.render.calls.length;

          return livePointWidget.$resolveOverrideOrd()
          .then(function () {
            expect(livePointWidget.render.calls.length).toBe(callsSoFar + 1);
          });
        });
      });

      describe('no ord supplied', function () {
        beforeEach(function () {
          livePointWidget.properties().setValue('overrideOrd', '');
        });

        it('removes $overrideVal property', function () {
          return livePointWidget.$resolveOverrideOrd()
            .then(function () {
              expect(livePointWidget.$overrideVal).toBeUndefined();
            });
        });

        it('does not call render()', function () {
          var callsSoFar = livePointWidget.render.calls.length;

          return livePointWidget.$resolveOverrideOrd()
            .then(function () {
              expect(livePointWidget.render.calls.length).toBe(callsSoFar);
            });
        });
      });
    });


    describe('#$updateFromDrop()', function () {
      var jsonData, ordTarget;

      beforeEach(function () {
        dataTransfer = {};

        envelope = jasmine.createSpyObj('envelope', [ 'getMimeType', 'toJson' ]);
        envelope.getMimeType.andReturn('niagara/navnodes');
        envelope.toJson.andCallFake(function () {
          return Promise.resolve(jsonData);
        });

        spyOn(baja.Ord, 'make').andReturn({
          resolve: function () {
            return Promise.resolve(ordTarget);
          }
        });

        spyOn(dragDropUtils, 'fromClipboard').andReturn(Promise.resolve(envelope));

        spyOn(livePointWidget, '$resolveOverrideOrd').andCallThrough();

        spyResolve.andCallFake(function (ord) {
          return Promise.resolve(ord);
        });

        spyOn(subscriber, 'unsubscribe').andCallThrough();

        livePointWidget.properties().setValue('overrideOrd', OVERRIDE_ORD_VALUE);

        return livePointWidget.$resolveOverrideOrd();
      });


      describe('no DataTransfer data provided', function () {

        beforeEach(function () {
          jsonData = [ {} ]; // ie no data
        });

        it('calls $resolveOverrideOrd ', function () {
          var callsSoFar = livePointWidget.$resolveOverrideOrd.calls.length;

          return livePointWidget.$updateFromDrop(dataTransfer)
            .then(function () {
              expect(livePointWidget.$resolveOverrideOrd.calls.length).toBe(callsSoFar + 1);
            });
        });

        it('$overrideVal property is unchanged', function () {
          expect(livePointWidget.$overrideVal).toBe(OVERRIDE_ORD_VALUE);

          return livePointWidget.$updateFromDrop(dataTransfer)
          .then(function () {
            expect(livePointWidget.$overrideVal).toBe(OVERRIDE_ORD_VALUE);
          });
        });
      });

      describe('DataTransfer data provided', function () {
        function getOrdTarget() {
          var newTarget = new OrdTarget();
          newTarget.object = baja.$('baja:Component');
          return newTarget;
        }

        beforeEach(function () {
          jsonData = [ { ord: NEW_OVERRIDE_ORD_VALUE } ];
          ordTarget = getOrdTarget();

        });

        it('calls $resolveOverrideOrd ', function () {
          var callsSoFar = livePointWidget.$resolveOverrideOrd.calls.length;

          return livePointWidget.$updateFromDrop(dataTransfer)
            .then(function () {
              expect(livePointWidget.$resolveOverrideOrd.calls.length).toBe(callsSoFar + 1);
            });
        });

        it('$overrideVal property is updated', function () {
          expect(livePointWidget.$overrideVal).toBe(OVERRIDE_ORD_VALUE);

          return livePointWidget.$updateFromDrop(dataTransfer)
            .then(function () {
              expect(livePointWidget.$overrideVal).toBe(NEW_OVERRIDE_ORD_VALUE);
            });
        });

        it('calls unsubscribe on the previous $overrideVal component', function () {
          return livePointWidget.$updateFromDrop(dataTransfer)
            .then(function () {
              expect(subscriber.unsubscribe).toHaveBeenCalled();
              expect(subscriber.unsubscribe).toHaveBeenCalledWith(ordTarget.getComponent());
            });
        });
      });

    });


    describe('#makeModel() ', function () {
      it('returns a webChart/rc/gauge/model object', function () {
        return livePointWidget.makeModel()
          .then(function (model) {
            expect(model).toEqual(jasmine.any(Object));
            expect(model.resolveData).toBeTruthy();
            expect(typeof model.resolveData).toBe('function');
          });
      });
    });

    describe('#doRender() ', function () {
      it('by default does nothing', function () {
        expect(function () {
          return livePointWidget.doRender();
        }).toBeResolved();
      });
    });

    describe('#render() ', function () {
      it('creates a data model', function () {
        spyOn(livePointWidget, 'makeModel').andCallThrough();

        return livePointWidget.render()
        .then(function () {
          expect(livePointWidget.makeModel).toHaveBeenCalled();
        });
      });

      it('populates height and width in the data object passed to doRender', function () {
        spyOn(livePointWidget, 'doRender').andCallFake(function (data) {
          var width = livePointWidget.jq().width(),
            height = livePointWidget.jq().height();

          expect(data.width).toEqual(width);
          expect(data.height).toEqual(height);
        });

        return livePointWidget.render()
        .then(function () {
          expect(livePointWidget.doRender).toHaveBeenCalled();
        });
      });

    });

    describe('#doLoad()', function () {
      it('calls render()', function () {
        return livePointWidget.doLoad()
        .then(function () {
          expect(livePointWidget.render).toHaveBeenCalled();
        });
      });
    });

    describe('#doLayout()', function () {
      it('calls render()', function () {
        return livePointWidget.doLayout()
          .then(function () {
            expect(livePointWidget.render).toHaveBeenCalled();
          });
      });
    });

    describe('#doChanged()', function () {
      it('calls render()', function () {
        return livePointWidget.doChanged()
          .then(function () {
            expect(livePointWidget.render).toHaveBeenCalled();
          });
      });
    });
  });
});
