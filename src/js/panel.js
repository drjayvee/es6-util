/*jshint esnext:true*/

import {createButton} from 'js/button';
import createOverlay from 'js/overlay';

const CLOSE_ICON = '<span class="icon icon-close hasrole"></span>';

const MODAL_CLASS = 'yui3-widget-modal';
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
 * @property {Boolean} [hideOnEsc=true]
 * @property {Boolean} [hideOnClickOutside=true]
 * @property {Boolean} [destroyOnHide=true]
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
			validator: buttons => Array.isArray(buttons) && buttons.every(button => button instanceof createButton)
		}
	},
	
	CLASS: 'yui3-panel yui3-panel-content',
	
	_render () {
		createOverlay.prototype._render.apply(this, arguments);
		
		// close button
		if (this._closeButton) {
			this.node.firstElementChild.hidden = false;	// if no headerContent is set, overlay._setHeaderContent will hide
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
	
	_setHeaderContent () {
		if (!this._closeButton || !this.get('rendered')) {		// don't bother on initial render
			createOverlay.prototype._setHeaderContent.apply(this, arguments);
			return;
		}
		
		const headerNode = this.node.firstElementChild;
		const closeButton = headerNode.lastElementChild;
		
		headerNode.removeChild(closeButton);
		createOverlay.prototype._setHeaderContent.apply(this, arguments);
		headerNode.appendChild(closeButton);
	},
	
	enableDragging (handle = '.yui3-widget-hd', container = null, padding = 0) {
		return createOverlay.prototype.enableDragging.call(this, handle || '.yui3-widget-hd', container, padding);
	}
	
}, function init (superInit, {
	closeButton = true,
	hideOnEsc = true,
	hideOnClickOutside = true,
	destroyOnHide = true,
	modal = false
	// TODO draggable = true (overriding overlay's init)
} = {}) {
	superInit();
	
	this._closeButton = closeButton;
	
	this.onceAttrVal('rendered', true, () => {
		if (hideOnEsc) {
			const ekl = e => {
				if (this.get('visible') && e.keyCode === 27) {
					this.hide();
				}
			};
			
			document.addEventListener('keydown', ekl);
			
			this.onceAttrVal('rendered', false, () => {
				document.removeEventListener('click', ekl);
			});
		}
		
		if (hideOnClickOutside) {
			/*
			 * This feature is tricky to implement.
			 * 
			 * The simplest way would be to immediately set up the document clickOutside listener:
			 * if (this.get('rendered') && this.get('visible')) { this.hide(); }
			 * 
			 * First of all though, if we document.addEventListener('click') right now, that listener
			 * will be called _immediately_ if a click caused render() (i.e. icon.onClick = panel.render).
			 * Therefore, we setTimeout to add this listener a bit later.
			 * 
			 * Furthermore, if we have a createPanel({destroyOnHide: false}) and simply toggle visibility
			 * when some (external) node is clicked, then then this listener will be called when we
			 * click that node the 2nd time, which will immediately hide();
			 * 
			 * Therefore, we have to add and remove the clickOutside listener.
			 */
			
			const col = e => {
				if (this.node && document.body.contains(e.target) && !this.node.contains(e.target)) {	// why document.contains? highcharts has a "reset zoom" button which is removed when clicked, and before this handler is called. Therefore, !panel.contains(thatButton)
					this.hide();
				}
			};
			const addCol = () => {
				setTimeout(() => document.addEventListener('click', col), 1);
			};
			
			if (this.get('visible')) {
				addCol();
			}
			
			this.after('visibleChange', e => {
				if (e.newVal) {		// now visible
					addCol();
				} else {
					document.removeEventListener('click', col);
				}
			});
			
			this.onceAttrVal('rendered', false, () => {
				document.removeEventListener('click', col);
			});
		}
	});
	
	if (destroyOnHide) {
		this.after('visibleChange', e => {
			if (!e.newVal) {
				this.destroy();
			}
		});
	}
	
	if (modal) {
		this.after('renderedChange', e => {
			if (e.newVal) {
				this.node.classList.add(MODAL_CLASS);
			}
			if (this.get('visible')) {
				modality(e.newVal);		// only add modal screen if visible
			}
		});
		
		this.after('visibleChange', e => {
			if (this.get('rendered') || !e.newVal) {	// never show modal screen if we're not rendered
				modality(e.newVal);
			}
		});
	}
});

export default createPanel;
