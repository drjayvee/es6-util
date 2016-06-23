/*jshint esnext:true*/

import {extendFactory} from 'js/oop';
import {createAttributeObservable} from 'js/attribute';

const map = new Map();

// region WidgetP extends AttributeObservable
const createWidget = extendFactory(createAttributeObservable, {

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
	
	enhance (srcNode) {
		if (this.get('rendered')) {
			throw 'Already rendered';
		}
		
		this.set('hidden', srcNode.hidden);
		
		this.node = srcNode;
		
		this._addClassesToNode();
		
		this._enhance(srcNode);
		
		this._set('rendered', true, true);
		map.set(this.node, this);
		
		return this;
	},
	
	_enhance () {},
	
	render (parentNode = null, beforeNode = null) {
		if (this.get('rendered')) {
			throw 'Already rendered';
		}
		
		// create new node
		let c = document.createElement('div');
		c.innerHTML = this.NODE_TEMPLATE;
		this.node = c.firstElementChild;
		
		this._addClassesToNode();
		
		this.node.hidden = this.get('hidden');
		
		// call custom rendering
		this._render(this.node);
		
		// place node in DOM
		const parent = parentNode || document.body;
		if (beforeNode) {
			parent.insertBefore(this.node, beforeNode);
		} else {
			parent.appendChild(this.node);
		}
		
		map.set(this.node, this);
		this._set('rendered', true, true);
		
		return this;
	},
	
	_render () {},
	
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
	
	destroy () {
		if (this.node) {
			if (this.node.parentNode) {		// node may not have been appended to DOM: widget.render(document.createElement('div')))
				this.node.parentNode.removeChild(this.node);
			}
			map.delete(this.node);
			
			this.node = null;
		}
		
		this._set('rendered', false, true);
	}
});

export default createWidget;

export function getByNode (node) {
	return map.get(node);
}
// endregion
