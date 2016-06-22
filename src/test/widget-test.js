/*jshint esnext:true*/
/*global QUnit*/

import {extendFactory} from 'js/oop';
import createWidget, {getByNode} from 'js/widget';
import createWidgetParent from 'js/widgetParent';

const widgets = [];
const nodes = [];

QUnit.module('widget', {
	afterEach: () => {
		while (widgets.length) {
			const b = widgets.pop();
			if (b.get('rendered')) {
				b.destroy();
			}
		}
		
		while (nodes.length) {
			const n = nodes.pop();
			if (n.parentNode) {
				n.parentNode.removeChild(n);
			}
		}
	}
});

QUnit.test('basic Widget render / destroy', function (assert) {
	let widget = createWidget();
	
	widgets.push(widget);
	
	// render
	assert.notOk(widget.get('rendered'), 'Widget\'s rendered ATTR is false by default');
	assert.notOk(widget.node, 'Widgets have no node before render');
	
	widget.render();
	
	assert.ok(widget.get('rendered'), 'Widget\'s rendered ATTR is true after render');
	assert.ok(widget.node, 'Widgets have node after render');
	assert.equal(widget.node.parentNode, document.body, 'Widgets render to document.body by default');
	
	let err = null;
	try {
		widget.render();
	} catch (e) {
		err = e;
	}
	assert.equal('Already rendered', err, 'Cannot re-render widget');
	
	// destroy
	widget.destroy();
	
	assert.notOk(widget.get('rendered'), 'Widget\'s rendered ATTR is false after destroy');
	assert.notOk(widget.node, 'Widgets have no node after destroy');
	
	// re-render
	const container = document.createElement('div');
	nodes.push(container);
	
	widget.render(container);
	
	assert.ok(widget.get('rendered'), 'Widget\'s rendered ATTR is true after render');
	assert.ok(widget.node, 'Widgets have node after render');
	assert.equal(widget.node.parentNode, container, 'Widgets renders to provided parentNode');
});

QUnit.test('Widget node template', function (assert) {
	const createMyWidget = extendFactory(createWidget, {
		NODE_TEMPLATE: '<p><span>Oh hi</span></p>'
	});
	
	let widget = createMyWidget().render();
	widgets.push(widget);
	
	assert.equal(widget.node.nodeName, 'P', 'Widget\'s node has all classes in prototype chain');
	assert.equal(widget.node.innerHTML, '<span>Oh hi</span>', 'Widget node template can include child nodes');
	
});

QUnit.test('Widget node class names', function (assert) {
	const createMySubSubWidget = extendFactory(
		extendFactory(
			extendFactory(
				createWidget, {
					CLASS: 'myWidget'
				}
			), {
				// no CLASS here
			}
		), {
			CLASS: 'mySubSubWidget'
		}
	);
	
	let widget = createMySubSubWidget().render();
	widgets.push(widget);
	
	assert.deepEqual(
		Array.from(widget.node.classList),
		['mySubSubWidget', 'myWidget', 'widget'],
		'Widget\'s node has all classes in prototype chain'
	);
	
	// now try progressive enhancement
	const node = document.createElement('div');
	node.classList.add('stay');
	
	nodes.push(node);
	
	let pew = createMySubSubWidget().enhance(node);
	widgets.push(pew);
	
	assert.deepEqual(
		Array.from(pew.node.classList),
		['stay', 'mySubSubWidget', 'myWidget', 'widget'],
		'Progressively enhanced Widget\'s node has all classes in prototype chain'
	);
});

QUnit.test('Add children to rendered WidgetParent', function (assert) {
	let parent = createWidgetParent().render();
	widgets.push(parent);
	
	// create child and add to parent
	let child1 = createWidget();
	widgets.push(child1);
	
	assert.notOk(parent.contains(child1), 'Parent does not recognize child before add');
	
	parent.add(child1);
	
	assert.ok(parent.contains(child1), 'Parent recognizes unrendered child after add');
	assert.ok(child1.get('rendered'), 'Parent calls child\'s render');
	assert.equal(child1.node.parentNode, parent.node, 'Child renders into parent');
	
	assert.equal(parent.getIndex(child1), 0, 'First child has index 0');
	
	// add rendered child
	let child2 = createWidget().render();
	widgets.push(child2);
	parent.add(child2);
	
	assert.ok(parent.contains(child2), 'Parent recognizes rendered child after add');
	assert.equal(child2.node.parentNode, parent.node, 'Parent places child under its care');
	assert.equal(child2.node.previousElementSibling, child1.node, 'Child nodes are siblings');
	
	assert.equal(parent.getIndex(child2), 1, 'Second child has index 1');
	
	// add child at index 1
	let child3 = createWidget();
	widgets.push(child3);
	parent.add(child3, 1);
	
	assert.equal(parent.getIndex(child1), 0, 'First child kept index 0');
	assert.equal(parent.getIndex(child2), 2, 'Existing child\'s index was adjusted');
	assert.equal(parent.getIndex(child3), 1, 'New child was added at specified index');
	
	// add existing child
	let error = null;
	try {
		parent.add(child1);
	} catch (e) {
		error = e;
	}
	
	assert.equal(error, 'Parent widget already contains child', 'Parent should not accept same child twice');
	
	// add at invalid index
	error = null;
	try {
		parent.add(createWidget(), 4);
	} catch (e) {
		error = e;
	}
	
	assert.equal(error, 'Invalid index', 'Parent should not accept same child twice');
});
