/*jshint esnext:true*/

import {createFactory} from 'js/oop';
import createEventTarget, {AFTER} from 'js/eventTarget';

// region Attribute
/**
 * @param	{Object} source
 * @returns {Map}
 * @private
 */
function mergeAttrConfigs (source) {
	let attrs;
	
	// add prototype chain ATTRs first (top down recursion)
	let proto = Object.getPrototypeOf(source);
	if (proto !== Object.prototype) {
		attrs = mergeAttrConfigs(proto);
	} else {
		attrs = new Map();
	}
	
	// add own ATTRs
	if (source.hasOwnProperty('ATTRS')) {
		for (let attr of Object.keys(source.ATTRS)) {
			attrs.set(attr, source.ATTRS[attr]);
		}
	}
	
	// add mixin ATTRs
	if (source.hasOwnProperty('__mixins')) {
		for (let mixin of source.__mixins) {
			attrs = new Map([...attrs, ...mergeAttrConfigs(mixin)]);// see http://exploringjs.com/es6/ch_maps-sets.html#_combining-maps
		}
	}
	
	return attrs;
}

/** @class Attribute */

/**
 * @typedef {Object} AttributeConfig
 */

/**
 * @function
 * @param {AttributeConfig} [config]	initialize attributes with these values
 * @return {Attribute}
 * @property {Attribute} prototype
 */
export const createAttribute = createFactory(/** @lends Attribute.prototype */ {
	INVALID: {},	// used as a constant

	/**
	 * Config can have value, validator, getters, setter
	 * 
	 * @param {String} name
	 * @param {Object} [config]
	 * @param {*} [config.value]
	 * @param {Function} [config.validator]
	 * @param {Function} [config.getter]
	 * @param {Function} [config.setter]
	 * @param {Boolean} [config.readOnly]
	 */
	addAttribute: function (name, {value, validator, getter, setter, readOnly} = {}) {
		if (this.hasAttribute(name)) {
			throw new Error(`Attribute "${name}" has already been added`);
		}
		
		this._attributes.set(name, {
			value,
			validator,
			getter,
			setter,
			readOnly
		});
	},

	/**
	 * Check if attribute has already been added (through addAttribute or prototype.ATTRS)
	 * 
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasAttribute: function (name) {
		return this._attributes.has(name);
	},

	/**
	 * Set an attribute value
	 * 
	 * @param {String} name
	 * @param {*} value
	 * @returns {*}
	 */
	set: function (name, value) {
		this._set(name, value);
		return this;
	},
	
	_set: function (name, value, overrideReadOnly = false) {
		const attrConfig = this._attributes.get(name),
			current = this.get(name);	// will throw Error if attr doesn't exist, which if fine!
		let okToSet = true;
		
		value = this._copy(value);
		
		if (attrConfig.readOnly && !overrideReadOnly) {
			okToSet = false;
		}
		
		// call validator / setter
		if (okToSet && attrConfig.validator) {
			okToSet = attrConfig.validator.call(this, value, name) !== false;
		}
		
		if (okToSet && attrConfig.setter) {
			value = attrConfig.setter.call(this, value, name);
			if (value === this.INVALID) {
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
	 * Get an attribute value
	 * 
	 * @param {string} name
	 * @returns {*}
	 */
	get: function (name) {
		if (!this.hasAttribute(name)) {
			throw new Error(`Attribute "${name}" has not been added`);
		}
		
		let attrConfig = this._attributes.get(name),
			value = this._copy(attrConfig.value);
		
		if (attrConfig.getter) {
			value = attrConfig.getter(value, name);
		}
		return value;
	},
	
	_copy: function (value) {
		if (Array.isArray(value)) {
			value = value.slice(0);
		} else if (value && typeof value === 'object') {
			value = Object.assign({}, value);
		}
		
		return value;
	},
	
}, function (values = {}) {
	this._attributes = new Map();

	const attrConfigs = mergeAttrConfigs(this);
	
	for (let [name, config] of attrConfigs) {
		this.addAttribute(name, config);
		
		if (values.hasOwnProperty(name)) {
			this._set(name, values[name], true);
		}
	}
});
// endregion

// region AttributeObservable
/**
 * @class AttributeObservable
 * @augments Attribute
 * @augments EventTarget
 */

/**
 * @function
 * @param {AttributeConfig} [config]	initialize attributes with these values
 * @return {AttributeObservable}
 * @property {AttributeObservable} prototype
 */
export const createAttributeObservable = createAttribute.extend(/** @lends AttributeObservable.prototype */ {
	_set (name, value, overrideReadOnly = false) {
		const data = {
				prevVal:	this.get(name),
				newVal:		value,
				attrName:	name,
				originalTarget: this
			},
			readOnly = this._attributes.get(name).readOnly;
		
		const onEvent = this._eventDispatch.createEvent(
			name + 'Change', !readOnly, true, data
		);
		this._fireEvent(onEvent);
		
		let success = !onEvent.cancelled;
		
		if (success) {
			if (!readOnly) {
				value = onEvent.newVal;		// allow on() listeners to change the new value
			}
			
			success = createAttribute.prototype._set.call(this, name, value, overrideReadOnly);
			
			if (success) {		// attribute value was changed
				data.newVal = this.get(name);		// update newVal (post-setter)
				
				const afterEvent = this._eventDispatch.createEvent(
					AFTER + name + 'Change', false, true, data
				);
				
				this._fireEvent(afterEvent);
			}
		}
		
		return success;
	},
	
	onceAttrVal (name, value, cb, ...args) {
		let afterSub = null;
		
		const check = () => {
			if (this.get(name) === value) {
				cb.call(this, ...args);
				if (afterSub) {
					afterSub.unsubscribe();
				}
				
				return true;
			}
			return false;
		};
		
		if (!check()) {
			afterSub = this.after(name + 'Change', check);
		}
		
		return this;
	}
}, function (superInit) {
	createEventTarget.init.apply(this, arguments);
	superInit();
}).mix(createEventTarget.prototype);
// endregion
