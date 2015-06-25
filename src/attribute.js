/*jshint esnext:true*/

import {buildClass, Root} from 'js/oop';
import EventTarget from 'js/eventTarget';

// region Attribute
function Attribute () {}

Attribute.INVALID = {};

Attribute.CONFIG_KEYS = ['value', 'validator', 'getter', 'setter'];

Attribute.prototype = {
	constructor: Attribute,
	
	init: function (config) {
		this._attributes = {};
	
		this._initAttributes(config);
	},

	/**
	 * Config can have value, validator, getters, setter
	 * 
	 * @param {String} name
	 * @param {Object} [config]
	 */
	addAttribute: function (name, config) {
		if (this.hasAttribute(name)) {
			throw new Error(`Attribute "${name}" has already been added`);
		}
		
		// sanitize config
		let cfg = {};
		if (config && Object.keys(config).length) {
			Attribute.CONFIG_KEYS.forEach(key => {
				if (config.hasOwnProperty(key)) {
					cfg[key] = config[key];				// this clones the config, which is important, because we don't want to set the reference
				}
			});
		}
		
		this._attributes[name] = cfg;
	},

	/**
	 * 
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasAttribute: function (name) {
		return this._attributes.hasOwnProperty(name);
	},
	
	_initAttributes: function (values) {
		let attrConfigs = this._mergeAttrConfigs(this.constructor);
		
		Object.keys(attrConfigs).forEach(name => {
			this.addAttribute(name, attrConfigs[name]);
			
			if (values && values.hasOwnProperty(name)) {
				this.set(name, values[name]);
			}
		});
	},

	/**
	 * @param	{Function} constructor
	 * @param	{Function} [constructor.superclass]
	 * @param	{Object} [constructor.ATTRS]
	 * @param	{Function[]} [constructor.__mix]
	 * @returns {Object}
	 * @private
	 */
	_mergeAttrConfigs: function (constructor) {
		let attrs = {};
		
		// add super class chain ATTRs first (top down recursion)
		if (constructor.superclass) {
			attrs = this._mergeAttrConfigs(constructor.superclass);
		}
		
		// add this class's ATTRs
		if (constructor.ATTRS) {
			Object.assign(attrs, constructor.ATTRS);
		}
		
		// add mixin ATTRs
		if (constructor.__mixins) {
			constructor.__mixins.forEach(mix => {
				Object.assign(attrs, this._mergeAttrConfigs(mix));
			});
		}
		
		return attrs;
	},

	/**
	 * 
	 * @param {String} name
	 * @param {*} value
	 * @returns {Attribute}
	 */
	set: function (name, value) {
		this._set(name, value);
		return this;
	},
	
	_set: function (name, value) {
		let attrConfig = this._attributes[name],
			current = this.get(name),	// will throw Error if attr doesn't exist, which if fine!
			okToSet = true;
		
		// call validator / setter
		if (attrConfig.validator) {
			okToSet = attrConfig.validator(value, name, this) !== false;
		}
		
		if (okToSet && attrConfig.setter) {
			value = attrConfig.setter(value, name);
			if (value === Attribute.INVALID) {
				okToSet = false;
			}
		}
		
		// check if value has actually changed
		if (value === current) {
			okToSet = false;
		}
		
		if (okToSet) {
			this._attributes[name].value = value;
		}
		return okToSet;
	},

	/**
	 * 
	 * @param {String} name
	 * @returns {*}
	 */
	get: function (name) {
		if (!this.hasAttribute(name)) {
			throw new Error(`Attribute "${name}" has not been added`);
		}
		
		let attrConfig = this._attributes[name],
			value = this._attributes[name].value;
		
		if (attrConfig.getter) {
			value = attrConfig.getter(value, name);
		}
		return value;
	}
};
// endregion

var AttributeObservable = buildClass(Root, [EventTarget, Attribute], {
	_set: function (name, value) {
		let data = {
				prevVal:	this.get(name),
				newVal:		value,
				attrName:	name
			};
		
		let e = this._eventDispatch.createEvent(
			name + 'Change', true, data
		);
		
		let success = this._eventDispatch.dispatch(e);
		
		if (success) {
			value = e.newVal;		// allow on() listeners to change the new value
			
			success = Attribute.prototype._set.call(this, name, value);
			
			if (success) {		// attribute value was changed
				data.newVal = this.get(name);		// update newVal (post-setter)
				success = this._eventDispatch.dispatch('AFTER:' + name + 'Change', false, data);
			}
		}
		
		return success;
	}
});

export {Attribute, AttributeObservable};
