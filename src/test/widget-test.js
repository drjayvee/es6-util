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
	
	assert.throws(() => {widget.render();}, /^Already rendered$/, 'Cannot re-render widget');
	
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
			this.addEventListener('click', (e) => {DOMevent = e;});
			
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
	
	const pwidget = createMyWidget({
		enhance: node
	});
	
	testWidget(pwidget);
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
		['mySubSubWidget', 'myWidget', 'yui3-widget'],
		'Widget\'s node has all classes in prototype chain'
	);
	
	// now try progressive enhancement
	const node = document.createElement('div');
	node.classList.add('stay');
	
	nodes.push(node);
	
	let pew = createMySubSubWidget({enhance: node});
	widgets.push(pew);
	
	assert.deepEqual(
		Array.from(pew.node.classList),
		['stay', 'mySubSubWidget', 'myWidget', 'yui3-widget'],
		'Progressively enhanced Widget\'s node has all classes in prototype chain'
	);
});

QUnit.test('Attributes hidden and visible synced to DOM node', function (assert) {
	let widget = createWidget().render();
	
	widgets.push(widget);
	
	assert.notOk(widget.node.hidden);
	assert.notOk(widget.node.style.visibility);
	
	widget.hide();
	assert.notOk(widget.node.hidden);
	assert.equal(widget.node.style.visibility, 'hidden');
	
	widget.hide(true);
	assert.ok(widget.node.hidden);
	assert.equal(widget.node.style.visibility, 'hidden');
	
	widget.show();
	assert.ok(widget.node.hidden);
	assert.notOk(widget.node.style.visibility);
	
	widget.show(true);
	assert.notOk(widget.node.hidden);
	assert.notOk(widget.node.style.visibility);
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
		/^Parent widget already contains child$/,
		'Parent should not accept same child twice'
	);
	
	// add at invalid index
	assert.throws(
		() => {parent.add(createWidget(), 4);},
		/^Invalid index$/,
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

QUnit.test('Remove children from WidgetParent', function (assert) {
	let parent = createWidgetParent().render();
	widgets.push(parent);
	
	// create child and add to parent, then remove
	let child = createWidget();
	widgets.push(child);
	
	parent.add(child);
	
	let childEvent = null;
	parent.on('childEv', e => childEvent = e);
	
	let removeEvent = null;
	parent.on('removeChild', e => removeEvent = e);
	
	parent.removeChild(child);
	
	// childEvent doesn't bubble
	child.fire('childEv');
	assert.notOk(childEvent);
	
	// removeChild event
	assert.ok(removeEvent, 'removeChild event was fired');
	assert.equal(removeEvent.index, 0);
	assert.equal(removeEvent.child, child);
	
	// removed from DOM
	assert.notOk(parent.node.contains(child.node));
	
	// parent should not recognize orphan
	assert.throws(
		() => parent.getIndex(child),
		/^Not a child$/,
		'Parent should not return index for removed child'
	);
	
	assert.throws(
		() => parent.removeChild(child),
		/^Not a child$/,
		'Parent should not return index for removed child'
	);
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
	
	ev = null;
	parent.removeChild(child);
	child.fire('hey');
	assert.notOk(ev, 'removed child\'s event should not bubble to parent');
});

QUnit.test('progressively enhanced widgets override provided attrs with node', function (assert) {
	const createMyWidget = extendFactory(createWidget, {
		ATTRS: {
			content: {value: 'default'}
		},
		_enhance () {
			this.set('content', this.node.innerHTML);
		}
	});
	
	// conflicting default value
	const sourceNode1 = document.createElement('div');
	sourceNode1.innerHTML = 'html';
	nodes.push(sourceNode1);
	
	const widget1 = createMyWidget({
		enhance: sourceNode1
	});
	widgets.push(widget1);
	
	assert.equal(widget1.get('content'), 'html');
	
	// conflicting attr value in init
	const sourceNode2 = document.createElement('div');
	sourceNode2.innerHTML = 'html';
	nodes.push(sourceNode2);
	
	const widget2 = createMyWidget({
		content: 'init',
		enhance: sourceNode2
	});
	widgets.push(widget2);
	
	assert.equal(widget2.get('content'), 'html');
});
