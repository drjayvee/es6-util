/*jshint esnext:true*/

import {extendFactory, createdBy} from 'js/oop';
import createWidget from 'js/widget';

// region WidgetParent
const createWidgetParent = extendFactory(createWidget, {
	
	CHILD_TYPE: createWidget,
	
	_testChildType (child) {
		if (!createdBy(child, this.CHILD_TYPE)) {
			throw 'Child is not a widget or wrong subtype';
		}
	},
	
	add (child, index = null, render = true) {
		this._testChildType(child);
		
		if (this.contains(child)) {
			throw 'Parent widget already contains child';
		}
		
		if (index === null) {
			index = this.children.length;
		} else if (index > this.children.length) {
			throw 'Invalid index';
		}
		
		if (this.get('rendered') && render) {
			this._renderChild(child);
		}
		
		this.fire('addChild', {child, index});
	},
	
	_addChildDefFn (event) {
		this.children.splice(event.index, 0, event.child);
		event.child.addBubbleTarget(this);
	},
	
	contains (child) {
		this._testChildType(child);
		
		return this.children.indexOf(child) !== -1;
	},
	
	getIndex (child) {
		this._testChildType(child);
		
		if (!this.contains(child)) {
			throw 'Not a child';
		}
		
		return this.children.indexOf(child);
	},
	
	_render () {
		this.children.forEach(this._renderChild, this);
	},
	
	_renderChild (child) {
		if (!this.get('rendered')) {
			throw 'Cannot render child before parent';
		}
		
		if (child.get('rendered')) {
			this.node.appendChild(child.node);
		} else {
			child.render(this.node);
		}
	},
	
	destroy () {
		for (let child of this.children) {
			child.destroy();
		}
		
		createWidget.prototype.destroy.apply(this);
	}
}, function (superInit, {children = []} = {}) {
	superInit();
	
	this.publish('addChild', {
		defaultFn: this._addChildDefFn
	});
	
	this.children = [];
	for (let child of children) {
		this.add(child);
	}
});
// endregion

export default createWidgetParent;
