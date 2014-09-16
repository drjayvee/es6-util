/*global define, Event*/
define(function () {
	"use strict";
	
	function Attribute () {
		this._attributes = {};
		
		this._initAttributes();
	}
	
	Attribute.INVALID = {};
	
	Attribute.prototype = {
		constructor: Attribute,
		
		addAttribute: function (name, config) {
			config = config || {};
			
			if (this._attributes[name]) {
				throw new Error('Attribute "' + name + '" has already been added');
			}
			
			this._attributes[name] = config;
		},
		
		hasAttribute: function (name) {
			return this._attributes.hasOwnProperty(name);
		},
		
		_initAttributes: function () {
			if (!this.constructor.hasOwnProperty('ATTRS')) {
				return;
			}
			
			Object.keys(this.constructor.ATTRS).forEach(function (name) {
				this.addAttribute(name, this.constructor.ATTRS[name]);
			}, this);
		},
		
		set: function (name, value) {
			var attrConfig = this._attributes[name],
				current = this.get(name),	// will throw Error if attr doesn't exist, which if fine!
				okToSet = true;
			
			if (current === value) {
				return this;
			}
			
			if (attrConfig.validator) {
				okToSet = attrConfig.validator(value, name, this) !== false;
			} else if (attrConfig.setter) {
				value = attrConfig.setter(value, name);
				if (value === Attribute.INVALID) {
					okToSet = false;
				}
			}
			
			if (okToSet) {
				this._attributes[name].value = value;
			}
			return this;
		},
		
		get: function (name) {
			var attrConfig = this._attributes[name],
				value;
			
			if (!this.hasAttribute(name)) {
				throw new Error('Attribute "' + name + '" has not been added');
			}
			
			value = this._attributes[name].value;
			if (attrConfig.getter) {
				return attrConfig.getter(value, name);
			}
			return value;
		}
	};
	
	return {
		Attribute: Attribute
	};
});
