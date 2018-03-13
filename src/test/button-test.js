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
	assert.equal('', b.get('value'));
	
	b.set('disabled', true);
	assert.ok(b.get('disabled'));
	
	// render
	b.render();
	assert.ok(b.node.disabled);
	assert.equal('', b.node.value);
	assert.equal(b, getByNode(b.node), 'getByNode');
	
	// enable
	b.set('disabled', false);
	assert.notOk(b.get('disabled'));
	assert.notOk(b.node.disabled);
	
	// change label
	b.set('label', 'Go');
	assert.equal('Go', b.get('label'));
	assert.equal('Go', b.node.innerHTML);
	
	// change value
	b.set('value', 'on');
	assert.equal('on', b.get('value'));
	assert.equal('on', b.node.value);
	
	// className
	const c = createButton({
		classNames: ['pwn', 'w00t']
	});
	
	buttons.push(c);
	c.render();
	
	assert.ok(c.node.classList.contains('pwn'), c.node.classList.contains('w00t'));
	
	// action
	let actionCbCalled = false;
	const ab = createButton({
		action: () => actionCbCalled = true
	});
	
	buttons.push(ab);
	ab.render();
	
	assert.ok(typeof ab.action === 'function');
	
	ab.node.dispatchEvent(new Event('click'));
	assert.ok(actionCbCalled);
	
	actionCbCalled = false;
	ab.action();
	assert.ok(actionCbCalled);
});

QUnit.test('basic ToggleButton', function (assert) {
	const b = createToggleButton();
	
	buttons.push(b);
	
	assert.notOk(b.get('pressed'));
	
	b.toggle();
	
	assert.ok(b.get('pressed'));
	
	b.render();
	assert.ok(b.node.classList.contains('yui3-button-selected'));
	
	b.toggle(true);
	
	assert.ok(b.get('pressed'));
	
	b.toggle();
	
	assert.notOk(b.get('pressed'));
	assert.notOk(b.node.classList.contains('yui3-button-selected'));
	
	b.toggle(false);
	
	assert.notOk(b.get('pressed'));
});

QUnit.test('enhance Button', function (assert) {
	const node = document.createElement('button');
	
	nodes.push(node);
	
	node.setAttribute('type', 'button');
	node.disabled = true;
	node.innerHTML = 'Oh hi';
	node.value = 'there';
	document.body.appendChild(node);
	
	const b = createButton({
		enhance: node
	});
	
	assert.ok(b.get('disabled'));
	assert.equal('Oh hi', b.get('label'));
	assert.equal('there', b.get('value'));
});

QUnit.test('enhance ToggleButton', function (assert) {
	const node = document.createElement('button');
	
	nodes.push(node);
	
	node.setAttribute('type', 'button');
	node.innerHTML = 'Oh hi';
	node.classList.add('yui3-button-selected');
	document.body.appendChild(node);
	
	const b = createToggleButton({
		enhance: node
	});
	
	assert.ok(b.get('pressed'));
});

QUnit.test('regular ButtonGroup', function (assert) {
	const b1 = createToggleButton({value: 'v1'}),
		b2 = createToggleButton({value: 'v2'}),
		group = createButtonGroup({children: [b1, b2]});
	
	buttons.push(group);
	
	let selectionChangeEvent = null;
	group.after('selectionChange', e => selectionChangeEvent = e);
	
	assert.deepEqual(group.getPressedButtons(), [], 'no buttons pressed');
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b2, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v2'], 'event.values is correct');
	assert.deepEqual(group.getValues(), ['v2'], 'getValues returns correct values');
	assert.deepEqual(group.getPressedButtons(), [b2], 'b2 button pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b1, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v1', 'v2'], 'event.value is correct');
	assert.deepEqual(group.getValues(), ['v1', 'v2'], 'getValues returns correct values');
	assert.deepEqual(group.getPressedButtons(), [b1, b2], 'b1 and b2 pressed');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b2, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v1'], 'event.values is correct');
	assert.deepEqual(group.getPressedButtons(), [b1], 'b1 pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b1, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, [], 'event.values is correct');
	assert.deepEqual(group.getPressedButtons(), [], 'no button pressed');
	
	group.disable();
	assert.ok(b1.get('disabled') && b2.get('disabled'), 'buttons disabled');
	
	group.enable();
	assert.notOk(b1.get('disabled') || b2.get('disabled'), 'buttons enabled');
});

QUnit.test('radio ButtonGroup', function (assert) {
	const b1 = createToggleButton({value: 'v1'}),
		b2 = createToggleButton({value: 'v2'}),
		group = createButtonGroup({children: [b1, b2], radio: true});
	
	buttons.push(group);
	
	let selectionChangeEvent = null;
	group.after('selectionChange', e => selectionChangeEvent = e);
	
	assert.deepEqual(group.getPressedButtons(), [], 'no buttons pressed');
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b2, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v2'], 'event.values is correct');
	assert.deepEqual(group.getPressedButtons(), [b2], 'one button pressed');
	
	selectionChangeEvent = null;
	
	b1.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b1, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v1'], 'event.values is correct');
	assert.deepEqual(group.getPressedButtons(), [b1], 'pressing a different button makes that the only pressed one');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.ok(selectionChangeEvent, 'selectionChange event was fired');
	assert.equal(selectionChangeEvent.button, b2, 'event.originalTarget is correct');
	assert.deepEqual(selectionChangeEvent.values, ['v2'], 'event.values is correct');
	assert.deepEqual(group.getPressedButtons(), [b2], 'correct button is pressed');
	
	selectionChangeEvent = null;
	
	b2.toggle();
	assert.notOk(selectionChangeEvent, 'selectionChange event was not fired');
	assert.deepEqual(group.getPressedButtons(), [b2], 'cannot unpress pressed button');
	
	group.disable();
	assert.ok(b1.get('disabled') && b2.get('disabled'), 'buttons disabled');
	
	group.enable();
	assert.notOk(b1.get('disabled') || b2.get('disabled'), 'buttons enabled');
});
