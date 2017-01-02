/*jshint esnext:true*/

import {extendFactory} from 'js/oop';
import {createAttributeObservable} from 'js/attribute';

const map = new Map();

// region Widget extends AttributeObservable
/**
 * @class Widget
 * @augments AttributeObservable
 * @see createWidget
 */

/**
 * @typedef {Object} WidgetConfig
 * @property {boolean} [hidden=false]
 * @property {HTMLElement} [enhance]
 * @see AttributeConfig
 */

/**
 * @function
 * @param {WidgetConfig} [config]
 * @return {Widget}
 * @property {Widget} prototype
 */
const createWidget = extendFactory(createAttributeObservable, /** @lends Widget.prototype */ {

	ATTRS: {
		hidden: {
			value: false,
			validator: newVal => typeof newVal === 'boolean'
		},
		
		rendered: {
			value: false,
			readOnly: true
		}
	},
	
	NODE_TEMPLATE: '<div></div>',
	
	CLASS: 'widget',
	
	/**
	 * @param {HTMLElement} parentNode
	 * @param {HTMLElement} beforeNode
	 * @returns {Widget}
	 */
	render (parentNode = document.body, beforeNode = null) {
		if (this.get('rendered')) {
			throw 'Already rendered';
		}
		
		this._enhanceOrRender({parentNode, beforeNode});
		
		return this;
	},
	
	_enhanceOrRender ({parentNode, beforeNode, sourceNode}) {
		if (parentNode) {
			// create new node
			const c = document.createElement('div');
			c.innerHTML = this.NODE_TEMPLATE;
			this.node = c.firstElementChild;
			
			this.node.hidden = this.get('hidden');
		} else {
			this.node = sourceNode;
			
			this.set('hidden', sourceNode.hidden);
		}
		
		this._addClassesToNode();
		
		if (parentNode) {
			this._render();
		} else {
			this._enhance();
		}
		
		this._bindUI();
		
		if (parentNode) {
			// place node in DOM
			if (beforeNode) {
				parentNode.insertBefore(this.node, beforeNode);
			} else {
				parentNode.appendChild(this.node);
			}
		}
		
		map.set(this.node, this);
		this._set('rendered', true, true);
	},
	
	_enhance () {},
	
	_render () {},
	
	_bindUI () {},
	
	_getClasses () {
		const classes = [];
		
		let proto = this;
		do {
			proto = Object.getPrototypeOf(proto);
			if (proto.CLASS) {
				classes.push(proto.CLASS);
			}
		} while (proto !== createWidget.prototype);
		
		return classes;
	},
	
	_addClassesToNode () {
		this.node.classList.add(...this._getClasses());
	},
	
	/**
	 * Destroy this widget
	 * 
	 * Removes the element from document and removes DOM event listeners and
	 * event subscriptions
	 */
	destroy () {
		if (this.node) {
			if (this.node.parentNode) {		// node may not have been appended to DOM: widget.render(document.createElement('div')))
				this.node.parentNode.removeChild(this.node);
			}
			
			// clear event listeners and subscriptions
			for (let {eventType, cb} of this._nodeListeners) {
				this.node.removeEventListener(eventType, cb);
			}
			this._nodeListeners = [];
			
			for (let sub of this._subscriptions) {
				sub.unsubscribe();
			}
			this._subscriptions = [];
			
			// unset node
			map.delete(this.node);
			this.node = null;
		}
		
		this._set('rendered', false, true);
	},
	
	/**
	 * Register an event listener on this.node which will get removed on destroy()
	 * 
	 * @param {String} eventType
	 * @param {Function} cb
	 * @param {Object} context
	 * @see HTMLElement.addEventListener
	 */
	addEventListener (eventType, cb, context = this) {
		cb = cb.bind(context);
		
		this.node.addEventListener(eventType, cb);
		this._nodeListeners.push({eventType, cb});
	},
	
	_registerSubscriptions (...subs) {
		this._subscriptions.splice(this._subscriptions.length, 0, ...subs);
	}
}, function (superInit, {enhance = null} = {}) {
	superInit();
	
	this._nodeListeners = [];
	this._subscriptions = [];
	
	if (enhance) {
		this._enhanceOrRender({sourceNode: enhance});
	}
});

export default createWidget;

export function getByNode (node) {
	return map.get(node);
}
// endregion
