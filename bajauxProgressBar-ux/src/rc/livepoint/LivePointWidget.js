/**
 * @copyright 2018 Tridium, Inc. All Rights Reserved.
 * @author Gareth Johnson
 */

/**
 * @module nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget
 */
define([
  'bajaux/Widget',
  'bajaux/events',
  'bajaux/mixin/subscriberMixIn',
  'bajaux/dragdrop/dragDropUtils',
  'jquery',
  'baja!',
  'Promise',
  'nmodule/js/rc/switchboard/switchboard',
  'baja!baja:StatusValue,baja:IEnum,control:ControlPoint',
  'nmodule/bajauxProgressBar/rc/livepoint/model'], function(
  Widget,
  events,
  subscriberMixIn,
  dragDropUtils,
  $,
  baja,
  Promise,
  switchboard,
  types,
  model){
  "use strict";

  var overrideOrdName = "overrideOrd";

  /**
   * The base class for all live point widgets.
   *
   * @class
   * @alias module:nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget
   */
  var LivePointWidget = function() {
    var that = this;
    Widget.apply(that, arguments);

    that.properties()
      .add({
        name: overrideOrdName,
        value: "",
        hidden: true,
        readonly: true,
        dashboard: true
      });

    switchboard(that, {
      'render': { allow: 'oneAtATime', onRepeat: 'preempt' }
    });

    subscriberMixIn(that);
  };

  LivePointWidget.prototype = Object.create(Widget.prototype);
  LivePointWidget.prototype.constructor = LivePointWidget;

////////////////////////////////////////////////////////////////
// Render
////////////////////////////////////////////////////////////////

  LivePointWidget.prototype.doRender = function (data) {};

  /**
   * Render the gauge. This will resolve the data asynchronously
   * and then render the data in the gauge. Note that any request to render while rendering is in progress
   * will wait for the current rendering to complete before starting a new rendering request
   *
   * @private
   * @inner
   *
   * @returns {Promise}
   */
  LivePointWidget.prototype.render = function(){
    var that = this;
    return model.resolveData(that)
      .then(function(data) {

        var jq = that.jq();
        data.width = jq.width();
        data.height = jq.height();

        return that.doRender(data) || Promise.resolve();
      });
  };

////////////////////////////////////////////////////////////////
// Override ORD
////////////////////////////////////////////////////////////////

  /**
   * Resolves any override ORD and then renders the widget.
   *
   * @inner
   * @private
   *
   * @param widget The widget instance.
   * @return {Promise|*}
   */
  function resolveOverrideOrd(widget) {
    var ord = widget.properties().getValue(overrideOrdName);

    if (ord) {
      return widget.resolve(ord)
        .then(function(value) {
          // reset gauge statistics on ord modification
          widget.$lastMin = undefined;
          widget.$lastMax = undefined;
          widget.$overrideVal = value;
          return widget.render();
        });
    }
    else {
      delete widget.$overrideVal;
    }
  }

  /**
   * Called when a new data value is dragged and dropped onto the widget.
   *
   * @inner
   * @private
   *
   * @param  widget The widget instance to update with the new value.
   * @param  dataTransfer The data
   * @return {Promise} A promise that's resolved once the drag and drop operation
   * has completed.
   */
  function updateFromDrop(widget, dataTransfer) {
    return dragDropUtils.fromClipboard(dataTransfer)
      .then(function (envelope) {
        switch (envelope.getMimeType()) {
          case 'niagara/navnodes':
            envelope.toJson()
              .then(function (json) {
                var obj = json && json[0],
                    oldOverrideOrd;

                if (obj && obj.ord) {
                  // Record any ORD value so we can unsubscribe it.
                  oldOverrideOrd = widget.properties().getValue(overrideOrdName);

                  widget.properties().setValue(overrideOrdName, obj.ord);

                  if (oldOverrideOrd) {
                    return baja.Ord.make(oldOverrideOrd).resolve()
                      .then(function (target) {
                        var comp = target.getComponent();
                        if (comp) {
                          return widget.getSubscriber().unsubscribe(comp);
                        }
                      });
                  }
                }
              })
              .then(function () {
                return resolveOverrideOrd(widget);
              });
        }
      });
  }

////////////////////////////////////////////////////////////////
// Widget
////////////////////////////////////////////////////////////////

  LivePointWidget.prototype.doInitialize = function(element) {
    var that = this;

    that.jq()
      .on("dragover", function(e) {
        e.preventDefault();
      })
      .on("drop", function(e) {
        updateFromDrop(that, e.originalEvent.dataTransfer).catch(baja.error);
        e.preventDefault();
        e.stopPropagation();
      });

    that.getSubscriber().attach("changed", function() {
      that.render().catch(baja.error);
    });

    return resolveOverrideOrd(that);
  };

  LivePointWidget.prototype.doLayout =
    LivePointWidget.prototype.doChanged = function() {
      return this.render();
    };

  LivePointWidget.prototype.doLoad = function() {
    return this.render();
  };

  return LivePointWidget;
});
