/*jshint esnext:true*/
/*global maquette*/

import {createAttributeObservable} from 'js/attribute';
import {h, createProjector} from 'maquette';
const projector = createProjector();

const trees = [];



// region drag & drop
function encodeDnDItem (e) {
	const item = e.target.bind || e.target.parentNode.bind;
	
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
	
	if (e.dataTransfer.getData('text/plain')) {
		e.dataTransfer.dropEffect = isValidDropTarget(e) ? 'move' : 'none';
	} else {	// dragging from outside browser
		const dragTarget = (e.target.classList.contains('node') ? e.target : e.target.parentNode).bind;
		if (dragTarget instanceof createNode) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}
};

window.treeDnD_drop = e => {
	e.preventDefault();
	e.stopPropagation();	// don't bubble up to parent nodes
	
	const dragTarget = (e.target.classList.contains('node') ? e.target : e.target.parentNode).bind;
	
	if (e.dataTransfer.getData('text/plain')) {
		if (!isValidDropTarget(e)) {
			return;
		}
		
		const draggedItem = decodeDnDItem(e);
		draggedItem.moveTo(dragTarget);
	} else {	// drop from outside browser
		if (dragTarget instanceof createNode) {
			dragTarget.fire('fileDrop', {
				item:	dragTarget,
				files:	e.dataTransfer.files
			});
		}
	}
	
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
	
	remove () {
		this.parent.removeItem(this);
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
export const createLeaf = createItem.extend({
	
	ATTRS: {
		icon: {
			value: null
		},
		previewExt: {
			value: null
		},
	},
	
	_render () {
		return h(
			'li.leaf',
			Object.assign({
				bind: this,
			}, (this.getRoot()._enableDragnDrop ? {
				draggable:		'true',
				ondragstart:	'treeDnD_start(event)',
			} : null)),
			this._renderContent()
		);
	},
	
	_renderContent () {
		return [
			this.get('icon') ?
				[h('img', {src: 'layout/pix/' + this.get('icon')}), ' '] :
				null,
			this.get('label')
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
export const createNode = createItem.extend(/** @lends Node.prototype */{
	
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

	expandToRoot () {
		this.toggle(true);
		
		if (this.parent) {
			this.parent.expandToRoot();
		}
	},
	
	_render () {
		return h(
			'li.node',
			Object.assign({
				bind: this,
				
				classes: {
					'node-empty':		!this.get('children').length,
					'node-expanded':	this.get('expanded'),
				},
				
			}, (this.getRoot()._enableDragnDrop ? {
				draggable:	'true',
				ondragstart:'treeDnD_start(event)',
				ondragover:	'treeDnD_over(event)',
				ondrop:		'treeDnD_drop(event)'
			} : null)),
			[
				this._renderLabel(),
				this._renderList()
			]
		);
	},
	
	_renderLabel () {
		return h('span.label', [this.get('label')]);
	},
	
	_renderList () {
		const expanded = this.get('expanded');
		const children = this.get('children');
		
		if (
			(!this._listRendered && !expanded) ||	// if list _is_ rendered but collapsed, hide it instead of removing DOM nodes
			!children.length
		) {
			return null;
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
export const createRootNode = createNode.extend(/** @lends RootNode.prototype */{

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
	
}, function init (superInit, {parentNode, enableDragnDrop = false}) {
	superInit();
	
	this._parentNode = parentNode;
	this._enableDragnDrop = enableDragnDrop;
});
// endregion



// region select tree
const createSelectLeaf = createLeaf.extend({

	/**
	 * @override
	 */
	_renderContent () {
		return [
			h(
				'label',
				[
					h('input', {
						type:		'radio',
						name:		'leaf',
						value:		String(this.get('id')),
						checked:	this.getRoot().getSelectedLeaf() === this
					}),
					' ',
				].concat(
					this.get('icon') ?
						[h('img', {src: 'layout/pix/' + this.get('icon')}), ' '] :
						null
				).concat(
					' ',
					this.get('label')
				)
			)
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
	
	/**
	 * 
	 * @return {Leaf|null}
	 */
	getSelectedLeaf () {
		return this._selectedLeaf;
	},
	
	clearSelection () {
		this._selectedLeaf = null;
		
		// setting h('input', {checked}) and re-rendering the tree will not uncheck radios
		// because the current VNode is not checked either (rendered unchecked, user checks, clear(), render unchecked)
		// therefore, uncheck the DOM node directly
		const si = this._parentNode.querySelector('input:checked');
		if (si) {
			si.checked = false;
		}
	},
	
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
 * @param {Object} [config]
 * @return {RootNode}
 */
export function renderTree (rootNodeFactory, items, parentNode, config = null) {
	const tree = rootNodeFactory(
		Object.assign({
			parentNode,
			expanded: true,
			children: items,
		}, config)
	);
	
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
				leafId:	leaf.get('id'),
				leaf:	leaf,
			});
		}
	});
	
	return tree;
}

/**
 * @function
 * @param {Array.<ItemConfig|Item>} items
 * @param {HTMLElement} parentNode
 * @param {Boolean} [enableDragnDrop=false]
 * @return {RootNode}
 * @see createNode
 */
export const createTree = function (items, parentNode, enableDragnDrop = false) {
	return renderTree(createRootNode, items, parentNode, {enableDragnDrop});
};

/**
 * @function
 * @param {Array.<ItemConfig|Item>} items
 * @param {HTMLElement} parentNode
 * @return {SelectRootNode}
 * @see renderTree
 */
export const createSelectTree = function (items, parentNode) {
	return renderTree(createSelectRootNode, items, parentNode);
};
// endregion
