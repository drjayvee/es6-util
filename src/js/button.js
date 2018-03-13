/*jshint esnext:true*/

import createWidget from 'js/widget';

// region Button extends Widget
/**
 * @class Button
 * @augments Widget
 * @see createButton
 */

/**
 * @typedef {Object} ButtonConfig
 * @property {boolean} [disabled=false]
 * @property {string} [label='']
 * @property {string} [value='']
 * @property {string|string[]} [classNames='']
 * @see WidgetConfig
 */

/**
 * @function
 * @param {ButtonConfig} [config]
 * @return {Button}
 * @property {Button} prototype
 */
export const createButton = createWidget.extend(/** @lends Button.prototype */ {
	ATTRS: {
		disabled: {
			value: false,
			setter: newVal => Boolean(newVal)
		},
		
		label: {
			value: '',
			validator: newVal => typeof newVal === 'string'
		},
		
		value: {
			value: '',
			validator: newVal => typeof newVal === 'string'
		}
	},
	
	NODE_TEMPLATE: '<button type="button"></button>',
	
	CLASS: 'yui3-button',
	
	_enhance () {
		this.set('disabled', this.node.disabled);
		this.set('label', this.node.innerHTML);
		this.set('value', this.node.value);
	},
	
	_render () {
		this._setLabel();
		this._setDisabled();
		this._setValue();
	},
	
	_getClasses () {
		return createWidget.prototype._getClasses.apply(this, arguments)
			.concat(this._classNames);
	},
	
	_bindUI () {
		this._registerSubscriptions(
			this.after('disabledChange', this._setDisabled),
			this.after('labelChange', this._setLabel),
			this.after('valueChange', this._setValue)
		);
	},
	
	_setDisabled () {
		this.node.disabled = this.get('disabled');
	},
	
	_setLabel () {
		this.node.innerHTML = this.get('label');
	},
	
	_setValue () {
		this.node.value = this.get('value');
	},
}, function init (superInit, {action = null, classNames = []} = {}) {
	superInit();
	
	if (action) {
		this.action = action;
		this.addEventListener('click', action);
	}
	
	if (typeof classNames === 'string') {
		classNames = [classNames];
	}
	this._classNames = classNames;
});
// endregion

// region ToggleButton extends Button
/**
 * @class ToggleButton
 * @augments Button
 * @see createToggleButton
 */

/**
 * @typedef {Object} ToggleButtonConfig
 * @property {boolean} [pressed=false]
 * @see ButtonConfig
 */

/**
 * @function
 * @param {ToggleButtonConfig} [config]
 * @return {ToggleButton}
 * @property {ToggleButton} prototype
 */
export const createToggleButton = createButton.extend(/** @lends ToggleButton.prototype */ {
	ATTRS: {
		pressed: {
			value: false,
			setter: newVal => Boolean(newVal)
		}
	},
	
	/**
	 * Toggle or set pressed state
	 * 
	 * @param {boolean} [pressed]
	 */
	toggle (pressed = !this.get('pressed')) {
		this.set('pressed', pressed);
	},
	
	_enhance () {
		createButton.prototype._enhance.apply(this, arguments);
		
		this.set('pressed', this.node.classList.contains(`${this.CLASS}-selected`));	// read state from DOM
	},
	
	_render () {
		createButton.prototype._render.apply(this, arguments);
		
		this._setPressed();		// sync state to DOM
	},
	
	_bindUI () {
		createButton.prototype._bindUI.apply(this, arguments);
		
		this._registerSubscriptions(
			this.after('pressedChange', this._setPressed)
		);
		
		this.addEventListener('click', () => {this.toggle();});	// anonymous function so toggle doesn't get event argument
	},
	
	_setPressed () {
		this.node.classList.toggle(`${this.CLASS}-selected`, this.get('pressed'));
	}
});
// endregion
