/*jshint esnext:true*/

import {extendFactory} from 'js/oop';
import createWidgetParent from 'js/widgetParent';
import {createToggleButton} from 'js/button';

const createButtonGroup = extendFactory(createWidgetParent, {
	CHILD_TYPE: createToggleButton,
	
	CLASS: 'buttonGroup',
	
	getPressedButtons () {
		return this.children.filter(button => button.get('pressed'));
	},
	
	_buttonPressed (e) {
		if (!this.radio) {
			return;
		}
		
		if (e.newVal) {
			// unpress other buttons
			this._currentlyHandlingButtonPress = true;
			
			const button = e.button;
			for (let bt of this.getPressedButtons()) {
				if (bt !== button) {
					bt.toggle(false);	// will cause recursion, and event will be cancelled by this function!
				}
			}
			
			this._currentlyHandlingButtonPress = false;
		} else if (!this._currentlyHandlingButtonPress) {
			// prevent unpressing
			e.cancel();
		}
	}
}, function (superInit, {radio = false} = {}) {
	superInit();
	
	Object.defineProperty(this, 'radio', {value: radio});
	
	this.on('pressedChange', this._buttonPressed);
});

export default createButtonGroup;
