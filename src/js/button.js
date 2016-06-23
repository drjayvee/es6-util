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
	
	_enhance (srcNode) {
		this.set('disabled', srcNode.disabled);
		this.set('label', srcNode.innerHTML);
	},
	
	_render () {
		this._setLabel();
		this._setDisabled();
	},
	
	_setDisabled () {
		if (!this.node) {
			return;
		}
		
		this.node.disabled = this.get('disabled');
	},
	
	_setLabel () {
		if (!this.node) {
			return;
		}
		
		this.node.innerHTML = this.get('label');
	}
}, function (superInit) {
	superInit();
	
	this.after('disabledChange', this._setDisabled);
	this.after('labelChange', this._setLabel);
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
	
	toggle (pressed) {
		if (typeof pressed === 'undefined') {
			pressed = !this.get('pressed');
		}
		
		this.set('pressed', pressed);
	},
	
	_enhance (srcNode) {
		this.set('pressed', srcNode.classList.contains('pressed'));
	},
	
	_render () {
		createButton.prototype._render.apply(this, arguments);
		
		this._setPressed();
	},
	
	_setPressed () {
		if (!this.node) {
			return;
		}
		
		this.node.classList.toggle('pressed', this.get('pressed'));
	}
}, function (superInit) {
	superInit();
	
	// sync state to DOM
	this.after('pressedChange', this._setPressed);
	
	// sync DOM to state
	this.after('rendered', () => {
		this.node.addEventListener('click', this.toggle.bind(this));
	});
});
// endregion
