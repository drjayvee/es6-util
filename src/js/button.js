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
		}
	},
	
	NODE_TEMPLATE: '<button type="button"></button>',
	
	CLASS: 'btn btn-secondary',
	
	_enhance () {
		this.set('disabled', this.node.disabled);
		this.set('label', this.node.innerHTML);
	},
	
	_render () {
		this._setLabel();
		this._setDisabled();
	},
	
	_bindUI () {
		this._registerSubscriptions(
			this.after('disabledChange', this._setDisabled),
			this.after('labelChange', this._setLabel)
		);
	},
	
	_setDisabled () {
		this.node.disabled = this.get('disabled');
	},
	
	_setLabel () {
		this.node.innerHTML = this.get('label');
	}
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
		
		this.set('pressed', this.node.classList.contains('active'));	// read state from DOM
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
		this.node.classList.toggle('active', this.get('pressed'));
	}
});
// endregion
