/*jshint esnext:true*/

import {createButton} from 'js/button';
import createOverlay from 'js/overlay';

const CLOSE_ICON = '<span class="icon icon-close hasrole"></span>';

/**
 * @class Panel
 * @augments Overlay
 * @see createPanel
 */

/**
 * @typedef {Object} PanelConfig
 * @property {Button[]} [buttons]
 * @see WidgetConfig
 */

/**
 * @function
 * @param {PanelConfig} [config]
 * @return {Panel}
 * @property {Panel} prototype
 */
const createPanel  = createOverlay.extend(/** @lends Panel.prototype */{
	
	ATTRS: {
		buttons: {
			value: [],
			validator: buttons => Array.isArray(buttons) && buttons.every(button => createButton.created(button))
		}
	},
	
	CLASS: 'yui3-panel yui3-panel-content',
	
	_render () {
		createOverlay.prototype._render.apply(this, arguments);
		
		// close button
		this.node.firstElementChild.classList.add('drag-handle');
		this.node.firstElementChild.insertAdjacentHTML('beforeend', CLOSE_ICON);
		this.node.firstElementChild.lastElementChild.addEventListener('click', () => this.hide());
		
		// footer buttons
		for (let button of this.get('buttons')) {
			if (button.get('rendered')) {
				this.node.lastElementChild.appendChild(button.node);
			} else {
				button.render(this.node.lastElementChild);
			}
		}
		this.node.lastElementChild.hidden = false;
	},
	
	enableDragging (handle = '.yui3-widget-hd', container = null, padding = 0) {
		createOverlay.prototype.enableDragging.call(this, handle || '.yui3-widget-hd', container, padding);
	}
	
});

export default createPanel;
