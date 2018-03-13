/*jshint esnext:true*/

import {createButton} from 'js/button';
import createOverlay from 'js/overlay';

const CLOSE_ICON = '<span class="icon icon-close hasrole"></span>';

const MODAL_MASK = '<div class="yui3-widget-mask"></div>';

let modalMask = null;
function modality (enable = true) {
	if (enable && !modalMask) {
		document.body.insertAdjacentHTML('afterbegin', MODAL_MASK);
		modalMask = document.body.firstElementChild;
	}
	
	modalMask.hidden = !enable;
}

/**
 * @class Panel
 * @augments Overlay
 * @see createPanel
 */

/**
 * @typedef {Object} PanelConfig
 * @property {Button[]} [buttons=[]]
 * @property {Boolean} [closeButton=true]
 * @property {Boolean} [closeOnEsc=true]
 * @property {Boolean} [closeOnClickOutside=true]
 * @property {Boolean} [modal=false]
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
		if (this._closeButton) {
			this.node.firstElementChild.classList.add('drag-handle');
			this.node.firstElementChild.insertAdjacentHTML('beforeend', CLOSE_ICON);
			this.node.firstElementChild.lastElementChild.addEventListener('click', () => this.hide());
		}
		
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
	
	_setContent () {
		if (!this._closeButton || !this.get('rendered')) {		// don't bother on initial render
			createOverlay.prototype._setContent.apply(this, arguments);
			return;
		}
		
		const headerNode = this.node.firstElementChild;
		const closeButton = headerNode.lastElementChild;
		
		headerNode.removeChild(closeButton);
		createOverlay.prototype._setContent.apply(this, arguments);
		headerNode.appendChild(closeButton);
	},
	
	enableDragging (handle = '.yui3-widget-hd', container = null, padding = 0) {
		return createOverlay.prototype.enableDragging.call(this, handle || '.yui3-widget-hd', container, padding);
	}
	
}, function init (superInit, {closeButton = true, closeOnEsc = true, closeOnClickOutside = true, modal = false} = {}) {
	superInit();
	
	this._closeButton = closeButton;
	
	this.onceAttrVal('rendered', true, () => {
		if (closeOnEsc) {
			document.addEventListener('keydown', e => {
				if (e.keyCode === 27 && this.get('visible')) {
					this.hide();
				}
			});
		}
		
		if (closeOnClickOutside) {
			// TODO: use util.js onClickOutside
			const col = e => {
				if (e.keyCode === 27 && this.get('visible')) {
					this.hide();
					document.removeEventListener('click', col);
				}
			};
			document.addEventListener('click', col);
		}
	});
	
	if (modal) {
		this.after('renderedChange', e => modality(e.newVal));
	}
});

export default createPanel;
