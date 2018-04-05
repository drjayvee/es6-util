/*jshint esnext:true*/

import createWidget from 'js/widget';

// region WidgetParent extends Widget
/**
 * @class WidgetParent
 * @augments Widget
 * @see createWidgetParent
 */

/**
 * @typedef {Object} WidgetParentConfig
 * @property {Widget[]} [children]
 * @property {HTMLElement} [enhance]
 */

/**
 * @function
 * @param {WidgetParentConfig} [config]
 * @return {WidgetParent}
 */
const createWidgetParent = createWidget.extend(/** @lends WidgetParent.prototype */ {
	
	CHILD_TYPE: createWidget,
	
	_testChildType (child) {
		if (!(child instanceof this.CHILD_TYPE)) {
			throw 'Child is not a widget or wrong subtype';
		}
	},
	
	/**
	 * Add a child Widget
	 * 
	 * @param {Widget} child
	 * @param {Number} [index=null]
	 * @param {boolean} [render=true]
	 * @returns {WidgetParent} this
	 */
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
		
		return this;
	},
	
	_addChildDefFn (event) {
		this.children.splice(event.index, 0, event.child);
		event.child.addBubbleTarget(this);
	},

	/**
	 * Remove a child Widget
	 * 
	 * @param {Widget|Number} child or index
	 * @returns {WidgetParent} this
	 */
	removeChild (child) {
		let index;
		
		if (typeof child === 'number') {
			index = child;
			
			if (index > this.children.length || index < 0) {	// Note: index === length _is_ valid!
				throw 'Invalid index';
			}
			child = this.children[index];
		} else {
			this._testChildType(child);
			index = this.children.indexOf(child);
			if (index === -1) {
				throw 'Not a child';
			}
		}
		
		if (this.get('rendered')) {
			this.node.removeChild(child.node);
		}
		
		this.fire('removeChild', {index, child});
		
		return this;
	},
	
	_removeChildDefFn (event) {
		this.children.splice(event.index, 1);
		event.child.removeBubbleTarget(this);
	},
	
	/**
	 * @param {Widget} child
	 * @returns {boolean}
	 */
	contains (child) {
		this._testChildType(child);
		
		return this.children.indexOf(child) !== -1;
	},
	
	/**
	 * @param {Widget} child
	 * @returns {number}
	 */
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
	
	/**
	 * Destroy each child Widget, then destroy this
	 */
	destroy () {
		for (let child of this.children) {
			child.destroy();
		}
		
		createWidget.prototype.destroy.apply(this);
	}
}, function (superInit, {children = [], enhance = null} = {}) {
	if (enhance && children.length) {
		throw 'Cannot enhance existing element and add children';
	}
	
	superInit();
	
	this.publish('addChild', {
		defaultFn: this._addChildDefFn
	});
	
	this.publish('removeChild', {
		defaultFn: this._removeChildDefFn
	});
	
	this.children = [];
	
	if (enhance) {
		for (let node of Array.from(this.node.children)) {
			this.add(
				this.CHILD_TYPE({enhance: node})
			);
		}
	} else {
		for (let child of children) {
			this.add(child);
		}
	}
});
// endregion

export default createWidgetParent;
