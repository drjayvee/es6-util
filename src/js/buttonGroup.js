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
			
			for (let bt of this.getPressedButtons()) {		// at most one button should ever be pressed, but loop over all anyway
				bt.toggle(false);	// will cause recursion, and event will be cancelled by this function!
			}
			
			this._currentlyHandlingButtonPress = false;
		} else if (!this._currentlyHandlingButtonPress) {
			// prevent unpressing
			e.cancel();
			e.stopBubbling();
		}
	}
}, function (superInit, {radio = false} = {}) {
	superInit();
	
	Object.defineProperty(this, 'radio', {value: radio});
	
	this.publish('selectionChange', {
		cancelable: false
	});
	
	this.on('pressedChange', this._buttonPressed);
	
	this.after('pressedChange', (e) => {
		// a button was clicked OR this._buttonPressed toggled a button
		// therefore, don't fire selectionChanged on _unPress_ if radio
		if (!(radio && !e.newVal)) {
			this.fire('selectionChange');
		}
	});
});

export default createButtonGroup;

// TODO: add(createToggleButton({pressed: true}));
