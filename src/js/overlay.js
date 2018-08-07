/*jshint esnext:true*/

import createWidget from 'js/widget';
import {getBox, align, center, move, enableDragging} from "js/position";

/**
 * @class Overlay
 * @augments Widget
 * @see createOverlay
 */

/**
 * @typedef {Object} OverlayConfig
 * @property {string|HTMLElement} bodyContent	 html or element
 * @property {string} [headerContent=null]	html
 * @property {boolean|Object} [draggable=false]
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
			value: null,
			validator: newVal => typeof newVal === 'string' || newVal instanceof HTMLElement
		},
	},
	
	CLASS: 'yui3-overlay yui3-overlay-content',
	
	NODE_TEMPLATE: `<div>
		<div class="yui3-widget-hd" hidden></div>
		<div class="yui3-widget-bd"></div>
		<div class="yui3-widget-ft" hidden></div>
	</div>`,
	
	_render () {
		const style = this.node.firstElementChild.nextElementSibling.style;
		if (this._maxHeight) {
			style.maxHeight = this._maxHeight + 'px';
		}
		if (this._maxWidth) {
			style.maxWidth = this._maxWidth + 'px';
		}
		
		this._setHeaderContent();
		this._setBodyContent();
	},
	
	_bindUI () {
		this.after('headerContentChange', this._setHeaderContent);
		this.after('bodyContentChange', this._setBodyContent);

		if (this._autoFixWidth) {
			this.onceAttrVal('rendered', true, () => {	// _bindUI is called _just_ before this.node is attached to the main DOM
				this.fixWidth();

				this.after('headerContentChange', this.fixWidth);
				this.after('bodyContentChange', this.fixWidth);
			});
		}
	},
	
	_setHeaderContent () {
		const headerContent = this.get('headerContent');
		this.node.firstElementChild.hidden = !Boolean(headerContent);
		this.node.firstElementChild.innerHTML = headerContent;
	},
	
	_setBodyContent () {
		const content = this.get('bodyContent'),
			cel = this.node.firstElementChild.nextElementSibling;
		
		if (content instanceof HTMLElement) {
			cel.appendChild(content);
		} else {
			cel.innerHTML = content || '';	// IE / Edge render "null" if content === null
		}
	},

	/**
	 * 
	 * @param {HTMLElement} target
	 * @param {Object} config
	 * @param {String[]} [config.alignment]	default: this.node centered below target
	 * @param {Number} [config.padding=0]
	 * @param {Boolean} [config.shift=false]
	 * @return {Overlay}
	 */
	align (target, config) {
		this._align = () => {
			align(this.node, target, config);
		};
		
		if (this.get('rendered')) {
			this._align();
		} else {
			if (this._initPopSub) {				// align() called twice before render?
				this._initPopSub.unsubscribe();		// cancel init with previous params
			}
			this._initPopSub = this.onceAfter('renderedChange', this._align);
		}
		
		return this;
	},
	
	/**
	 * 
	 * @return {Overlay}
	 */
	realign () {
		if (this._align) {
			this._align();
		}
		
		return this;
	},

	/**
	 * 
	 * @return {Overlay}
	 */
	center () {
		this.onceAttrVal('rendered', true, () => {
			center(this.node);
		});
		
		return this;
	},
	
	/**
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 * @return {Overlay}
	 */
	move (x, y) {
		this.onceAttrVal('rendered', true, () => {
			move(this.node, {x, y});
		});
		
		return this;
	},
	
	/*
	 * This is required for absolutely positioned nodes after scrolling
	 * CSS width: max-content (https://caniuse.com/#feat=intrinsic-width) is preferable
	 * but not supported by every browser (IE, Edge)
	 */
	fixWidth () {
		const {left, top} = getBox(this.node);
		
		// move to position 0, 0 and remove dimensions to let content flow "naturally"
		Object.assign(this.node.style, {
			width:	'',
			left:	0,
			top:	0,
		});
		
		const {width} = getBox(this.node);
		
		Object.assign(this.node.style, {
			width:	Math.ceil(width) + 'px',	// new width
			left:	left + 'px',				// original
			top:	top + 'px',					// position
		});
		
		return this;
	},

	/**
	 * 
	 * @param {HTMLElement|String} [handle=this.node]
	 * @param {HTMLElement} [container=null]
	 * @param {Number} [padding=0]
	 * @return {Overlay}
	 */
	enableDragging (handle, container = null, padding = 0) {
		if (!handle) {
			handle = this.node;
		} else if (typeof handle === 'string') {
			handle = this.node.querySelector(handle);
		}
		handle.style.cursor = 'move';
		
		enableDragging(this.node, handle, container, padding);
		
		return this;
	},
}, function init (superInit, {draggable = false, maxWidth = null, maxHeight = null, autoFixWidth = true} = {}) {
	superInit();
	
	this._maxWidth = maxWidth;
	this._maxHeight = maxHeight;
	this._autoFixWidth = autoFixWidth;
	
	if (draggable) {
		this.onceAttrVal('rendered', true, this.enableDragging, draggable.handle, draggable.cageNode, draggable.padding);
	}
});

export default createOverlay;
