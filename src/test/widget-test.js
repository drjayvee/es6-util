/*jshint esnext:true*/
/*global QUnit*/

import {extendFactory} from 'js/oop';
import createWidget, {getByNode} from 'js/widget';

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
