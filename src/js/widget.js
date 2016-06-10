/*jshint esnext:true*/

import {extendFactory} from 'js/oop';
import {createAttributeObservable} from 'js/attribute';

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
	
	node: null,
	
	enhance (srcNode) {
		if (this.get('rendered')) {
			throw 'Already rendered';
		}
		
		this.set('hidden', srcNode.hidden);
		
		this.node = srcNode;
		
		this._enhance(srcNode);
		
		this._set('rendered', true, true);
	},
	
	render (parentNode = null) {
		if (this.get('rendered')) {
			throw 'Already rendered';
		}
		
		// create new node
		let c = document.createElement('div');
		c.innerHTML = this.NODE_TEMPLATE;
		this.node = c.firstElementChild;
		
		this.node.hidden = this.get('hidden');
		
		// call custom rendering
		this._render(this.node);
		
		// place node in DOM
		(parentNode || document.body).appendChild(this.node);
		
		this._set('rendered', true, true);
	},
	
	_render () {}
});

export default createWidget;
// endregion


/*
 two cases:
   - render to container = document.body
   - progressively enhance existing node
  */
