/*jshint esnext:true*/
/*global QUnit*/

import {Button, ToggleButton} from 'js/button';
import {getByNode} from 'js/widget';

QUnit.module('button');

QUnit.test('basic Button', function (assert) {
	const b = Button();
	
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
	assert.equal(b, getByNode(b.node), 'getByNdde');
	
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
});

QUnit.test('basic ToggleButton', function (assert) {
	const b = ToggleButton();
	
	assert.notOk(b.get('pressed'));
	
	b.toggle();
	
	assert.ok(b.get('pressed'));
	
	b.toggle(true);
	
	assert.ok(b.get('pressed'));
	
	b.toggle();
	
	assert.notOk(b.get('pressed'));
	
	b.toggle(false);
	
	assert.notOk(b.get('pressed'));
});
