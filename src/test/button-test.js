/*jshint esnext:true*/
/*global QUnit*/

import {Button, ToggleButton} from 'js/button';

QUnit.module('button');

QUnit.test('basic Button', function (assert) {
	const b = Button();
	
	assert.equal(b.node, null);
	assert.notOk(b.get('rendered'));
	assert.notOk(b.get('disabled'));
	
	b.set('disabled', true);
	assert.ok(b.get('disabled'));
	
	b.render();
	assert.ok(b.get('rendered'));
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
