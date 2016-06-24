/*jshint esnext:true*/

import {mix, createFactory, extendFactory} from 'js/oop';
import createWidget from 'js/widget';

// region Button extends WidgetP
export const createButton = extendFactory(createWidget, {
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
	
	CLASS: 'button',
	
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
export const createToggleButton = extendFactory(createButton, {
	ATTRS: {
		pressed: {
			value: false,
			setter: newVal => Boolean(newVal)
		}
	},
	
	CLASS: 'toggleButton',
	
	toggle (pressed = !this.get('pressed')) {
		this.set('pressed', pressed);
	},
	
	_enhance () {
		createButton.prototype._enhance.apply(this, arguments);
		
		this.set('pressed', this.node.classList.contains('pressed'));	// read state from DOM
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
		
		this._registerListener('click', () => {this.toggle();});	// anonymous function so toggle doesn't get event argument
	},
	
	_setPressed () {
		this.node.classList.toggle('pressed', this.get('pressed'));
	}
});
// endregion
