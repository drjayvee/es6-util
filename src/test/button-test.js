/*jshint esnext:true*/
/*global QUnit*/

import {createButton, createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';
import {getByNode} from 'js/widget';

const buttons = [];
const nodes = [];

QUnit.module('button / buttonGroup', {
	afterEach: () => {
		while (buttons.length) {
			let b = buttons.pop();
			if (b.get('rendered')) {
				b.destroy();
			}
		}
		
		while (nodes.length) {
			let n = nodes.pop();
			n.parentNode.removeChild(n);
		}
	}
});

QUnit.test('basic Button', function (assert) {
	const b = createButton();
	
	buttons.push(b);
	
	assert.notOk(b.get('disabled'));
	assert.equal('', b.get('label'));
	
	b.set('disabled', true);
	assert.ok(b.get('disabled'));
	
	// render
	b.render();
	assert.ok(b.node.disabled);
	assert.equal(b, getByNode(b.node), 'getByNode');
	
	// enable
	b.set('disabled', false);
	assert.notOk(b.get('disabled'));
	assert.notOk(b.node.disabled);
	
	// change label
	b.set('label', 'Go');
	assert.equal('Go', b.get('label'));
	assert.equal('Go', b.node.innerHTML);
});

QUnit.test('basic ToggleButton', function (assert) {
	const b = createToggleButton();
	
	buttons.push(b);
	
	assert.notOk(b.get('pressed'));
	
	b.toggle();
	
	assert.ok(b.get('pressed'));
	
	b.render();
	assert.ok(b.node.classList.contains('pressed'));
	
	b.toggle(true);
	
	assert.ok(b.get('pressed'));
	
	b.toggle();
	
	assert.notOk(b.get('pressed'));
	assert.notOk(b.node.classList.contains('pressed'));
	
	b.toggle(false);
	
	assert.notOk(b.get('pressed'));
});

QUnit.test('enhance Button', function (assert) {
	const node = document.createElement('button');
	
	nodes.push(node);
	
	node.setAttribute('type', 'button');
	node.innerHTML = 'Oh hi';
	node.disabled = true;
	document.body.appendChild(node);
	
	const b = createButton();
	b.enhance(node);
	
	assert.equal('Oh hi', b.get('label'));
	assert.ok(b.get('disabled'));
});

QUnit.test('enhance ToggleButton', function (assert) {
	const node = document.createElement('button');
	
	nodes.push(node);
	
	node.setAttribute('type', 'button');
	node.innerHTML = 'Oh hi';
	node.classList.add('pressed');
	document.body.appendChild(node);
	
	const b = createToggleButton();
	b.enhance(node);
	
	assert.ok(b.get('pressed'));
});

QUnit.test('regular ButtonGroup', function (assert) {
	const b1 = createToggleButton(),
		b2 = createToggleButton(),
		group = createButtonGroup({children: [b1, b2]});
	
	buttons.push(group);
	
	let selectionChangeEvent = null;
	group.after('selectionChange', (e) => selectionChangeEvent = e);
	
	assert.deepEqual(group.getPressedButtons(), [], 'no buttons pressed');
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b2], 'one button pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b1, b2], 'one button pressed');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b1], 'one button pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [], 'no buttons pressed');
});

QUnit.test('radio ButtonGroup', function (assert) {
	const b1 = createToggleButton(),
		b2 = createToggleButton(),
		group = createButtonGroup({children: [b1, b2], radio: true});
	
	buttons.push(group);
	
	let selectionChangeEvent = null;
	group.after('selectionChange', (e) => selectionChangeEvent = e);
	
	assert.deepEqual(group.getPressedButtons(), [], 'no buttons pressed');
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b2], 'one button pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b1], 'pressing a different button makes that the only pressed one');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.deepEqual(group.getPressedButtons(), [b2], 'idem dito');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.notOk(selectionChangeEvent, 'selectionChange event was not fired');
	assert.deepEqual(group.getPressedButtons(), [b2], 'cannot unpress pressed button');
});
