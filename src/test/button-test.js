/*jshint esnext:true*/
/*global QUnit*/

import {Button, ToggleButton} from 'js/button';
import {getByNode} from 'js/widget';

const buttons = [];
const nodes = [];

QUnit.module('button', {
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
	const b = Button();
	
	buttons.push(b);
	
	assert.equal(b.node, null);
	assert.notOk(b.get('rendered'));
	assert.notOk(b.get('disabled'));
	assert.equal('', b.get('label'));
	
	b.set('disabled', true);
	assert.ok(b.get('disabled'));
	
	// render
	b.render();
	assert.ok(b.get('rendered'));
	assert.ok(b.node);
	assert.ok(b.node.disabled);
	assert.equal(b, getByNode(b.node), 'getByNode');
	
	// re-render
	let error = false;
	try {
		b.render();
	} catch (e) {
		error = true;
	}
	assert.ok(error);
	
	// enable
	b.set('disabled', false);
	assert.notOk(b.get('disabled'));
	assert.notOk(b.node.disabled);
	
	// change label
	b.set('label', 'Go');
	assert.equal('Go', b.get('label'));
	assert.equal('Go', b.node.innerHTML);
	
	// destroy
	b.destroy();
	assert.notOk(b.node);
});

QUnit.test('basic ToggleButton', function (assert) {
	const b = ToggleButton();
	
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
	
	const b = Button();
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
	
	const b = ToggleButton();
	b.enhance(node);
	
	assert.ok(b.get('pressed'));
});
