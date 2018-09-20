/**
 * @copyright 2018 Tridium, Inc. All Rights Reserved.
 * @author Gareth Johnson
 */

/**
 * Data Model for a live point widget.
 *
 * @module nmodule/bajauxProgressBar/rc/livepoint/model
 * @private
 */
define([
    'baja!',
    'baja!baja:StatusValue,baja:IEnum,control:ControlPoint',
    'Promise',
    'bajaScript/baja/obj/numberUtil'
  ], function (
    baja,
    types,
    Promise,
    numberUtils
  ) {

  'use strict';

  var UNSPECIFIED_MIN_MAX = -1,
    DEFAULT_MIN_VALUE = 0,
    DEFAULT_MAX_VALUE = 100,
    convertUnitTo = numberUtils.convertUnitTo;


  /**
   * Return the powerFactor for this value. For example, if absolute value for a number is above 100, then return 100.
   * If number is above 1000, return 1000. For small values below 10, return 10 as the lowest factor.
   * @param val
   * @returns {number}
   */
  function powerFactor(val) {
    var result = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
    if (!isFinite(result) || result < 1) {
      result = 1;
    }
    return Math.pow(10, result);
  }

  /**
   * Returns a color for the status.
   * @param {baja.Status} status
   * @returns {String|undefined}
   */
  function getColourFromStatus(status) {
    if (status.isDisabled()) {
      return '#d6cbae';
    } else if (status.isFault()) {
      return '#fb7734';
    } else if (status.isDown()) {
      return '#fac600';
    } else if (status.isAlarm()) {
      return '#ce1624';
    } else if (status.isStale()) {
      return '#a59d86';
    } else if (status.isOverridden()) {
      return '#bfaddc';
    }
    return undefined;
  }

  /**
   * @private
   * @exports nmodule/bajauxProgressBar/rc/livepoint/model
   */
  var exports = {};

  /**
   * Asynchronously resolve an object that contains all the data necessary for rendering.
   *
   * @param {module:bajaux/Widget} widget The Widget used to create the data.
   *
   * @returns {Promise.<module:nmodule/bajauxProgressBar/rc/livepoint/model~PointDataModel>}
   *    A promise that resolves to an object containing the data used to render a widget.
   */
  exports.resolveData = function (widget) {

    var value = typeof widget.$overrideVal !== 'undefined' ? widget.$overrideVal : widget.value(),
      properties = widget.properties(),
      min = properties.getValue('min', UNSPECIFIED_MIN_MAX),
      max = properties.getValue('max', UNSPECIFIED_MIN_MAX),
      conversion = baja.getUnitConversion(),
      units = baja.Unit.DEFAULT,
      precision = 2,
      prop,
      parent,
      facets,
      ticks,
      ordinals,
      displayTags,
      enumRange,
      enm,
      color,
      status,
      i,
      factor,
      title = '',
      valueText = '',
      promises = [];

    if (value !== undefined && value !== null) {
      promises.push(baja.Format.format({
        pattern: widget.properties().getValue('title', ''),
        object: value
      }).then(function (text) {
        title = text;
      }));

      promises.push(baja.Format.format({
        pattern: widget.properties().getValue('valueText', ''),
        object: value
      }).then(function (text) {
        valueText = text;
      }));
    }

    return Promise.all(promises)
      .then(function () {
        if (value) {
          // Handle any Component that has an 'out' Property.
          if (value.getType().isComponent() && value.has('out')) {
            value = value.get('out');
          }

          // Handle any BStatusValue Struct
          if (value && value.getType().is('baja:StatusValue')) {
            status = value.get('status');
            parent = value.getParent();

            if (parent) {
              if (parent.getType().is('control:ControlPoint')) {
                facets = parent.get('facets');
              } else {
                prop = value.getPropertyInParent();
                if (prop) {
                  facets = parent.getFacets(prop);
                }
              }

              if (facets) {
                min = min === UNSPECIFIED_MIN_MAX ? facets.get('min', DEFAULT_MIN_VALUE) : min;
                max = max === UNSPECIFIED_MIN_MAX ? facets.get('max', DEFAULT_MAX_VALUE) : max;
              }
            }

            value = value.get('value');
          }
        }

        if (facets) {
          units = facets.get('units', baja.Unit.DEFAULT);
          precision = facets.get('precision', 2); //note that this is only for ticks since BFormat is used for valueText
        }

        if (typeof value === 'boolean') {
          displayTags = [ facets ? facets.get('falseText', false.toString()) : false.toString(),
            facets ? facets.get('trueText', true.toString()) : true.toString() ];
          min = 0;
          max = 1;
          ticks = 2;
          value = value ? 1 : 0;
        } else if (value && value.getType().is('baja:IEnum')) {
          enumRange = value.getRange();
          ordinals = enumRange.getOrdinals();
          value = value.getOrdinal();
          displayTags = [];

          // Find the index of the ordinal so we can map it over
          for (i = 0; i < ordinals.length; ++i) {
            enm = enumRange.get(ordinals[i]);

            displayTags.push(typeof enm.getDisplayTag === 'function' ? enm.getDisplayTag() : enm.getTag());
            if (ordinals[i] === value) {
              value = i;
            }
          }
          min = 0;
          max = ordinals.length - 1;
          ticks = ordinals.length;
        } else {

          min = isFinite(min) ? min : UNSPECIFIED_MIN_MAX;
          max = isFinite(max) ? max : UNSPECIFIED_MIN_MAX;

          // If min or max is -1 this means min and max is automatically calculated.
          if (min === UNSPECIFIED_MIN_MAX) {
            min = typeof widget.$lastMin === 'number' ? widget.$lastMin : DEFAULT_MIN_VALUE;

            factor = powerFactor(value);

            if (min > value) {
              min = 0;
            }

            if (typeof value === 'number') {
              if (value === 0) {
                min = 0;
              } else {
                while (min >= value) {
                  min = min - factor;
                  min = Math.round(min * factor) / factor;
                }
              }

              widget.$lastMin = min;
            }
          } else if (typeof value === 'number' && value < min) {
            // Make sure the value is not less than the min.
            value = min;
          }

          if (max === UNSPECIFIED_MIN_MAX) {

            max = typeof widget.$lastMax === 'number' ? widget.$lastMax : DEFAULT_MAX_VALUE;

            if (typeof value === 'number') {

              factor = powerFactor(value);

              if (max < value) {
                max = 0;
              }

              while (max <= value) {
                max = max + factor;
                max = Math.round(max * factor) / factor;
              }

              widget.$lastMax = max;
            }
          } else if (typeof value === 'number' && value > max) {
            // Make sure the value is not less than the max.
            value = max;
          }

        }

        if (status) {
          color = getColourFromStatus(status);

          if (status.isNull()) { value = null; }
        }

        return Promise.join(
          min === UNSPECIFIED_MIN_MAX ? DEFAULT_MIN_VALUE : convertUnitTo(min, units, conversion),
          max === UNSPECIFIED_MIN_MAX ? DEFAULT_MAX_VALUE : convertUnitTo(max, units, conversion),
          typeof value === 'number' ? convertUnitTo(value, units, conversion) : null
        )
        .spread(function (displayMin, displayMax, displayValue) {

          widget.$lastDisplayMin = displayMin;
          widget.$lastDisplayMax = displayMax;

          return {
            displayTags: displayTags,
            min: displayMin,
            max: displayMax,
            ticks: ticks || properties.getValue('ticks', 5),
            value: displayValue,
            title: title,
            valueText: valueText,
            color: color,
            units: units,
            precision: precision
          };
        });
      });
  };

  /**
   * @typedef {object} module:nmodule/bajauxProgressBar/rc/livepoint/model~PointDataModel
   * @property {string[]} displayTags - a list of display tags, applies to booleans & enums, default is undefined
   * @property {string} min - the lower limit for the value to be displayed, default is 0
   * @property {string} max - the lower limit for the value to be displayed, default is 100
   * @property {number} ticks - the number of tick marks to be displayed, default is 5
   * @property {string} value - a string representation of the value with baja.Format applied, default is null
   * @property {string} title - a title with baja.Format applied, , default is an empty string
   * @property {string} valueText - the value converted to text, default is an empty string
   * @property {string} color - a string representation of a color, default is undefined
   * @property {baja.Unit} units - used for the displaying min, max and value, default is baja.Unit.DEFAULT
   * @property {number} precision - default is 2
   */
  return exports;
});
