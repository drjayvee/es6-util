/*jshint esnext:true*/

import {mix, createFactory, extendFactory} from 'js/oop';
import WidgetPrototype from 'js/widget';

// region Button extends WidgetP
export const Button = createFactory(mix(Object.create(WidgetPrototype), {
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
	
	_enhance (srcNode) {
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
}), function () {
	WidgetPrototype.init.apply(this, arguments);
	
	this.after('disabledChange', this._setDisabled.bind(this));
	this.after('labelChange', this._setLabel.bind(this));
});
// endregion

// region ToggleButton extends Button
export const ToggleButton = extendFactory(Button, {
	ATTRS: {
		pressed: {
			value: false,
			setter: newVal => Boolean(newVal)
		}
	},
	
	toggle (pressed) {
		if (typeof pressed === 'undefined') {
			pressed = !this.get('pressed');
		}
		
		this.set('pressed', pressed);
	}
}, function () {
	Button.init.apply(this, arguments);
	
	// sync state to DOM
	this.after('pressedChange', () => {
		if (!this.get('rendered')) {
			return;
		}
		this.node.classList.toggle('pressed', this.get('pressed'));
	});
	
	// sync DOM to state
	this.after('rendered', () => {
		this.node.addEventListener('click', this.toggle.bind(this));
	});
});
// endregion
