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

	/**
	 * 
	 * @param {HTMLElement} [cageNode]
	 * @param {Number} [padding=0]
	 */
	enableDragging (cageNode, padding = 0) {
		const handle = this.node.querySelector('.drag-handle') || this.node;
		
		// region constrain boxes
		let cageBox = null, screenBox;
		
		const setConstrainBoxes = () => {
			if (cageNode) {
				const {left: x, top: y, width, height} = cageNode.getBoundingClientRect();
				cageBox = {x: x + window.pageXOffset, y: y + window.pageYOffset, width, height};	// translate to client rect to window space
			}
			
			screenBox = {x: window.pageXOffset, y: window.pageYOffset, width: window.innerWidth, height: window.innerHeight};
		};
		
		setConstrainBoxes();
		// endregion
		
		// region positioning utilities
		const getPos = () => {
			const rect = this.node.getBoundingClientRect();
			return {x: rect.left, y: rect.top};
		};
		
		let position = getPos();
		
		const move = () => {
			Object.assign(this.node.style, {
				left:	`${position.x}px`,
				top:	`${position.y}px`,
			});
			// transform: translate gives weird artifacts in Firefox
			// this.node.style.transform = `translate(${position.x}px, ${position.y}px)`;
		};
		
		const constrain = ({x: destX, y: destY}, {x: boxX, y: boxY, width: boxWidth, height: boxHeight}) => {
			return {
				x: Math.max(boxX + padding, Math.min(destX, boxX + boxWidth  - padding - this.node.offsetWidth)),
				y: Math.max(boxY + padding, Math.min(destY, boxY + boxHeight - padding - this.node.offsetHeight))
			};
		};
		// endregion
		
		let animId, cursorOffset;
		
		const updatePosition = e => {
			// new position
			let newPos = {
				x: e.clientX - cursorOffset.x,
				y: e.clientY - cursorOffset.y
			};
			
			// constrain by window and cage
			if (cageBox) {
				newPos = constrain(newPos, cageBox);
			}
			newPos = constrain(newPos, screenBox);
			
			// move node only if position changed
			if (position.x !== newPos.x || position.y !== newPos.y) {
				position = newPos;
				
				if (!animId) {
					animId = window.requestAnimationFrame(() => {
						move();
						
						animId = null;
					});
				}
			}
		};
		
		const stopDragging = () => {
			document.removeEventListener('mousemove', updatePosition);
			document.removeEventListener('mouseup', stopDragging);
		};
		
		// initialize node's position (at current location)
		if (this.node.parentNode.nodeName !== "BODY") {				// if not already child of <body>
			document.querySelector('body').appendChild(this.node);		// move it there to make position: absolute actually 'absolute'
		}
		
		Object.assign(this.node.style, {
			cursor:		'move',
			position:	'absolute',
			left:		position.x,
			top:		position.y,
		});
		move();
		
		// start dragging on mousedown
		handle.addEventListener('mousedown', e => {
			setConstrainBoxes();
			
			cursorOffset = {
				x: e.clientX - position.x,
				y: e.clientY - position.y
			};
			
			document.addEventListener('mousemove', updatePosition);
			document.addEventListener('mouseup', stopDragging);
			
			e.preventDefault();		// prevent text selection
		});
	},
}, function init (superInit, {draggable = false} = {}) {
	superInit();
	
	if (draggable) {
		if (this.get('rendered')) {
			this.enableDragging(draggable.cageNode, draggable.padding);
		} else {
			this.onceAfter('renderedChange', this.enableDragging.bind(this, draggable.cageNode, draggable.padding));
		}
	}
});

export default createOverlay;
