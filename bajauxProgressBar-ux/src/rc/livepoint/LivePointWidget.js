/**
 * @copyright 2018 Tridium, Inc. All Rights Reserved.
 * @author Gareth Johnson
 */

/**
 * @private
 * @module nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget
 */
define([
    'bajaux/Widget',
    'bajaux/mixin/subscriberMixIn',
    'bajaux/dragdrop/dragDropUtils',
    'jquery',
    'baja!',
    'Promise',
    'log!nmodule.bajauxProgressBar.rc.livepoint.LivePointWidget',
    'nmodule/js/rc/switchboard/switchboard',
    'baja!baja:StatusValue,baja:IEnum,control:ControlPoint',
    'nmodule/bajauxProgressBar/rc/livepoint/model'
  ], function (
    Widget,
    subscriberMixIn,
    dragDropUtils,
    $,
    baja,
    Promise,
    log,
    switchboard,
    types,
    model
  ) {

  'use strict';

  var overrideOrdName = 'overrideOrd',
    logSevere = log.severe.bind(log);

  /**
   * The base class for all live point widgets.
   *
   * @private
   * @class
   * @extends module:bajaux/Widget
   * @alias module:nmodule/bajauxProgressBar/rc/livepoint/LivePointWidget
   */
  var LivePointWidget = function () {
    var that = this;
    Widget.apply(that, arguments);

    that.properties()
      .add({
        name: overrideOrdName,
        value: '',
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


  /**
   * Returns a point data model that will be used by #render() to render the widget.
   *
   * @returns {Promise.<Object>} promise to be resolved with a point data model.
   */
  LivePointWidget.prototype.resolveData = function () {
    return model.resolveData(this);
  };


  /**
   * Called when rendering the Widget. This method is designed to be overridden.
   *
   * @param {Object} data - a point data model used to render the widget.
   * @returns {*|Promise} This method may optionally return a promise once the
   * Widget has been rendered.
   */
  LivePointWidget.prototype.doRender = function (data) {
  };

  /**
   * Render the gauge. This will resolve the data asynchronously and then render the data
   * in the widget. Note that any request to render while rendering is in progress will
   * wait for the current rendering to complete before starting a new rendering request.
   *
   * This method should not typically be overridden. Override
   * {@link module:bajauxProgressBar/rc/livepoint/LivePointWidget#doRender|doRender()} instead.
   *
   * @returns {Promise}
   */
  LivePointWidget.prototype.render = function () {
    var that = this;

    return that.resolveData()
      .then(function (data) {

        var jq = that.jq();
        data.width = jq.width();
        data.height = jq.height();

        return that.doRender(data);
      });
  };

  /**
   * Resolves any override ORD and then renders the widget.
   *
   * @return {Promise}
   */
  LivePointWidget.prototype.$resolveOverrideOrd = function () {
    var that = this,
      ord = that.properties().getValue(overrideOrdName);

    if (ord) {
      return that.resolve(ord)
        .then(function (value) {
          // reset gauge statistics on ord modification
          that.$lastMin = undefined;
          that.$lastMax = undefined;
          that.$overrideVal = value;
          return that.render();
        });
    } else {
      delete that.$overrideVal;
      return Promise.resolve();
    }
  };

  /**
   * Called when a new data value is dragged and dropped onto the widget.
   *
   * @param  {DataTransfer} dataTransfer The data
   * @return {Promise} A promise that's resolved once the drag and drop operation
   * has completed.
   */
  LivePointWidget.prototype.$updateFromDrop = function (dataTransfer) {
    var that = this;
    return dragDropUtils.fromClipboard(dataTransfer)
      .then(function (envelope) {
        switch (envelope.getMimeType()) {
          case 'niagara/navnodes':
            return envelope.toJson()
              .then(function (json) {
                var obj = json && json[0],
                  oldOverrideOrd;

                if (obj && obj.ord) {
                  // Record any ORD value so we can unsubscribe it.
                  oldOverrideOrd = that.properties().getValue(overrideOrdName);

                  that.properties().setValue(overrideOrdName, obj.ord);

                  if (oldOverrideOrd) {
                    return baja.Ord.make(oldOverrideOrd).resolve()
                      .then(function (target) {
                        var comp = target.getComponent();
                        if (comp) {
                          return that.getSubscriber().unsubscribe(comp);
                        }
                      });
                  }
                }
              })
              .then(function () {
                return that.$resolveOverrideOrd();
              });
        }
      });
  };

  /**
   * Initializes the Live Point Widget.
   *
   * @param {JQuery} element The element in which this Widget should build its
   * HTML.
   * @returns {Promise} Promise to be resolved once the Widget has initialized.
   */
  LivePointWidget.prototype.doInitialize = function (element) {
    var that = this;

    that.jq()
      .on('dragover', function (e) {
        e.preventDefault();
      })
      .on('drop', function (e) {
        //updateFromDrop(that, e.originalEvent.dataTransfer).catch(logSevere);
        e.preventDefault();
        e.stopPropagation();
        return that.$updateFromDrop(e.originalEvent.dataTransfer);
      });

    that.getSubscriber().attach('changed', function () {
      that.render().catch(logSevere);
    });

    return that.$resolveOverrideOrd();
  };

  /**
   * Called when the layout of the Widget changes.
   *
   * @returns {*|Promise} This method may optionally return a promise once the
   * Widget has been laid out.
   */
  LivePointWidget.prototype.doLayout =
    /**
     * Called by {@link module:bajaux/Widget#changed|changed()} when a Property
     * is changed.
     */
    LivePointWidget.prototype.doChanged = function () {
      return this.render();
    };

  /**
   * Performs the actual work of populating the widget's HTML to reflect the
   * input value.
   *
   * @returns {Promise} An optional promise that's resolved once the widget has
   * loaded.
   */
  LivePointWidget.prototype.doLoad = function () {
    return this.render();
  };

  return LivePointWidget;
});
