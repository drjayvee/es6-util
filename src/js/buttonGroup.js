/*jshint esnext:true*/

import createWidgetParent from 'js/widgetParent';
import {createToggleButton} from 'js/button';

// region ButtonGroup extends WidgetParent
/**
 * @class ButtonGroup
 * @augments WidgetParent
 * @see createButtonGroup
 */

/**
 * @typedef {object} ButtonGroupConfig
 * @property {boolean} [radio=false]
 */

/**
 * @function
 * @param {ButtonGroupConfig} [config]
 * @return {ButtonGroup}
 */
const createButtonGroup = createWidgetParent.extend(/** @lends ButtonGroup.prototype */ {
	CHILD_TYPE: createToggleButton,
	
	CLASS: 'btn-group',

	/**
	 * @return {ToggleButton[]}
	 */
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
// endregion

// TODO: add(createToggleButton({pressed: true}));
