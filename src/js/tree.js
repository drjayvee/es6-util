/*jshint esnext:true*/
/*global maquette*/

import {createAttributeObservable} from 'js/attribute';
const h = maquette.h;
const projector = maquette.createProjector();

const map = new Map();



// region drag & drop
function encodeDnDItem (e) {
	const item = e.target.bind;
	
	e.dataTransfer.setData('text/plain', JSON.stringify([
		map.get(item.getRoot()),						// root's DOMElement id
		item instanceof createLeaf ? 'leaf' : 'node',	// item type
		item.get('id')									// item id
	]));
}

function decodeDnDItem (e) {
	const [rootElementId, itemType, itemId] = JSON.parse(e.dataTransfer.getData('text/plain'));
	
	let tree;
	for (let [t, el] of map.entries()) {
		if (el === rootElementId) {
			tree = t;
			break;
		}
	}
	
	if (!tree) {
		return null;
	}
	
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



/**
 * @class Item
 * @augments AttributeObservable
 * @property {Node} [parent]
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
const createItem = createAttributeObservable.extend(/** @lends Item.prototype */{
	
	ATTRS: {
		id: {},
		label: {},
	},

	/**
	 * 
	 * @return {Node}
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
			bind: this,
			'data-leaf-id': String(this.get('id')),
			
			draggable: 'true',
			ondragstart: 'treeDnD_start(event)',
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
				return children.map(child => {
					if (!(child instanceof createItem)) {
						child = child.type === 'node' ? createNode(child): createLeaf(child);
						child.parent = this;
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
					expanded:	this.get('expanded'),
					empty:		!this.get('children').length
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
 * @function
 * @param {NodeConfig} config
 * @return {Node}
 */
const createRootNode = createNode.extend({

	LIST_CLASS: 'root',

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
		return this._renderList();
	},
	
});



/**
 * @function
 * @argument {Array.<ItemConfig|Item>} items
 * @return {Node}
 * @see createNode
 */
const createTree = function (items, parentNode) {
	const tree = createRootNode({
		expanded: true,
		children: items,
	});
	
	if (!parentNode.id) {
		parentNode.id = 'tree' + map.size;
	}
	map.set(tree, parentNode.id);
	
	// render now
	projector.append(parentNode, () => tree._render());
	
	// rerender if data changes
	const render = () => projector.scheduleRender();
	tree.after('labelChange', render);
	tree.after('expandedChange', render);
	tree.after('childrenChange', render);
	
	// attach event listeners
	parentNode.addEventListener('click', e => {
		let ie = e.target;
		if (!ie.classList.contains('leaf')) {
			ie = ie.parentNode;
		}
		const item = ie.bind;
		
		if (item instanceof createNode) {
			item.toggle();
		}
	});
	
	return tree;
};

export default createTree;
