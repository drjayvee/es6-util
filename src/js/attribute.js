/*jshint esnext:true*/

import {mix} from 'js/oop';
import EventTarget from 'js/eventTarget';

// region Attribute
function Attribute () {}

Attribute.INVALID = {};

Attribute.CONFIG_KEYS = ['value', 'validator', 'getter', 'setter'];

/**
 * @param	{Function} constructor
 * @returns {Map}
 * @private
 */
Attribute._mergeAttrConfigs = function (constructor) {
	let attrs;
	
	// add super class chain ATTRs first (top down recursion)
	let superClass = Object.getPrototypeOf(constructor);
	if (superClass !== Function.prototype) {	// constructor is base constructor
		attrs = Attribute._mergeAttrConfigs(superClass);
	} else {
		attrs = new Map();
	}
	
	// add this class's ATTRs
	if (constructor.ATTRS) {
		for (let attr of Object.keys(constructor.ATTRS)) {
			attrs.set(attr, constructor.ATTRS[attr]);
		}
	}
	
	// add mixin ATTRs
	if (constructor.hasOwnProperty('__mixins')) {
		for (let mixin of constructor.__mixins) {
			attrs = new Map([...attrs, ...Attribute._mergeAttrConfigs(mixin)]);// see https://leanpub.com/exploring-es6/read#leanpub-auto-map
		}
	}
	
	return attrs;
};

Attribute.prototype = {
	constructor: Attribute,

	/**
	 * 
	 * @param {Object} values
	 */
	init: function (values = {}) {
		this._attributes = new Map();
	
		this._initAttributes(values);
	},

	/**
	 * Config can have value, validator, getters, setter
	 * 
	 * @param {String} name
	 * @param {Object} config
	 * @param {*} config.value
	 * @param {Function} config.validator
	 * @param {Function} config.getter
	 * @param {Function} config.setter
	 */
	addAttribute: function (name, {value, validator, getter, setter} = {}) {
		if (this.hasAttribute(name)) {
			throw new Error(`Attribute "${name}" has already been added`);
		}
		
		this._attributes.set(name, {
			value,
			validator,
			getter,
			setter
		});
	},

	/**
	 * 
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasAttribute: function (name) {
		return this._attributes.has(name);
	},
	
	_initAttributes: function (values = {}) {
		let attrConfigs = Attribute._mergeAttrConfigs(this.constructor);
		
		for (let [name, config] of attrConfigs) {
			this.addAttribute(name, config);
			
			if (values.hasOwnProperty(name)) {
				this.set(name, values[name]);
			}
		}
	},

	/**
	 * 
	 * @param {String} name
	 * @param {*} value
	 * @returns {SimpleAttribute}
	 */
	set: function (name, value) {
		this._set(name, value);
		return this;
	},
	
	_set: function (name, value) {
		let attrConfig = this._attributes.get(name),
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
			this._attributes.get(name).value = value;
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
		
		let attrConfig = this._attributes.get(name),
			value = attrConfig.value;
		
		if (attrConfig.getter) {
			value = attrConfig.getter(value, name);
		}
		return value;
	}
};
// endregion

// region AttributeObservable
function AttributeObservable () {}

AttributeObservable.prototype = {
	constructor: AttributeObservable,
	
	init (config) {
		EventTarget.prototype.init.call(this, config);
		Attribute.prototype.init.call(this, config);
	},
	
	_set (name, value) {
		let data = {
				prevVal:	this.get(name),
				newVal:		value,
				attrName:	name
			};
		
		let onEvent = this._eventDispatch.createEvent(
			name + 'Change', true, true, data
		);
		
		let success = this._eventDispatch.dispatch(onEvent);
		
		if (success) {
			value = onEvent.newVal;		// allow on() listeners to change the new value
			
			success = Attribute.prototype._set.call(this, name, value);
			
			if (success) {		// attribute value was changed
				data.newVal = this.get(name);		// update newVal (post-setter)
				
				let afterEvent = this._eventDispatch.createEvent(
					EventTarget.AFTER + name + 'Change', false, true, data
				);
				
				this._eventDispatch.dispatch(afterEvent);
			}
		}
		
		return success;
	}
};

mix(AttributeObservable, EventTarget, Attribute);
// endregion

export {Attribute, AttributeObservable};
