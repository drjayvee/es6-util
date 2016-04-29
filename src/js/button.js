/*jshint esnext:true*/

import {mix, createFactory} from 'js/oop';
import WidgetPrototype from 'js/widget';

// region ButtonP extends WidgetP
export const ButtonPrototype = mix(Object.create(WidgetPrototype), {
	ATTRS: {
		disabled: {
			value: false,
			setter: newVal => Boolean(newVal)
		}
	}
});

export const Button = createFactory(ButtonPrototype);
// endregion

// region ToggleButtonP extends ButtonP
export const ToggleButtonPrototype = mix(Object.create(ButtonPrototype), {
	ATTRS: {
		pressed: {
			value: false,
			setter: newVal => Boolean(newVal)
		}
	},
	
	toggle: function (pressed) {
		if (typeof pressed === 'undefined') {
			pressed = !this.get('pressed');
		}
		
		this.set('pressed', pressed);
	}
});

export const ToggleButton = createFactory(ToggleButtonPrototype);
// endregion
