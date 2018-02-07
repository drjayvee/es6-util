/*jshint esnext:true*/
/*global YUI, Popper*/

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
	
	CLASS: 'yui3-overlay yui3-overlay-content',
	
	NODE_TEMPLATE: `<div>
		<div class="yui3-widget-hd" hidden></div>
		<div class="yui3-widget-bd"></div>
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
	 * @param {string} [offset]
	 * @return {Overlay}
	 * @see Popper
	 */
	align (referenceElement, placement, offset = null) {
		if (this._popper) {
			this._popper.reference = referenceElement;
			this._popper.options.placement = placement;
			
			// update 'offset' modifier directly
			for (let mod of this._popper.modifiers) {
				if (mod.name === 'offset') {
					mod.offset = offset;
					break;
				}
			}
			
			this._popper.scheduleUpdate();
		} else {
			const initPopper = () => {
				let modifiers = {
					preventOverflow: {
						boundariesElement: 'viewport',
						padding: 16,
					},
				};
				if (offset) {
					modifiers.offset = {offset: offset};
				}
				
				this._popper = new Popper(referenceElement, this.node, {placement, modifiers});
				
				// Popper.destroy() after this.destroy()
				this.onceAfter('renderedChange', () => this._popper.destroy);
			};
			
			// lazy-load Popper using YUI if necessary and possible
			let pop = initPopper;
			if (typeof Popper === 'undefined' && typeof YUI !== 'undefined') {
				pop = () => {
					YUI().use('popper', initPopper);
				};
			}
			
			if (this.get('rendered')) {
				pop();
			} else {
				if (this._initPopSub) {				// align() called twice before render?
					this._initPopSub.unsubscribe();		// cancel init with previous params
				}
				this._initPopSub = this.onceAfter('renderedChange', pop);
			}
		}
		
		return this;
	},
});

export default createOverlay;
