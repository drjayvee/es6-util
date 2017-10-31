/*jshint esnext:true*/

import Popper from 'Popper';
import createWidget from 'js/widget';

/**
 * @class Overlay
 * @augments Widget
 * @see createOverlay
 */

/**
 * @typedef {Object} OverlayConfig
 * @property {string} bodyContent	 		html
 * @property {string} [headerContent=null]	html
 * @see WidgetConfig
 */

/**
 * @function
 * @param {OverlayConfig} [config]
 * @return {Overlay}
 * @property {Overlay} prototype
 */
const createOverlay = createWidget.extend(/** @lends Overlay.prototype */{
	ATTRS: {
		headerContent: {
			value: null,
			validator: newVal => typeof newVal === 'string'
		},
		
		bodyContent: {
			validator: newVal => typeof newVal === 'string'
		},
	},
	
	NODE_TEMPLATE: `<div class="tooltip">
		<div class="tooltip-header" hidden></div>
		<div class="tooltip-inner"></div>
	</div>`,
	
	_render () {
		this._setContent();
	},
	
	_bindUI () {
		this._registerSubscriptions(
			this.after('headerContentChange', this._setContent),
			this.after('bodyContentChange', this._setContent)
		);
	},
	
	_setContent () {
		const headerContent = this.get('headerContent');
		this.node.firstElementChild.hidden = !Boolean(headerContent);
		this.node.firstElementChild.innerHTML = headerContent;
		
		this.node.lastElementChild.innerHTML = this.get('bodyContent');
	},

	/**
	 * 
	 * @param {HTMLElement} referenceElement
	 * @param {string} placement
	 * @param {Object} [modifiers]
	 * @return {Overlay}
	 * @see Popper
	 */
	align (referenceElement, placement, modifiers = {}) {
		const initPop = () => {
			this._popper = new Popper(referenceElement, this.node, {placement, modifiers});
			
			// Popper.destroy() after this.destroy()
			this.onceAfter('renderedChange', () => this._popper.destroy);
		};
		
		if (this._popper) {
			this._popper.reference = referenceElement;
			this._popper.options.placement = placement;
			// Stage 2: { ...this._popper.modifiers, ...modifiers }
			for (let [property, conf] of Object.entries(modifiers)) {
				Object.assign(this._popper.options.modifiers[property], conf);
			}
			this._popper.scheduleUpdate();
		} else {
			if (this.get('rendered')) {
				initPop();
			} else {
				if (this._initPopSub) {				// align() called twice before render?
					this._initPopSub.unsubscribe();		// cancel init with previous params
				}
				this._initPopSub = this.onceAfter('renderedChange', initPop);
			}
		}
		
		return this;
	},
});

export default createOverlay;