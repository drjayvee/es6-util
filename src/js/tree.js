/*jshint esnext:true*/
/*global maquette*/

import {createAttributeObservable} from 'js/attribute';
const h = maquette.h;
const projector = maquette.createProjector();

const trees = [];



// region drag & drop
function encodeDnDItem (e) {
	const item = e.target.bind;
	
	e.dataTransfer.setData('text/plain', JSON.stringify([
		trees.indexOf(item.getRoot()),					// root's DOMElement index
		item instanceof createLeaf ? 'leaf' : 'node',	// item type
		item.get('id')									// item id
	]));
}

function decodeDnDItem (e) {
	const [rootElementIndex, itemType, itemId] = JSON.parse(e.dataTransfer.getData('text/plain'));
	const tree = trees[rootElementIndex];
	
	return tree.getItem(itemId, itemType === 'leaf' ? createLeaf : createNode);
}

function isValidDropTarget (e) {
	const dragItem = decodeDnDItem(e);
	const dropTarget = e.target;
	const dropItem = dropTarget.bind || dropTarget.parentNode.bind;
	
	return !(
		dropTarget.classList.contains('leaf')							||	// target is leaf item
		dragItem === dropItem											||	// target is self
		dragItem.parent === dropItem									||	// current parent
		(dragItem instanceof createNode && dragItem.contains(dropItem))	||	// target is descendant
		dragItem.getRoot() !== dropItem.getRoot()							// target is in other tree
	);
}

window.treeDnD_start = e => {
	e.dataTransfer.effectAllowed = 'move';
	
	encodeDnDItem(e);
};

window.treeDnD_over = e => {
	e.preventDefault();
	
	e.dataTransfer.dropEffect = isValidDropTarget(e) ? 'move' : 'none';
};

window.treeDnD_drop = e => {
	e.preventDefault();
	e.stopPropagation();	// don't bubble up to parent nodes
	
	if (!isValidDropTarget(e)) {
		return;
	}
	
	const draggedItem = decodeDnDItem(e);
	const dragTarget = (e.target.classList.contains('node') ? e.target : e.target.parentNode).bind;
	
	draggedItem.moveTo(dragTarget);
};
// endregion


// region tree
/**
 * @class Item
 * @augments AttributeObservable
 * @property {Node} [parent]
 */

/**
 * @typedef {Object} ItemConfig
 * @property {string|number} id
 * @property {string} label
 * @property {Item} parent
 */

/**
 * @function
 * @param {ItemConfig} config
 * @return {Item}
 */
const createItem = createAttributeObservable.extend(/** @lends Item.prototype */{
	
	ATTRS: {
		id: {},
		label: {},
	},

	/**
	 * 
	 * @return {RootNode}
	 */
	getRoot () {
		return this.parent.getRoot();
	},

	/**
	 * 
	 * @param {Node} newParent
	 */
	moveTo (newParent) {
		if (newParent === this.parent) {
			return;
		}
		
		this.parent.removeItem(this);
		newParent.addItem(this);
		this.parent = newParent;
	},
	
	toString () {	// for sort()ing
		return (this instanceof createLeaf ? '1' : '0') + this.get('label');
	},
	
}, function init (superInit, {parent}) {
	this.parent = parent;
	
	superInit();
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
	
	ATTRS: {
		icon: {
			value: null
		}
	},
	
	_render () {
		return h('li.leaf', {
			bind: this,
			'data-leaf-id': String(this.get('id')),
			
			draggable: 'true',
			ondragstart: 'treeDnD_start(event)',
		}, this._renderContent());
	},
	
	_renderContent () {
		return [
			h('span.icon.icon-' + (this.get('icon') || 'file')),
			' ',
			this.get('label'),
		];
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
const createNode = createItem.extend(/** @lends Node.prototype */{
	
	LIST_CLASS: null,
	
	ATTRS: {
		expanded: {
			value: false,
			validator: v => typeof v === 'boolean'
		},
		children: {
			value: [],
			setter: function (children) {
				const root = this.getRoot();
				
				return children.map(child => {
					if (!(child instanceof createItem)) {
						child.parent = this;
						child = child.children ? root.NODE_FACTORY(child): root.LEAF_FACTORY(child);
						child.addBubbleTarget(this);
					}
					return child;
				});
			}
		}
	},

	/**
	 * 
	 * @param {ItemConfig|Item} item
	 */
	addItem (item) {
		let children = this.get('children');
		children.push(item);
		this.set('children', children);
	},
	
	/**
	 * 
	 * @param {Item} item
	 */
	removeItem (item) {
		let children = this.get('children');
		children = children.filter(child => child !== item);
		this.set('children', children);
	},

	/**
	 * 
	 * @param {*} id
	 * @return {Leaf}
	 */
	getLeaf (id) {
		return this.getItem(id, createLeaf);
	},
	
	/**
	 * 
	 * @param {*} id
	 * @return {Node}
	 */
	getNode (id) {
		return this.getItem(id, createNode);
	},
	
	/**
	 * 
	 * @param {*} id
	 * @param {Function} factory
	 * @return {Item}
	 */
	getItem (id, factory) {
		for (let child of this.get('children')) {
			if (child instanceof factory && child.get('id') === id) {
				return child;
			}
			
			const descendantNode = child.getItem && child.getItem(id, factory);
			if (descendantNode) {
				return descendantNode;
			}
		}
		return null;
	},

	/**
	 * @param {Item} item
	 * @return bool
	 */
	contains (item) {
		return this.getItem(item.get('id'), item.factory);
	},
	
	toggle (expanded = !this.get('expanded')) {
		this.set('expanded', expanded);
	},
	
	_render () {
		return h(
			'li.node',
			{
				bind: this,
				'data-node-id': String(this.get('id')),
				
				classes: {
					'node-empty':		!this.get('children').length,
					'node-expanded':	this.get('expanded'),
				},
				
				draggable: 'true',
				ondragstart:'treeDnD_start(event)',
				ondragover:	'treeDnD_over(event)',
				ondrop:		'treeDnD_drop(event)'
			},
			[
				h('span.label', [this.get('label')])
			].concat(this._renderList())
		);
	},
	
	_renderList () {
		const expanded = this.get('expanded');
		const children = this.get('children');
		
		if (
			(!this._listRendered && !expanded) ||	// if list _is_ rendered but collapsed, hide it instead of removing DOM nodes
			!children.length
		) {
			return [];
		}
		
		this._listRendered = true;
		
		return h(
			'ul',
			Object.assign({hidden: !expanded}, this.LIST_CLASS ? {class: this.LIST_CLASS} : null),
			this.get('children').sort().map(item => item._render())
		);
	},
	
});



/**
 * @class RootNode
 * @augments Node
 */

/**
 * @function
 * @param {NodeConfig} config
 * @return {RootNode}
 */
const createRootNode = createNode.extend(/** @lends RootNode.prototype */{

	LIST_CLASS: 'root',
	
	LEAF_FACTORY: createLeaf,
	NODE_FACTORY: createNode,

	/**
	 * @override
	 */
	getRoot () {
		return this;
	},
	
	/**
	 * @override
	 */
	_render () {
		return h('div.tree', [this._renderList()]);
	},
	
});
// endregion



// region select tree
const createSelectLeaf = createLeaf.extend({

	/**
	 * @override
	 */
	_renderContent () {
		return [
			h('label', [
				h('input', {type: 'radio', name: 'leaf', value: this.get('id')}),
				' ',
				h('span.icon.icon-' + (this.get('icon') || 'file')),
				' ',
				this.get('label'),
			])
		];
	}
	
});

/**
 * @class SelectRootNode
 * @augments RootNode
 */

/**
 * @function
 * @param {NodeConfig} config
 * @return {SelectRootNode}
 */
const createSelectRootNode = createRootNode.extend(/** @lends SelectRootNode.prototype */{
	
	LEAF_FACTORY: createSelectLeaf,
	NODE_FACTORY: createNode,
	
	getSelectedLeaf () {
		return this._selectedLeaf;
	}
	
}, function init (superInit) {
	superInit();
	
	this._selectedLeaf = null;
	
	this.publish('leafClicked', {
		cancelable: false,
		defaultFn: e => this._selectedLeaf = e.leaf
	});
});
// endregion



// region rendering
/**
 * 
 * @param {Function} rootNodeFactory
 * @param {ItemConfig[]} items
 * @param {HTMLElement} parentNode
 * @return {RootNode}
 */
function renderTree (rootNodeFactory, items, parentNode) {
	const tree = rootNodeFactory({
		children: items,
		expanded: true,
		root: null
	});
	
	trees.push(tree);
	
	// render now
	projector.append(parentNode, () => tree._render());
	
	// rerender if data changes
	const render = () => projector.scheduleRender();
	tree.after('iconChange', render);
	tree.after('labelChange', render);
	tree.after('expandedChange', render);
	tree.after('childrenChange', render);
	
	// attach event listeners
	parentNode.addEventListener('click', e => {
		let ie = e.target;
		
		if (ie.classList.contains('label')) {	// clicked li.node .label: toggle
			/** @type {Node} */
			const node = ie.parentNode.bind;
			node.toggle();
		} else {								// clicked li.leaf: fire leafClicked event
			/** @type {Leaf} */
			let leaf;
			if (ie.classList.contains('leaf')) {	// regular Leaf	<li.leaf>$label</li>
				leaf = ie.bind;
			} else {								// SelectLeaf	<li.leaf><label><input> $label</li>
				// When anything other than the input is clicked, a _second_ click event is triggered for the input!
				// Therefore we only listen for the input click event to prevent handling the event twice.
				if (ie.nodeName === 'LABEL') {
					return;
				}
				leaf = ie.parentNode.parentNode.bind;
			}
			
			if (!leaf) {		// clicked just outside .tree, or between nodes or something
				return;
			}
			
			tree.fire('leafClicked', {
				label:	leaf.get('label'),
				id:		leaf.get('id'),
				leaf:	leaf,
			});
		}
	});
	
	return tree;
}

/**
 * @function
 * @argument {Array.<ItemConfig|Item>} items
 * @argument {HTMLElement}
 * @return {RootNode}
 * @see createNode
 */
export const createTree = function (items, parentNode) {
	return renderTree(createRootNode, items, parentNode);
};

/**
 * @function
 * @argument {Array.<ItemConfig|Item>} items
 * @argument {HTMLElement}
 * @return {SelectRootNode}
 * @see renderTree
 */
export const createSelectTree = function (items, parentNode) {
	return renderTree(createSelectRootNode, items, parentNode);
};
// endregion
