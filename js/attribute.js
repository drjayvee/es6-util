/*global define, Event*/
define(function () {
	"use strict";
	
	function Attribute (config) {
		this._attributes = {};
		
		this._initAttributes(config);
	}
	
	Attribute.INVALID = {};
	
	Attribute.configKeys = ['value', 'validator', 'getter', 'setter'];
	
	Attribute.prototype = {
		constructor: Attribute,

		/**
		 * Config can have value, validator, getters, setter
		 * 
		 * @param {String} name
		 * @param {Object} [config]
		 */
		addAttribute: function (name, config) {
			var cfg = {};
			
			if (this.hasAttribute(name)) {
				throw new Error('Attribute "' + name + '" has already been added');
			}
			
			// sanitize config
			if (config && Object.keys(config).length) {
				Attribute.configKeys.forEach(function (key) {
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
			if (!this.constructor.hasOwnProperty('ATTRS')) {
				return;
			}
			
			Object.keys(this.constructor.ATTRS).forEach(function (name) {
				this.addAttribute(name, this.constructor.ATTRS[name]);
				
				if (values && values.hasOwnProperty(name)) {
					this.set(name, values[name]);
				}
			}, this);
		},

		/**
		 * 
		 * @param {String} name
		 * @param {*} value
		 * @returns {Attribute}
		 */
		set: function (name, value) {
			var attrConfig = this._attributes[name],
				current = this.get(name),	// will throw Error if attr doesn't exist, which if fine!
				okToSet = true;
			
			if (current === value) {
				return this;
			}
			
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
			return this;
		},

		/**
		 * 
		 * @param {String} name
		 * @returns {*}
		 */
		get: function (name) {
			var attrConfig = this._attributes[name],
				value;
			
			if (!this.hasAttribute(name)) {
				throw new Error('Attribute "' + name + '" has not been added');
			}
			
			value = this._attributes[name].value;
			if (attrConfig.getter) {
				value = attrConfig.getter(value, name);
			}
			return value;
		}
	};
	
	return {
		Attribute: Attribute
	};
});
