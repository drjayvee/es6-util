/*jshint esnext:true*/
/*global QUnit*/

import {extendFactory} from 'js/oop';
import createWidget, {getByNode} from 'js/widget';
import createWidgetParent from 'js/widgetParent';

const widgets = [];
const nodes = [];

QUnit.module('widget / widgetParent', {
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
	
	assert.throws(() => {widget.render();}, 'Already rendered', 'Cannot re-render widget');
	
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

QUnit.test('widget lifecycle listener / subscription cleanup', function (assert) {
	let attrEvent = null,
		DOMevent = null;
	
	const createMyWidget = extendFactory(createWidget, {
		ATTRS: {
			my: {value: 'precious'}
		},
		
		_bindUI () {
			this._registerListener('click', (e) => {DOMevent = e;});
			
			this._registerSubscriptions(
				this.on('myChange', (e) => {attrEvent = e;})
			);
		}
	});
	
	function testWidget (widget) {
		const node = widget.node;
		
		// cause custom event
		widget.set('my', 'mine');
		assert.ok(attrEvent, 'subscription should be called');
		assert.ok(attrEvent.newVal, 'myChange event.newVal should work like eventTarget');
		
		// cause click DOM event
		const clickEvent = new Event('click');
		node.dispatchEvent(clickEvent);
		
		assert.equal(DOMevent, clickEvent, 'listener should be notified about DOM click event');
		
		// destroy widget, check whether subs and listeners have been removed
		attrEvent = DOMevent = null;
		widget.destroy();
		
		// cause custom event
		widget.set('my', 'mein');
		
		assert.notOk(attrEvent, 'subscription should have been unsubscribed');
		
		// cause DOM event
		node.dispatchEvent(new Event('click'));
		
		assert.notOk(DOMevent, 'listener should have been removed');
	}
	
	const widget = createMyWidget();
	widgets.push(widget);
	
	// render widget and test
	widget.render();
	
	testWidget(widget);
	
	// now progressively enhance a DOM node and try the same
	const node = document.createElement('div');
	document.body.appendChild(node);
	nodes.push(node);
	
	widget.enhance(node);
	
	testWidget(widget);
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

QUnit.test('Add children to WidgetParent', function (assert) {
	let parent = createWidgetParent().render();
	widgets.push(parent);
	
	// create child and add to parent
	let child1 = createWidget();
	widgets.push(child1);
	
	assert.notOk(parent.contains(child1), 'Parent does not recognize child before add');
	
	parent.add(child1);
	
	assert.ok(parent.contains(child1), 'Parent recognizes unrendered child after add');
	assert.equal(parent.getIndex(child1), 0, 'First child has index 0');
	
	// add second child
	let child2 = createWidget();
	widgets.push(child2);
	parent.add(child2);
	
	assert.ok(parent.contains(child2), 'Parent recognizes rendered child after add');
	assert.equal(parent.getIndex(child2), 1, 'Second child has index 1');
	
	// add child at index 1
	let child3 = createWidget();
	widgets.push(child3);
	parent.add(child3, 1);
	
	assert.equal(parent.getIndex(child1), 0, 'First child kept index 0');
	assert.equal(parent.getIndex(child2), 2, 'Existing child\'s index was adjusted');
	assert.equal(parent.getIndex(child3), 1, 'New child was added at specified index');
	
	// add existing child
	assert.throws(
		() => {parent.add(child1);},
		'Parent widget already contains child',
		'Parent should not accept same child twice'
	);
	
	// add at invalid index
	assert.throws(
		() => {parent.add(createWidget(), 4);},
		'Invalid index',
		'Cannot add child at invalid index'
	);
});

QUnit.test('Add children to WidgetParent through init', function (assert) {
	const child1 = createWidget(),
		child2 = createWidget(),
		parent = createWidgetParent({children: [child1, child2]});
	
	assert.ok(parent.contains(child1));
	assert.ok(parent.contains(child2));
	assert.equal(parent.getIndex(child1), 0);
	assert.equal(parent.getIndex(child2), 1);
});

QUnit.test('Add children to rendered WidgetParent', function (assert) {
	let parent = createWidgetParent().render();
	widgets.push(parent);
	
	// create child and add to parent
	let child1 = createWidget();
	widgets.push(child1);
	
	parent.add(child1);
	
	assert.equal(child1.node.parentNode, parent.node, 'Child renders into parent');
	
	// add rendered child
	let child2 = createWidget().render();
	widgets.push(child2);
	parent.add(child2);
	
	assert.equal(child2.node.parentNode, parent.node, 'Parent places child under its care');
	assert.equal(child2.node.previousElementSibling, child1.node, 'Child nodes are siblings');
	
	// add child at index 1
	let child3 = createWidget();
	widgets.push(child3);
	parent.add(child3, 1);	// order should now be child1, child3, child2
	
	assert.equal(child3.node.previousElementSibling, child1.node, 'Child nodes are siblings');
	assert.equal(child2.node.previousElementSibling, child3.node, 'Child nodes are siblings');
	
	// add child at index == length
	let child4 = createWidget();
	widgets.push(child4);
	parent.add(child4, 3);
	
	assert.equal(parent.node.childNodes[3], child4.node, 'Parent should append child node if index === length');
});

QUnit.test('child events bubble up to parents', function (assert) {
	let parent = createWidgetParent(),
		child = createWidget();
	
	parent.add(child);
	
	let ev = null;
	parent.on('hey', (e) => {ev = e;});
	
	child.fire('hey');
	
	assert.ok(ev, 'child event bubbles to parent');
	assert.equal(ev.originalTarget, child, 'event.originalTarget is child');
});
