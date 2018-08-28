/**
 * @copyright 2015 Tridium, Inc. All Rights Reserved.
 * @author Gareth Johnson
 */

/*jshint browser: true*/

/**
 * Data Model for a live point widget.
 *
 * @module nmodule/webChart/rc/gauge/model
 * @private
 */
define([
  'baja!',
  'baja!baja:StatusValue,baja:IEnum,control:ControlPoint',
  'Promise',
  'nmodule/webEditors/rc/fe/baja/util/numberUtils'], function(
  baja, 
  types, 
  Promise, 
  numberUtils) {
  "use strict";

  /**
   * Return the powerFactor for this value. For example, if absolute value for a number is above 100, then return 100.
   * If number is above 1000, return 1000. For small values below 10, return 10 as the lowest factor.
   * @param val
   * @returns {number}
   */
  function powerFactor(val) {
    var result = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
    if(!isFinite(result) || result < 1){
      result = 1;
    }
    return  Math.pow(10, result);
  }

  return {

    /**
     * Asynchronously resolve an object that contains all the data necessary for rendering a gauge.
     *
     * @param  widget The Widget used to create the data.
     *
     * @returns {Promise} A promise that resolves to an object that contains all of the
     * data used to render a gauge.
     */
    resolveData: function resolveData(widget) {

      var value = typeof widget.$overrideVal !== "undefined" ? widget.$overrideVal : widget.value(),
          properties = widget.properties(),
          min = properties.getValue("min", -1),
          max = properties.getValue("max", -1),
          conversion = baja.getUnitConversion(),
          units=baja.Unit.DEFAULT,
          precision=2,
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
          title = "",
          valueText = "",
          promises = [];

    if (value !== undefined && value !== null) {
      promises.push(baja.Format.format({
        pattern: widget.properties().getValue("title", ""),
        object: value
      }).then(function (text) {
        title = text;
      }));

      promises.push(baja.Format.format({
        pattern: widget.properties().getValue("valueText", ""),
        object: value
      }).then(function (text) {
        valueText = text;
      }));
    }      
  
    return Promise.all(promises)
      .then(function () {  
        if (value) {
          // Handle any Component that has an 'out' Property.
          if (value.getType().isComponent() && value.has("out")) {
            value = value.get("out");
          }

          // Handle any BStatusValue Struct
          if (value && value.getType().is("baja:StatusValue")) {
            status = value.get("status");
            parent = value.getParent();

            if (parent) {
              if (parent.getType().is("control:ControlPoint")) {
                facets = parent.get("facets");
              }
              else {
                prop = value.getPropertyInParent();
                if (prop) {
                  facets = parent.getFacets(prop);
                }
              }

              if (facets) {
                min = min === -1 ? facets.get("min", 0) : min;
                max = max === -1 ? facets.get("max", 100) : max;
              }
            }

            value = value.get("value");
          }
        }

        if(facets){
          units = facets.get("units", baja.Unit.DEFAULT);
          precision = facets.get("precision", 2); //note that this is only for ticks since BFormat is used for valueText
        }

        if (typeof value === "boolean") {
          displayTags = [facets ? facets.get("falseText", false.toString()) : false.toString(),
            facets ? facets.get("trueText", true.toString()) : true.toString()];
          min = 0;
          max = 1;
          ticks = 2;
          value = value ? 1 : 0;
        }
        else if (value && value.getType().is("baja:IEnum")) {
          enumRange = value.getRange();
          ordinals = enumRange.getOrdinals();
          value = value.getOrdinal();
          displayTags = [];

          // Find the index of the ordinal so we can map it over
          for (i = 0; i < ordinals.length; ++i) {
            enm = enumRange.get(ordinals[i]);

            displayTags.push(typeof enm.getDisplayTag === "function" ? enm.getDisplayTag() : enm.getTag());
            if (ordinals[i] === value) {
              value = i;
            }
          }
          min = 0;
          max = ordinals.length - 1;
          ticks = ordinals.length;
        }
        else {
          min = isFinite(min) ? min : -1;
          max = isFinite(max) ? max : -1;

          // If min or max is -1 this means min and max is automatically calculated.
          if (min === -1) {
            min = typeof widget.$lastMin === "number" ? widget.$lastMin : 0;

            factor = powerFactor(value);

            if (min > value) {
              min = 0;
            }

            if (typeof value === "number") {
              if (value === 0) {
                min = 0;
              }
              else {
                while (min >= value) {
                  min = min - factor;
                  min = Math.round(min * factor) / factor;
                }
              }

              widget.$lastMin = min;
            }
          }
          else if (typeof value === "number" && value < min) {
            // Make sure the value is not less than the min.
            value = min;
          }

          if (max === -1) {

            max = typeof widget.$lastMax === "number" ? widget.$lastMax : 0;

            if (typeof value === "number") {

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
          }
          else if (typeof value === "number" && value > max) {
            // Make sure the value is not less than the max.
            value = max;
          }
        }

        if (status) {
          // TODO: should get these from lexicon.
          if (status.isDisabled()) {
            //color = "#DDDDDD";
            color = "#d6cbae";
          }
          else if (status.isFault()) {
            //color = "#FFAA26";
            color = "#fb7734";
          }
          else if (status.isDown()) {
            //color =  "#FFFF00";
            color = "#fac600";
          }
          else if (status.isAlarm()) {
            //color = "#FF0000";
            color = "#ce1624";
          }
          else if (status.isStale()) {
            //color = "#D6CBAE";
            color = "#a59d86";
          }
          else if (status.isOverridden()) {
            //color = "#D88AFF";
            color = "#bfaddc";
          }

          if (status.isNull()) {
            value = null;
          }
        }

        return Promise.join(min === -1 ? 0  : numberUtils.convertUnitTo(min, units, conversion),
                            max === -1 ? 100: numberUtils.convertUnitTo(max, units, conversion),
                  typeof value === "number" ? numberUtils.convertUnitTo(value, units, conversion): null)
          .spread(function(displayMin, displayMax, displayValue){

            widget.$lastDisplayMin=displayMin;
            widget.$lastDisplayMax=displayMax;

            return {
              displayTags: displayTags,
              min: displayMin,
              max: displayMax,
              ticks: ticks || properties.getValue("ticks", 5),
              value: displayValue,
              title: title,
              valueText: valueText,
              color: color,
              units: units,
              precision: precision
            };
      });  
      });
    }
  };

});
