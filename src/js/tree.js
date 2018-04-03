/*jshint esnext:true*/
/*global maquette*/

import {createAttributeObservable} from 'js/attribute';
const h = maquette.h;
const projector = maquette.createProjector();



/**
 * @class Item
 * @augments AttributeObservable
 */

/**
 * @typedef {Object} ItemConfig
 * @property {string|number} id
 * @property {string} label
 */



/**
 * @function
 * @param {ItemConfig} config
 * @return {Item}
 */
const createItem = createAttributeObservable.extend({
	
	ATTRS: {
		id: {},
		label: {},
	},
	
});

/**
 * @class Leaf
 * @augments Item
 */

/**
 * @function
 * @param {ItemConfig] config
 * @return {Leaf}
 */
const createLeaf = createItem.extend({
	
	_render () {
		return h('li.leaf', {
			key: this.get('id'),	// TODO: type + id
		}, [
			this.get('label')
		]);
	}
});



/**
 * @class Node
 * @augments Item
 */

/**
 * @typedef {Object} NodeConfig
 * @augments ItemConfig
 * @property {Array.<ItemConfig|Item>} children
 */

/**
 * @function
 * @param {NodeConfig} config
 * @return {Node}
 */
const createNode = createItem.extend({
	
	ATTRS: {
		expanded: {
			value: false,
			validator: v => typeof v === 'boolean'
		},
		children: {
			value: [],
			setter: function (children) {
				return children.map(child => {
					if (!createItem.created(child)) {
						child = child.type === 'node' ? createNode(child): createLeaf(child);
						child.addBubbleTarget(this);
					}
					return child;
				});
			}
		}
	},

	/**
	 * 
	 * @param {ItemConfig|Item} config
	 */
	addItem (config) {
		let children = this.get('children');
		// TODO: sort!
		children.push(config);
		this.set('children', children);
	},
	
	getLeaf (id) {
		return this._recursiveFind(id, createLeaf);
	},
	
	getNode (id) {
		return this._recursiveFind(id, createNode);
	},
	
	_recursiveFind (id, factory) {
		for (let child of this.get('children')) {
			if (!factory.created(child)) {
				continue;
			}
			
			if (child.get('id') === id) {
				return child;
			}
			
			const descendantNode = child.getNode(id);
			if (descendantNode) {
				return descendantNode;
			}
		}
		return null;
	},
	
	_render () {
		const expanded = this.get('expanded');
		const children = this.get('children');
		
		return h(
			'li.node',
			{
				key: this.get('id'),
				classes: {
					expanded,
					empty: !children.length
				}
			},
			[
				h('span.label', [this.get('label')])
			].concat(this._renderList())
		);
	},
	
	_renderList (className) {
		const expanded = this.get('expanded');
		const children = this.get('children');
		
		if (!expanded || !children.length) {
			return [];
		}
		
		return h(
			'ul',
			className ? {class: className} : {},
			this.get('children').map(item => item._render())
		);
	}
});

/**
 * @function
 * @argument {Array.<ItemConfig|Item>} items
 * @see createNode
 */
const createTree = createNode.extend({

	/**
	 * @override
	 */
	_render () {
		return this._renderList('root');
	},
	
}, function init (superInit, items, parentNode) {
	superInit();
	
	this.set('expanded', true);
	this.set('children', items);
	
	// render now
	projector.append(parentNode, () => this._render());
	
	// rerender if data changes
	const render = () => projector.scheduleRender();
	this.after('labelChange', render);
	this.after('expandedChange', render);
	this.after('childrenChange', render);
});

export default createTree;
