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
		} else if (index > this.children.length || index < 0) {	// Note: index === length _is_ valid!
			throw 'Invalid index';
		}
		
		if (this.get('rendered') && render) {
			this._renderChild(child, index);
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
	
	_enhance () {
		for (let node of Array.from(this.node.childNodes)) {
			if (node.nodeType !== Node.ELEMENT_NODE) {
				continue;
			}
			
			this.add(
				this.CHILD_TYPE().enhance(node)
			);
		}
	},
	
	_render () {
		this.children.forEach(this._renderChild, this);
	},
	
	_renderChild (child, index = null) {
		const beforeNode = (index && index < this.children.length) ? this.children[index].node : null;	// if index === length, then append, therefore beforeNode = null
		
		if (child.get('rendered')) {
			if (beforeNode) {
				this.node.insertBefore(child.node, beforeNode);
			} else {
				this.node.appendChild(child.node);
			}
		} else {
			child.render(this.node, beforeNode);
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
