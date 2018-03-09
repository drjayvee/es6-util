/*jshint esnext:true*/

import createWidget from 'js/widget';
import {getBox, getPosition, align, center, move} from "js/position";

/**
 * @class Overlay
 * @augments Widget
 * @see createOverlay
 */

/**
 * @typedef {Object} OverlayConfig
 * @property {string} bodyContent	 		html
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
	 * @param {HTMLElement} target
	 * @param {Object} config
	 * @param {String[]} [config.alignment]	default: this.node centered below target
	 * @param {Number} [config.padding=0]
	 * @param {Boolean} [config.shift=false]
	 * @return {Overlay}
	 * @see Popper
	 */
	align (target, config) {
		const doAlign = () => {
			align(this.node, target, config);
		};
		
		if (this.get('rendered')) {
			doAlign();
		} else {
			if (this._initPopSub) {				// align() called twice before render?
				this._initPopSub.unsubscribe();		// cancel init with previous params
			}
			this._initPopSub = this.onceAfter('renderedChange', doAlign);
		}
		
		return this;
	},
	
	center () {
		this.onceAttrVal('rendered', true, () => {
			center(this.node);
		});
		
		return this;
	},

	/**
	 * 
	 * @param {HTMLElement} [container]
	 * @param {Number} [padding=0]
	 */
	enableDragging (container, padding = 0) {
		const handle = this.node.querySelector('.drag-handle') || this.node;
		
		let cursorOffset;
		
		const updatePosition = e => {
			const eventPos = getPosition(e);
			
			const newPos = {
				x: eventPos.x - cursorOffset.x,
				y: eventPos.y - cursorOffset.y
			};
			
			move(this.node, newPos, {container, padding});
		};
		
		const stopDragging = () => {
			document.removeEventListener('mousemove', updatePosition);
			document.removeEventListener('mouseup', stopDragging);
			
			Object.assign(this.node.style, {
				width:	'',
				height:	'',
			});
		};
		
		handle.style.cursor = 'move';
		
		// start dragging on mousedown
		handle.addEventListener('mousedown', e => {
			const eventPos = getPosition(e);
			const box = getBox(this.node);
			
			// temporarily fix dimensions while dragging to prevent reflow when box is moved to window's edge
			Object.assign(this.node.style, {
				width:	box.width	+ 'px',
				height:	box.height	+ 'px',
			});
			
			cursorOffset = {
				x: eventPos.x - box.left,
				y: eventPos.y - box.top
			};
			
			document.addEventListener('mousemove', updatePosition);
			document.addEventListener('mouseup', stopDragging);
			
			e.preventDefault();		// prevent text selection
		});
		
		return this;
	},
}, function init (superInit, {draggable = false} = {}) {
	superInit();
	
	if (draggable) {
		this.onceAttrVal('rendered', true, this.enableDragging, draggable.cageNode, draggable.padding);
	}
});

export default createOverlay;
