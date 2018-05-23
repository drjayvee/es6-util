/*jshint esnext:true*/
/*global maquette*/

import {createAttributeObservable} from 'js/attribute';
import {h, createProjector} from 'maquette';
const projector = createProjector();

const trees = [];



// region drag & drop
// Reference: https://mereskin.github.io/dnd/
window.treeDnD_start = e => {
	e.dataTransfer.effectAllowed = 'move';
	
	// encode dragged item
	const item = e.target.bind || e.target.parentNode.bind;
	e.dataTransfer.setData('text', JSON.stringify([
		trees.indexOf(item.getRoot()),					// root's DOMElement index
		item instanceof createLeaf ? 'leaf' : 'node',	// item type
		item.get('id')									// item id
	]));
};

window.treeDnD_dragenter = e => {
	if (e.target.nodeType === Node.ELEMENT_NODE) {
		e.preventDefault();
		e.stopPropagation();
	}
};

window.treeDnD_over = e => {
	if (e.target.nodeType === Node.ELEMENT_NODE) {
		// find item
		let node = e.target;
		while (!node.bind) {
			if (!node.parentNode || !node.parentNode.matches) {
				break;
			}
			node = node.parentNode;
		}
		const item = node && node.bind;
		
		// set drop effect depending on item type
		if (item instanceof createLeaf) {
			e.dataTransfer.dropEffect = 'none';
		} else {
			e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === 'move' ? 'move' : 'copy';	// dragging within window or from outside?
		}
		
		e.preventDefault();
		e.stopPropagation();
	}
};

window.treeDnD_drop = e => {
	e.preventDefault();
	
	const dragTarget = (e.target.classList.contains('node') ? e.target : e.target.parentNode).bind;
	
	if (e.dataTransfer.getData('text')) {
		// decode dragged item
		const [rootElementIndex, itemType, itemId] = JSON.parse(e.dataTransfer.getData('text'));
		const tree = trees[rootElementIndex];
		const draggedItem = tree.getItem(itemId, itemType === 'leaf' ? createLeaf : createNode);
		
		const dropTarget = e.target;
		const dropItem = dropTarget.bind || dropTarget.parentNode.bind;
		
		// move if target is valid drop item
		if (!(
			dropItem instanceof createLeaf											||	// target is leaf item
			draggedItem === dropItem												||	// target is self
			draggedItem.parent === dropItem											||	// current parent
			(draggedItem instanceof createNode && draggedItem.contains(dropItem))	||	// target is descendant
			draggedItem.getRoot() !== dropItem.getRoot()								// target is in other tree
		)) {
			draggedItem.moveTo(dragTarget);
		}
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
				bind:			this,
				classes:		this._getClasses(),
			}, (this.getRoot()._enableDragnDrop ? {
				draggable:		'true',
				ondragstart:	'treeDnD_start(event)',
			} : null)),
			this._renderContent()
		);
	},
	
	_getClasses () {
		return {};
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
		
		return this;
	},

	expandToRoot () {
		this.toggle(true);
		
		if (this.parent) {
			this.parent.expandToRoot();
		}
		
		return this;
	},
	
	_render () {
		return h(
			'li.node',
			Object.assign({
				bind:		this,
				classes:	this._getClasses(),
			}, (this.getRoot()._enableDragnDrop ? {
				draggable:	'true',
				ondragstart:'treeDnD_start(event)',
				ondragenter:'treeDnD_dragenter(event)',
				ondragover:	'treeDnD_over(event)',
				ondrop:		'treeDnD_drop(event)'
			} : null)),
			[
				this._renderLabel(),
				this._renderList()
			]
		);
	},
	
	_getClasses () {
		return {
			'node-empty':		!this.get('children').length,
			'node-expanded':	this.get('expanded'),
		};
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
			'ul' + (this.LIST_CLASS ? '.' + this.LIST_CLASS : ''),
			{hidden: !expanded},
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
	
}, function init (superInit, {enableDragnDrop = false}) {
	superInit();
	
	this._enableDragnDrop = enableDragnDrop;
	
	// configure itemClicked and leafClicked, a filtered version of the former
	this.publish('leafClicked');
	
	this.publish('itemClicked', {
		defaultFn:	e => {
			if (e.item instanceof createLeaf) {
				this.fire('leafClicked', {
					leaf:	e.item,
					leafId:	e.itemId,
					label:	e.label
				});
			} else {
				e.item.toggle();
			}
		}
	});
});
// endregion



// region select tree
const createSelectLeaf = createLeaf.extend({

	_getClasses () {
		return {
			selected: this.getRoot().getSelectedItem() === this,
		};
	},
	
	/**
	 * @override
	 */
	_renderContent () {
		return [
			h(
				'label',
				[
					createLeaf.prototype._renderContent.apply(this)
				]
			)
		];
	},
	
	select () {
		this.getRoot().selectItem(this);
	},
});

const createSelectNode = createNode.extend({
	
	_getClasses () {
		return Object.assign(createNode.prototype._getClasses.apply(this), {
			selected: this.getRoot().getSelectedItem() === this
		});
	},
	
	select () {
		this.getRoot().selectItem(this);
	},
	
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
	
	LIST_CLASS: 'root.selectable',
	
	LEAF_FACTORY: createSelectLeaf,
	NODE_FACTORY: createSelectNode,
	
	selectItem (item) {
		this.fire('itemSelected', {
			previous:	this._selectedItem,
			item:		item,
			itemId:		item.get('id'),
			label:		item.get('label'),
		});
	},
	
	/**
	 * 
	 * @return {Item|null}
	 */
	getSelectedItem () {
		return this._selectedItem;
	},
	
	clearSelection () {
		this.fire('itemSelected', {
			previous:	this._selectedItem,
			item:		null,
			itemId:		null,
			label:		null,
		});
	},
	
}, function init (superInit, {selectableNodes = false}) {
	superInit();
	
	this._selectedItem = null;
	
	// refine itemClicked event to itemSelected
	this.after('itemClicked', e => {
		if (
			e.item !== this._selectedItem &&
			(e.item instanceof createLeaf || selectableNodes)
		) {
			this.selectItem(e.item);
		}
	});
	
	// on item selection, set selection and render
	this.publish('itemSelected', {
		defaultFn: e => this._selectedItem = e.item
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
			expanded: true,
			children: items,
		}, config)
	);
	
	trees.push(tree);
	
	// render now
	projector.append(parentNode, () => tree._render());
	
	// rerender if data changes
	tree.render = () => projector.scheduleRender();
	tree.after('iconChange', tree.render);
	tree.after('labelChange', tree.render);
	tree.after('expandedChange', tree.render);
	tree.after('childrenChange', tree.render);
	
	// attach event listeners
	parentNode.addEventListener('click', e => {
		let ie = e.target,
			item;
		
		item = ie.bind || ie.parentNode.bind;	// li.(leaf|node) || li > label
		if (!item) {
			return;
		}
		
		tree.fire('itemClicked', {
			item,
			itemId:	item.get('id'),
			label:	item.get('label'),
		});
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
 * @param {Boolean} [selectableNodes]
 * @return {SelectRootNode}
 * @see renderTree
 */
export const createSelectTree = function (items, parentNode, selectableNodes = false) {
	const tree = renderTree(createSelectRootNode, items, parentNode, {selectableNodes});
	
	tree.after('itemSelected', tree.render);
	
	return tree;
};
// endregion
